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
        Project project = requireOwner(actorId, projectId);

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

    @Transactional(readOnly = true)
    public List<InvitationResponse> listPendingForProject(UUID userId, UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable.");
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet.");
        }

        return invitationRepository.findAllForProject(projectId, InvitationStatus.PENDING).stream()
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
        requireOwner(actorId, projectId);
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

    private Project requireOwner(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Seul le propriétaire du projet peut inviter ou retirer des personnes."
            );
        }

        return project;
    }
}
