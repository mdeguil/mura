package io.mura.auth;

import io.mura.auth.dto.DataExport;
import io.mura.common.exception.ApiException;
import io.mura.group.UserGroupMemberRepository;
import io.mura.member.ContactRepository;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.NotificationRepository;
import io.mura.project.ProjectInvitationRepository;
import io.mura.project.ProjectMemberRepository;
import io.mura.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

// One person's data, gathered for them to take away: the right of access
// and the right to portability (RGPD, art. 15 and 20), without having to
// ask anybody. Only what concerns them -- their own account, the projects
// and groups they are in, the tasks in their charge, their carnet, their
// invitations and notifications -- never other people's work.
@Service
@RequiredArgsConstructor
public class DataExportService {

    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final UserGroupMemberRepository groupMemberRepository;
    private final ContactRepository contactRepository;
    private final ProjectInvitationRepository invitationRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public DataExport export(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ce compte n'existe pas."));

        return new DataExport(
                Instant.now(),
                new DataExport.Account(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getAccountRole().name(),
                        user.getCreatedAt(),
                        user.getEmailVerifiedAt(),
                        user.getSuspendedAt()
                ),
                projectMemberRepository.findAllForUser(userId).stream()
                        .map(m -> new DataExport.ProjectEntry(
                                m.getProject().getName(),
                                m.getProject().getDescription(),
                                m.getRole().name(),
                                m.getProject().getOwner().getUsername(),
                                m.getProject().getStatus().name(),
                                m.getProject().getStartDate(),
                                m.getProject().isArchived(),
                                m.getJoinedAt()))
                        .toList(),
                taskRepository.findAllAssignedTo(userId).stream()
                        .map(t -> new DataExport.TaskEntry(
                                t.getName(),
                                t.getDescription(),
                                t.getProject().getName(),
                                t.getStatus().name(),
                                t.getStartDate(),
                                t.getEndDate(),
                                t.isArchived()))
                        .toList(),
                groupMemberRepository.findAllForUser(userId).stream()
                        .map(m -> new DataExport.GroupEntry(
                                m.getGroup().getName(),
                                m.getGroup().getOwner().getUsername(),
                                m.isOnHold(),
                                m.getJoinedAt()))
                        .toList(),
                contactRepository.findAllForOwner(userId).stream()
                        .map(c -> new DataExport.ContactEntry(
                                c.getPerson().getUsername(),
                                c.getStatus().name(),
                                c.isFavourite(),
                                c.isHidden(),
                                c.getCreatedAt()))
                        .toList(),
                contactRepository.findPendingForPerson(userId).stream()
                        .map(c -> new DataExport.ContactEntry(
                                c.getOwner().getUsername(),
                                c.getStatus().name(),
                                false,
                                false,
                                c.getCreatedAt()))
                        .toList(),
                invitationRepository.findAllInvolving(userId).stream()
                        .map(i -> new DataExport.InvitationEntry(
                                i.getProject().getName(),
                                i.getInvitedUser().getId().equals(userId) ? "RECEIVED" : "SENT",
                                i.getInvitedUser().getUsername(),
                                i.getInvitedBy().getUsername(),
                                i.getStatus().name(),
                                i.getCreatedAt(),
                                i.getRespondedAt()))
                        .toList(),
                notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(n -> new DataExport.NotificationEntry(
                                n.getType().name(),
                                n.getProjectName() != null ? n.getProjectName() : n.getGroupName(),
                                n.getActorName(),
                                n.getMessage(),
                                n.getReadAt() != null,
                                n.getCreatedAt()))
                        .toList()
        );
    }
}
