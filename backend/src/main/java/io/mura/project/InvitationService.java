package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.common.i18n.Texts;
import io.mura.mail.MailService;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.dto.CreateInvitationRequest;
import io.mura.project.dto.InvitationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Invitations to join a project: sending them, cancelling them, and the
 * invitee answering. An invitation lapses after a configured number of
 * days; expiry is applied whenever an invitation is read, not by a
 * scheduled sweep.
 */
@Service
public class InvitationService {

    private final ProjectAccessGuard access;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    private final Duration lifetime;

    /**
     * Builds the service with its collaborators and the invitations' window.
     *
     * @param access the project access checks
     * @param projectMemberRepository the teams
     * @param invitationRepository the invitations
     * @param userRepository the accounts
     * @param mailService the mail sender
     * @param lifetimeDays how many days an invitation can be answered, from
     *        {@code mura.invitations.lifetime-days}
     */
    public InvitationService(
            ProjectAccessGuard access,
            ProjectMemberRepository projectMemberRepository,
            ProjectInvitationRepository invitationRepository,
            UserRepository userRepository,
            MailService mailService,
            @Value("${mura.invitations.lifetime-days}") long lifetimeDays
    ) {
        this.access = access;
        this.projectMemberRepository = projectMemberRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.lifetime = Duration.ofDays(lifetimeDays);
    }

