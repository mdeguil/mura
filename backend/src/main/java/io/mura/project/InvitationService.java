package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.dto.CreateInvitationRequest;
import io.mura.project.dto.InvitationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository invitationRepository;
    private final UserRepository userRepository;

    @Transactional
    public InvitationResponse invite(UUID actorId, UUID projectId, CreateInvitationRequest request) {
        Project project = requireManager(actorId, projectId);

        String email = request.email().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte Mura n'utilise l'email " + email + "."
                ));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, user.getUsername() + " fait déjà partie du projet.");
        }

        if (invitationRepository.existsByProjectIdAndInvitedUserIdAndStatus(
                projectId, user.getId(), InvitationStatus.PENDING)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    user.getUsername() + " a déjà une invitation en attente pour ce projet."
            );
        }

        // Someone can be asked again after refusing, and the new invitation
        // replaces the refusal rather than sitting next to it.
        invitationRepository.deleteAll(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(
                projectId, user.getId(), InvitationStatus.DECLINED));

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setInvitedUser(user);
        invitation.setInvitedBy(project.getOwner());
        invitation.setStatus(InvitationStatus.PENDING);
        // Set eagerly rather than leaving it to @PrePersist: the response is
        // built before Hibernate flushes the insert.
        invitation.setCreatedAt(Instant.now());

        return InvitationResponse.from(invitationRepository.save(invitation));
    }


    // Used when a project is created with people already listed. The caller
    // owns the transaction: one unknown address rolls the whole creation
    // back, so nobody ends up with a project half of whose team is missing.
    @Transactional
    public List<InvitationResponse> inviteAll(Project project, User owner, List<String> emails) {
        if (emails == null || emails.isEmpty()) {
            return List.of();
        }

        return emails.stream()
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .map(String::toLowerCase)
                .distinct()
                .map(email -> {
                    if (email.equalsIgnoreCase(owner.getEmail())) {
                        throw new ApiException(
                                HttpStatus.CONFLICT,
                                "Tu n'as pas besoin de t'inviter toi-même."
                        );
                    }

                    User user = userRepository.findByEmailIgnoreCase(email)
                            .orElseThrow(() -> new ApiException(
                                    HttpStatus.NOT_FOUND,
                                    "Aucun compte Mura n'utilise l'email " + email + "."
                            ));

                    ProjectInvitation invitation = new ProjectInvitation();
                    invitation.setProject(project);
                    invitation.setInvitedUser(user);
                    invitation.setInvitedBy(owner);
                    invitation.setStatus(InvitationStatus.PENDING);
                    invitation.setCreatedAt(Instant.now());

                    return InvitationResponse.from(invitationRepository.save(invitation));
                })
                .toList();
    }
    @Transactional(readOnly = true)
    public List<InvitationResponse> listOpenForProject(UUID userId, UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable.");
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet.");
        }

        return invitationRepository.findAllOpenForProject(projectId).stream()
                .map(InvitationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listPendingForUser(UUID userId) {
        return invitationRepository.findAllForUser(userId, InvitationStatus.PENDING).stream()
                .map(InvitationResponse::from)
                .toList();
    }

    @Transactional
    public void cancel(UUID actorId, UUID projectId, UUID invitationId) {
        requireManager(actorId, projectId);
        ProjectInvitation invitation = requirePendingInvitation(invitationId);

        if (!invitation.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Invitation introuvable.");
        }

        invitationRepository.delete(invitation);
    }

    @Transactional
    public InvitationResponse accept(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireOwnInvitation(userId, invitationId);
        Project project = invitation.getProject();

        // Accepting is what creates membership — and the only thing that does,
        // so nothing here can hand out access on its own.
        if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), userId)) {
            projectMemberRepository.save(
                    new ProjectMember(project, invitation.getInvitedUser(), ProjectRole.MEMBER)
            );
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(Instant.now());

        return InvitationResponse.from(invitation);
    }

    @Transactional
    public InvitationResponse decline(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireOwnInvitation(userId, invitationId);
        invitation.setStatus(InvitationStatus.DECLINED);
        invitation.setRespondedAt(Instant.now());
        return InvitationResponse.from(invitation);
    }


    // Opening the notification is all it takes: the bell stops counting it,
    // while the invitation itself stays pending until it is answered.
    @Transactional
    public InvitationResponse markRead(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireAddressedTo(userId, invitationId);

        // Clicking the same notification twice is normal, so re-reading is a
        // no-op rather than an error.
        if (invitation.getReadAt() == null) {
            invitation.setReadAt(Instant.now());
        }

        return InvitationResponse.from(invitation);
    }

    // Clearing the notification, not the invitation: the bell forgets it,
    // the projects list still offers it. Answering stays a separate act.
    @Transactional
    public InvitationResponse dismiss(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requireAddressedTo(userId, invitationId);

        if (invitation.getDismissedAt() == null) {
            invitation.setDismissedAt(Instant.now());
        }
        // Clearing it counts as having seen it.
        if (invitation.getReadAt() == null) {
            invitation.setReadAt(Instant.now());
        }

        return InvitationResponse.from(invitation);
    }

    // Read and dismiss both act on a notification rather than on the
    // invitation's outcome, so they accept it whatever its status: only the
    // person it was sent to may touch it.
    private ProjectInvitation requireAddressedTo(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation introuvable."));

        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette invitation ne t'est pas adressée.");
        }

        return invitation;
    }

    private ProjectInvitation requireOwnInvitation(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = requirePendingInvitation(invitationId);

        // Answering is the invitee's call alone: not the owner's, not another
        // member's.
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette invitation ne t'est pas adressée.");
        }

        return invitation;
    }

    private ProjectInvitation requirePendingInvitation(UUID invitationId) {
        ProjectInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation introuvable."));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Cette invitation a déjà reçu une réponse.");
        }

        return invitation;
    }

    // Inviting and cancelling are open to the owner and to admins. The check
    // lives here rather than calling ProjectService, which already depends on
    // this service to invite people at creation time.
    private Project requireManager(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        ProjectRole role = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(ProjectMember::getRole)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet."));

        if (!role.manages()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Il faut être propriétaire ou administrateur du projet pour inviter ou retirer des personnes."
            );
        }

        return project;
    }
}
