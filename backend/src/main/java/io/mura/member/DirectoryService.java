package io.mura.member;

import io.mura.common.exception.ApiException;
import io.mura.member.dto.AddContactRequest;
import io.mura.member.dto.KnownUserResponse;
import io.mura.project.Project;
import io.mura.project.ProjectMember;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DirectoryService {

    private final DirectoryRepository directoryRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

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

        Set<UUID> saved = new HashSet<>();
        for (Contact contact : contactRepository.findAllForOwner(userId)) {
            User person = contact.getPerson();
            people.putIfAbsent(person.getId(), person);
            saved.add(person.getId());
        }

        return people.values().stream()
                .map(person -> new KnownUserResponse(
                        person.getId(),
                        person.getUsername(),
                        person.getEmail(),
                        person.getAvatarUrl(),
                        shared.getOrDefault(person.getId(), List.of()),
                        saved.contains(person.getId())
                ))
                // Most shared projects first, then alphabetically: the people
                // you work with most come to the top on their own.
                .sorted(Comparator
                        .comparingInt((KnownUserResponse u) -> -u.sharedProjects().size())
                        .thenComparing(KnownUserResponse::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public KnownUserResponse addContact(UUID ownerId, AddContactRequest request) {
        String email = request.email().trim();

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        User person = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte Mura n'utilise l'email " + email + "."
                ));

        if (person.getId().equals(ownerId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tu n'as pas besoin de t'ajouter toi-même.");
        }

        if (contactRepository.findByOwnerIdAndPersonId(ownerId, person.getId()).isPresent()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    person.getUsername() + " est déjà dans ton carnet."
            );
        }

        contactRepository.save(new Contact(owner, person));

        // Someone added by hand can already share projects with you, so the
        // answer carries what the list would show rather than a bare row.
        return new KnownUserResponse(
                person.getId(),
                person.getUsername(),
                person.getEmail(),
                person.getAvatarUrl(),
                sharedProjectsBetween(ownerId, person.getId()),
                true
        );
    }

    // Only the deliberate link goes: someone you still share a project with
    // stays in the carnet, because that is where the carnet gets them from.
    @Transactional
    public void removeContact(UUID ownerId, UUID personId) {
        Contact contact = contactRepository.findByOwnerIdAndPersonId(ownerId, personId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette personne n'est pas dans ton carnet."
                ));

        contactRepository.delete(contact);
    }

    private List<KnownUserResponse.SharedProject> sharedProjectsBetween(UUID userId, UUID personId) {
        return directoryRepository.findSharedMemberships(userId).stream()
                .filter(m -> m.getUser().getId().equals(personId))
                .map(m -> new KnownUserResponse.SharedProject(
                        m.getProject().getId(), m.getProject().getName(), m.getProject().getColor()))
                .toList();
    }
}
