package io.mura.member;

import io.mura.common.exception.ApiException;
import io.mura.member.dto.AddContactRequest;
import io.mura.member.dto.FavouriteRequest;
import io.mura.member.dto.KnownUserResponse;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
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

/**
 * The carnet: the people an account knows, worked out from shared projects
 * and invitations, plus what it decided about them -- asked for, starred,
 * taken out.
 */
@Service
@RequiredArgsConstructor
public class DirectoryService {

    private final DirectoryRepository directoryRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Everyone in the reader's carnet: people they share an active project
     * with, people they invited or were invited by, people who agreed to be
     * added, and the requests they sent that are still waiting. Someone
     * taken out on purpose stays out, whatever else would put them back.
     *
     * @param userId the reader
     * @return the carnet, favourites first, then by name
     */
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

        for (User person : directoryRepository.findInvitedByMe(userId)) {
            people.putIfAbsent(person.getId(), person);
        }
        for (User person : directoryRepository.findWhoInvitedMe(userId)) {
            people.putIfAbsent(person.getId(), person);
        }

        Set<UUID> saved = new HashSet<>();
        Set<UUID> hidden = new HashSet<>();
        Set<UUID> favourites = new HashSet<>();
        Set<UUID> pending = new HashSet<>();
        for (Contact contact : contactRepository.findAllForOwner(userId)) {
            User person = contact.getPerson();
            if (contact.isHidden()) {
                hidden.add(person.getId());
                continue;
            }
            if (contact.getStatus() == ContactStatus.PENDING) {
                people.putIfAbsent(person.getId(), person);
                pending.add(person.getId());
                continue;
            }
            if (contact.getStatus() == ContactStatus.DECLINED) {
                continue;
            }
            people.putIfAbsent(person.getId(), person);
            saved.add(person.getId());
            if (contact.isFavourite()) {
                favourites.add(person.getId());
            }
        }