    /**
     * Invites an existing account onto the project, in the actor's name, and
     * mails them. A refused or lapsed invitation for the same person is
     * replaced; the invitation itself lapses after the configured number of
     * days.
     *
     * @param actorId the owner or an admin of the project
     * @param projectId the project
     * @param request the invitee's address
     * @return the invitation
     * @throws ApiException 403 unless the actor manages the project, 404 if no
     *         account uses the email, 409 if the person is already on the
     *         team or already has an invitation waiting
     */
    @Transactional
    public InvitationResponse invite(UUID actorId, UUID projectId, CreateInvitationRequest request) {
        ProjectMember manager = access.requireManager(actorId, projectId);
        Project project = manager.getProject();
        User inviter = manager.getUser();

        String email = request.email().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte Mura n'utilise l'email " + email + "."
                ));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, Texts.get("error.invitation.alreadyMember", user.getUsername()));
        }

        expireStale(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(
                projectId, user.getId(), InvitationStatus.PENDING));

        if (invitationRepository.existsByProjectIdAndInvitedUserIdAndStatus(
                projectId, user.getId(), InvitationStatus.PENDING)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    Texts.get("error.invitation.alreadyPending", user.getUsername())
            );
        }

        invitationRepository.deleteAll(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(
                projectId, user.getId(), InvitationStatus.DECLINED));
        invitationRepository.deleteAll(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(
                projectId, user.getId(), InvitationStatus.EXPIRED));

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setInvitedUser(user);
        invitation.setInvitedBy(inviter);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setCreatedAt(Instant.now());

        invitationRepository.save(invitation);
        mailService.sendProjectInvitation(
                user.getEmail(), user.getUsername(),
                inviter.getUsername(), project.getName(), user.getLocale());

        return toResponse(invitation);
    }

    /**
     * Invites everyone listed when a project is created. The caller owns the
     * transaction: one unknown address rolls the whole creation back, so
     * nobody ends up with a project half of whose team is missing. Each
     * address is invited once, whatever its case, and mailed once the
     * creation commits.
     *
     * @param project the project just created
     * @param owner its creator, who sends the invitations
     * @param emails the addresses listed; blanks and repeats are ignored
     * @return the invitations sent
     * @throws ApiException 404 for an address no account uses, 409 if the
     *         creator listed their own
     */
    @Transactional
    public List<InvitationResponse> inviteAll(Project project, User owner, List<String> emails) {
        if (emails == null || emails.isEmpty()) {
            return List.of();
        }

        List<User> invitees = emails.stream()
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .map(String::toLowerCase)
                .distinct()
                .map(email -> {
                    if (email.equalsIgnoreCase(owner.getEmail())) {
                        throw new ApiException(
                                HttpStatus.CONFLICT,
                                "error.invitation.notYourself"
                        );
                    }

                    return userRepository.findByEmailIgnoreCase(email)
                            .orElseThrow(() -> new ApiException(
                                    HttpStatus.NOT_FOUND,
                                    "Aucun compte Mura n'utilise l'email " + email + "."
                            ));
                })
                .toList();

        return invitees.stream()
                .map(user -> {
                    ProjectInvitation invitation = new ProjectInvitation();
                    invitation.setProject(project);
                    invitation.setInvitedUser(user);
                    invitation.setInvitedBy(owner);
                    invitation.setStatus(InvitationStatus.PENDING);
                    invitation.setCreatedAt(Instant.now());
                    invitationRepository.save(invitation);

                    mailService.sendProjectInvitation(
                            user.getEmail(), user.getUsername(),
                            owner.getUsername(), project.getName(), user.getLocale());

                    return toResponse(invitation);
                })
                .toList();
    }

    /**
     * A project's invitations that did not end in a member: waiting, refused
     * or lapsed. Any member may read them; only managers act on them. Not
     * read-only: reading is what applies expiry.
     *
     * @param userId the reader, who must be on the team
     * @param projectId the project
     * @return the invitations, oldest first
     * @throws ApiException 404 if the project does not exist, 403 if the
     *         reader is not on it
     */
    @Transactional
    public List<InvitationResponse> listOpenForProject(UUID userId, UUID projectId) {
        access.requireMembership(userId, projectId);

        return expireStale(invitationRepository.findAllOpenForProject(projectId)).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * The invitations waiting on a person, dismissed from the bell or not.
     * Anything that has lapsed is marked expired and left out in the same
     * breath, so nobody is offered a dead invitation.
     *
     * @param userId the invitee
     * @return their pending invitations, oldest first
     */
    @Transactional
    public List<InvitationResponse> listPendingForUser(UUID userId) {
        return expireStale(invitationRepository.findAllForUser(userId, InvitationStatus.PENDING)).stream()
                .filter(i -> i.getStatus() == InvitationStatus.PENDING)
                .map(this::toResponse)
                .toList();
    }

    /**
     * Withdraws a pending invitation. The invitee is not told.
     *
     * @param actorId the owner or an admin of the project
     * @param projectId the project
     * @param invitationId the invitation
     * @throws ApiException 403 unless the actor manages the project; 404 if
     *         the invitation does not exist or belongs to another project;
     *         409 if it has lapsed or was already answered
     */
    @Transactional
    public void cancel(UUID actorId, UUID projectId, UUID invitationId) {
        access.requireManager(actorId, projectId);
        ProjectInvitation invitation = requirePendingInvitation(invitationId);

        if (!invitation.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.invitation.notFound");
        }

        invitationRepository.delete(invitation);
    }

    /**
     * Joins the project as a plain member. Only the invitee may answer.
     *
     * @param userId the invitee
     * @param invitationId the invitation
     * @return the invitation, accepted
     * @throws ApiException 404 if it does not exist, 403 for anyone but the
     *         invitee, 409 if it has lapsed or was already answered
     */
    @Transactional
    public InvitationResponse accept(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireOwnInvitation(userId, invitationId);
        Project project = invitation.getProject();

        if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), userId)) {
            projectMemberRepository.save(
                    new ProjectMember(project, invitation.getInvitedUser(), ProjectRole.MEMBER)
            );
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(Instant.now());

        return toResponse(invitation);
    }

    /**
     * Turns the invitation down. The project can invite the person again;
     * the new invitation replaces this one.
     *
     * @param userId the invitee
     * @param invitationId the invitation
     * @return the invitation, declined
     * @throws ApiException 404 if it does not exist, 403 for anyone but the
     *         invitee, 409 if it has lapsed or was already answered
     */
    @Transactional
    public InvitationResponse decline(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireOwnInvitation(userId, invitationId);
        invitation.setStatus(InvitationStatus.DECLINED);
        invitation.setRespondedAt(Instant.now());
        return toResponse(invitation);
    }

    /**
     * Marks the invitation as read in the bell. Opening the notification is
     * all it takes: the bell stops counting it, while the invitation itself
     * stays pending until it is answered. Reading it again keeps the first
     * date.
     *
     * @param userId the invitee
     * @param invitationId the invitation, whatever its status
     * @return the invitation
     * @throws ApiException 404 if it does not exist, 403 for anyone but the
     *         invitee
     */
    @Transactional
    public InvitationResponse markRead(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireAddressedTo(userId, invitationId);

        if (invitation.getReadAt() == null) {
            invitation.setReadAt(Instant.now());
        }

        return toResponse(invitation);
    }

    /**
     * Clears the notification, not the invitation: the bell forgets it, the
     * projects list still offers it. Answering stays a separate act.
     * Clearing it also counts as having read it.
     *
     * @param userId the invitee
     * @param invitationId the invitation, whatever its status
     * @return the invitation
     * @throws ApiException 404 if it does not exist, 403 for anyone but the
     *         invitee
     */
    @Transactional
    public InvitationResponse dismiss(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireAddressedTo(userId, invitationId);

        if (invitation.getDismissedAt() == null) {
            invitation.setDismissedAt(Instant.now());
        }
        if (invitation.getReadAt() == null) {
            invitation.setReadAt(Instant.now());
        }

        return toResponse(invitation);
    }

    private InvitationResponse toResponse(ProjectInvitation invitation) {
        return InvitationResponse.from(invitation, expiryOf(invitation));
    }

    private Instant expiryOf(ProjectInvitation invitation) {
        return invitation.getCreatedAt().plus(lifetime);
    }

    private List<ProjectInvitation> expireStale(List<ProjectInvitation> invitations) {
        Instant now = Instant.now();
        List<ProjectInvitation> lapsed = invitations.stream()
                .filter(i -> i.getStatus() == InvitationStatus.PENDING)
                .filter(i -> expiryOf(i).isBefore(now))
                .toList();

        lapsed.forEach(i -> {
            i.setStatus(InvitationStatus.EXPIRED);
            i.setRespondedAt(now);
        });

        if (!lapsed.isEmpty()) {
            invitationRepository.flush();
        }

        return invitations;
    }

    private ProjectInvitation expireStale(ProjectInvitation invitation) {
        expireStale(List.of(invitation));
        return invitation;
    }
    private ProjectInvitation requireAddressedTo(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.invitation.notFound"));

        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.invitation.notYours");
        }

        return invitation;
    }

    private ProjectInvitation requireOwnInvitation(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requirePendingInvitation(invitationId);

        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.invitation.notYours");
        }

        return invitation;
    }

    private ProjectInvitation requirePendingInvitation(UUID invitationId) {
        ProjectInvitation invitation = expireStale(invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.invitation.notFound")));

        if (invitation.getStatus() == InvitationStatus.EXPIRED) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "error.invitation.expired"
            );
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "error.invitation.answered");
        }

        return invitation;
    }
}
