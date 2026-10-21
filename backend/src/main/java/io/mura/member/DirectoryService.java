package io.mura.member;

import io.mura.member.dto.KnownUserResponse;
import io.mura.project.Project;
import io.mura.project.ProjectMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DirectoryService {

    private final DirectoryRepository directoryRepository;

    @Transactional(readOnly = true)
    public List<KnownUserResponse> listKnownTo(UUID userId) {
        Map<UUID, User> people = new LinkedHashMap<>();
        Map<UUID, List<KnownUserResponse.SharedProject>> shared = new LinkedHashMap<>();

        for (ProjectMember membership : directoryRepository.findSharedMemberships(userId)) {
            User person = membership.getUser();
            people.putIfAbsent(person.getId(), person);

            Project project = membership.getProject();
            shared.computeIfAbsent(person.getId(), id -> new ArrayList<>())
                    .add(new KnownUserResponse.SharedProject(
                            project.getId(), project.getName(), project.getColor()));
        }

        // Invitation counterparts are known too, even with nothing in common
        // yet — which is exactly who you would reach for next.
        for (User person : directoryRepository.findInvitedByMe(userId)) {
            people.putIfAbsent(person.getId(), person);
        }
        for (User person : directoryRepository.findWhoInvitedMe(userId)) {
            people.putIfAbsent(person.getId(), person);
        }

        return people.values().stream()
                .map(person -> new KnownUserResponse(
                        person.getId(),
                        person.getUsername(),
                        person.getEmail(),
                        person.getAvatarUrl(),
                        shared.getOrDefault(person.getId(), List.of())
                ))
                // Most shared projects first, then alphabetically: the people
                // you work with most come to the top on their own.
                .sorted(Comparator
                        .comparingInt((KnownUserResponse u) -> -u.sharedProjects().size())
                        .thenComparing(KnownUserResponse::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }
}