        return people.values().stream()
                .filter(person -> !hidden.contains(person.getId()))
                .map(person -> new KnownUserResponse(
                        person.getId(),
                        person.getUsername(),
                        person.getEmail(),
                        person.getAvatarUrl(),
                        shared.getOrDefault(person.getId(), List.of()),
                        saved.contains(person.getId()),
                        favourites.contains(person.getId()),
                        person.isSuspended(),
                        pending.contains(person.getId())
                ))
                .sorted(Comparator
                        .comparing((KnownUserResponse u) -> !u.favourite())
                        .thenComparing(KnownUserResponse::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /**
     * Asks someone to join the reader's carnet, and tells them. If they had
     * already asked the reader, this accepts their request instead. Asking
     * again after a refusal, or re-adding someone taken out, reuses the row.
     *
     * @param ownerId the reader
     * @param request the address of the person to add
     * @return the person as the carnet now shows them: pending, or accepted
     *         when their request was waiting
     * @throws ApiException 404 if no account uses the address; 409 when
     *         adding oneself, someone already in the carnet, or someone who
     *         has not answered yet
     */
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

        Contact existing = contactRepository.findByOwnerIdAndPersonId(ownerId, person.getId())
                .filter(c -> !c.isHidden())
                .orElse(null);
        if (existing != null && existing.getStatus() == ContactStatus.ACCEPTED) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    person.getUsername() + " est déjà dans ton carnet."
            );
        }
        if (existing != null && existing.getStatus() == ContactStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    person.getUsername() + " n'a pas encore répondu à ta demande."
            );
        }

        Contact theirs = contactRepository.findByOwnerIdAndPersonId(person.getId(), ownerId)
                .filter(c -> c.getStatus() == ContactStatus.PENDING)
                .orElse(null);
        if (theirs != null) {
            return accept(ownerId, person.getId());
        }

        Contact contact = contactRepository.findByOwnerIdAndPersonId(ownerId, person.getId())
                .orElseGet(() -> new Contact(owner, person));
        contact.setHidden(false);
        contact.setStatus(ContactStatus.PENDING);
        contactRepository.save(contact);

        notificationService.notifyAboutPerson(person, NotificationType.CONTACT_REQUESTED, owner);

        return new KnownUserResponse(
                person.getId(),
                person.getUsername(),
                person.getEmail(),
                person.getAvatarUrl(),
                sharedProjectsBetween(ownerId, person.getId()),
                false,
                contact.isFavourite(),
                person.isSuspended(),
                true
        );
    }

    /**
     * Takes someone out of the reader's carnet, however they got there. The
     * row is kept and marked hidden rather than deleted: someone arriving
     * through a shared project would otherwise be rebuilt on the next read.
     * Adding them again by email undoes it. Nothing changes on their side.
     *
     * @param ownerId the reader
     * @param personId the person to take out
     * @throws ApiException 404 if the person's account does not exist
     */
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


    /**
     * Stars or un-stars someone in the reader's carnet. Starring someone who
     * only appears through a shared project creates the row that remembers
     * it -- the same row that would hold them hidden.
     *
     * @param ownerId the reader
     * @param personId the person to star
     * @param favourite true to star, false to take the star away
     * @return the person as the carnet now shows them
     * @throws ApiException 404 if the person's account does not exist, 409
     *         if they were taken out of the carnet
     */
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
                favourite,
                person.isSuspended(),
                false
        );
    }

    /**
     * The requests waiting on the reader to answer. Separate from the
     * carnet: these are not entries yet, they are questions.
     *
     * @param userId the reader
     * @return who asked, newest first
     */
    @Transactional(readOnly = true)
    public List<KnownUserResponse> listRequests(UUID userId) {
        return contactRepository.findPendingForPerson(userId).stream()
                .map(Contact::getOwner)
                .map(requester -> new KnownUserResponse(
                        requester.getId(),
                        requester.getUsername(),
                        requester.getEmail(),
                        requester.getAvatarUrl(),
                        sharedProjectsBetween(userId, requester.getId()),
                        false,
                        false,
                        requester.isSuspended(),
                        true
                ))
                .toList();
    }

    /**
     * Accepts a request. Accepting is mutual: both end up in each other's
     * carnets, the way accepting an invitation puts you on the team rather
     * than leaving the relationship pointing one way. The person who asked
     * is told.
     *
     * @param userId the reader, who was asked
     * @param requesterId the person who asked
     * @return the requester as the reader's carnet now shows them
     * @throws ApiException 404 if there is no pending request from them
     */
    @Transactional
    public KnownUserResponse accept(UUID userId, UUID requesterId) {
        Contact request = requirePendingRequest(userId, requesterId);
        User me = request.getPerson();
        User requester = request.getOwner();

        request.setStatus(ContactStatus.ACCEPTED);
        request.setHidden(false);
        contactRepository.save(request);

        Contact mine = contactRepository.findByOwnerIdAndPersonId(userId, requesterId)
                .orElseGet(() -> new Contact(me, requester));
        mine.setStatus(ContactStatus.ACCEPTED);
        mine.setHidden(false);
        contactRepository.save(mine);

        notificationService.notifyAboutPerson(requester, NotificationType.CONTACT_ACCEPTED, me);

        return new KnownUserResponse(
                requester.getId(),
                requester.getUsername(),
                requester.getEmail(),
                requester.getAvatarUrl(),
                sharedProjectsBetween(userId, requesterId),
                true,
                mine.isFavourite(),
                requester.isSuspended(),
                false
        );
    }

    /**
     * Turns a request down. The person who asked is not told: a refusal
     * they can see is an awkward conversation nobody asked for. The row is
     * kept rather than deleted so asking again is possible -- people change
     * their minds.
     *
     * @param userId the reader, who was asked
     * @param requesterId the person who asked
     * @throws ApiException 404 if there is no pending request from them
     */
    @Transactional
    public void decline(UUID userId, UUID requesterId) {
        Contact request = requirePendingRequest(userId, requesterId);
        request.setStatus(ContactStatus.DECLINED);
        contactRepository.save(request);
    }

    private Contact requirePendingRequest(UUID userId, UUID requesterId) {
        return contactRepository.findByOwnerIdAndPersonId(requesterId, userId)
                .filter(c -> c.getStatus() == ContactStatus.PENDING)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette demande de contact n'existe plus."
                ));
    }

    private List<KnownUserResponse.SharedProject> sharedProjectsBetween(UUID userId, UUID personId) {
        return directoryRepository.findSharedMemberships(userId).stream()
                .filter(m -> m.getUser().getId().equals(personId))
                .map(m -> new KnownUserResponse.SharedProject(
                        m.getProject().getId(), m.getProject().getName(), m.getProject().getColor()))
                .toList();
    }
}
