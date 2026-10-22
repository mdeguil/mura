package io.mura.member;

import io.mura.common.exception.ApiException;
import io.mura.member.dto.AddContactRequest;
import io.mura.member.dto.FavouriteRequest;
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
        Set<UUID> hidden = new HashSet<>();
        Set<UUID> favourites = new HashSet<>();
        for (Contact contact : contactRepository.findAllForOwner(userId)) {
            User person = contact.getPerson();
            if (contact.isHidden()) {
                hidden.add(person.getId());
                continue;
            }
            people.putIfAbsent(person.getId(), person);
            saved.add(person.getId());
            if (contact.isFavourite()) {
                favourites.add(person.getId());
            }
        }

        return people.values().stream()
                // Taken out of the carnet on purpose, whatever else would
                // otherwise put them back in it.
                .filter(person -> !hidden.contains(person.getId()))
                .map(person -> new KnownUserResponse(
                        person.getId(),
                        person.getUsername(),
                        person.getEmail(),
                        person.getAvatarUrl(),
                        shared.getOrDefault(person.getId(), List.of()),
                        saved.contains(person.getId()),
                        favourites.contains(person.getId())
                ))
                // Favourites first because you said so, then most shared
                // projects, then alphabetically.
                .sorted(Comparator
                        .comparing((KnownUserResponse u) -> !u.favourite())
                        .thenComparingInt(u -> -u.sharedProjects().size())
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

        if (contactRepository.findByOwnerIdAndPersonId(ownerId, person.getId())
                .filter(c -> !c.isHidden())
                .isPresent()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    person.getUsername() + " est déjà dans ton carnet."
            );
        }

        // Re-adding someone you had taken out puts them back rather than
        // failing on the row that was holding them hidden.
        Contact contact = contactRepository.findByOwnerIdAndPersonId(ownerId, person.getId())
                .orElseGet(() -> new Contact(owner, person));
        contact.setHidden(false);
        contactRepository.save(contact);

        // Someone added by hand can already share projects with you, so the
        // answer carries what the list would show rather than a bare row.
        return new KnownUserResponse(
                person.getId(),
                person.getUsername(),
                person.getEmail(),
                person.getAvatarUrl(),
                sharedProjectsBetween(ownerId, person.getId()),
                true,
                contact.isFavourite()
        );
    }

    // Removing from the carnet, for anyone in it. The row is kept and marked
    // hidden rather than deleted: someone arriving through a shared project
    // would otherwise be rebuilt on the next read. Adding them again by
    // email undoes it.
    @Transactional
    public void removeContact(UUID ownerId, UUID personId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        User person = userRepository.findById(personId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Personne introuvable."));

        Contact contact = contactRepository.findByOwnerIdAndPersonId(ownerId, personId)
                .orElseGet(() -> new Contact(owner, person));

        contact.setHidden(true);
        contactRepository.save(contact);
    }


    // Favouriting someone who only appears through a shared project creates
    // the row that remembers it — the same row that would hold them hidden.
    @Transactional
    public KnownUserResponse setFavourite(UUID ownerId, UUID personId, boolean favourite) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        User person = userRepository.findById(personId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Personne introuvable."));

        Contact contact = contactRepository.findByOwnerIdAndPersonId(ownerId, personId)
                .orElseGet(() -> new Contact(owner, person));

        if (contact.isHidden()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    person.getUsername() + " ne fait pas partie de ton carnet."
            );
        }

        contact.setFavourite(favourite);
        contactRepository.save(contact);

        return new KnownUserResponse(
                person.getId(),
                person.getUsername(),
                person.getEmail(),
                person.getAvatarUrl(),
                sharedProjectsBetween(ownerId, personId),
                true,
                favourite
        );
    }
    private List<KnownUserResponse.SharedProject> sharedProjectsBetween(UUID userId, UUID personId) {
        return directoryRepository.findSharedMemberships(userId).stream()
                .filter(m -> m.getUser().getId().equals(personId))
                .map(m -> new KnownUserResponse.SharedProject(
                        m.getProject().getId(), m.getProject().getName(), m.getProject().getColor()))
                .toList();
    }
}
