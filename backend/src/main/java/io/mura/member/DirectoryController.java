package io.mura.member;

import io.mura.member.dto.AddContactRequest;
import io.mura.member.dto.FavouriteRequest;
import io.mura.member.dto.KnownUserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The carnet, under {@code /api/directory}. Every route acts on the signed-in
 * account's own carnet; the rules are in {@link DirectoryService}.
 */
@RestController
@RequestMapping("/api/directory")
@RequiredArgsConstructor
public class DirectoryController {

    private final DirectoryService directoryService;

    /**
     * {@code GET /api/directory}: the reader's carnet.
     *
     * @param userId the signed-in account
     * @return 200 with the carnet, favourites first
     * @see DirectoryService#listKnownTo(UUID)
     */
    @GetMapping
    public ResponseEntity<List<KnownUserResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(directoryService.listKnownTo(userId));
    }

    /**
     * {@code POST /api/directory}: asks someone to join the carnet.
     *
     * @param userId the signed-in account
     * @param request the address of the person to add
     * @return 201 with the person as the carnet now shows them
     * @see DirectoryService#addContact(UUID, AddContactRequest)
     */
    @PostMapping
    public ResponseEntity<KnownUserResponse> add(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody AddContactRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(directoryService.addContact(userId, request));
    }

    /**
     * {@code PUT /api/directory/{personId}/favourite}: stars or un-stars
     * someone.
     *
     * @param userId the signed-in account
     * @param personId the person to star
     * @param request whether they should be a favourite
     * @return 200 with the person as the carnet now shows them
     * @see DirectoryService#setFavourite(UUID, UUID, boolean)
     */
    @PutMapping("/{personId}/favourite")
    public ResponseEntity<KnownUserResponse> setFavourite(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID personId,
            @Valid @RequestBody FavouriteRequest request
    ) {
        return ResponseEntity.ok(directoryService.setFavourite(userId, personId, request.favourite()));
    }

    /**
     * {@code DELETE /api/directory/{personId}}: takes someone out of the
     * carnet.
     *
     * @param userId the signed-in account
     * @param personId the person to take out
     * @return 204
     * @see DirectoryService#removeContact(UUID, UUID)
     */
    @DeleteMapping("/{personId}")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID personId
    ) {
        directoryService.removeContact(userId, personId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/directory/requests}: the requests waiting on the
     * reader.
     *
     * @param userId the signed-in account
     * @return 200 with who asked
     * @see DirectoryService#listRequests(UUID)
     */
    @GetMapping("/requests")
    public ResponseEntity<List<KnownUserResponse>> listRequests(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(directoryService.listRequests(userId));
    }

    /**
     * {@code POST /api/directory/requests/{requesterId}/accept}: accepts a
     * request.
     *
     * @param userId the signed-in account
     * @param requesterId the person who asked
     * @return 200 with the requester as the carnet now shows them
     * @see DirectoryService#accept(UUID, UUID)
     */
    @PostMapping("/requests/{requesterId}/accept")
    public ResponseEntity<KnownUserResponse> accept(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requesterId
    ) {
        return ResponseEntity.ok(directoryService.accept(userId, requesterId));
    }

    /**
     * {@code POST /api/directory/requests/{requesterId}/decline}: turns a
     * request down, without telling the person who asked.
     *
     * @param userId the signed-in account
     * @param requesterId the person who asked
     * @return 204
     * @see DirectoryService#decline(UUID, UUID)
     */
    @PostMapping("/requests/{requesterId}/decline")
    public ResponseEntity<Void> decline(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requesterId
    ) {
        directoryService.decline(userId, requesterId);
        return ResponseEntity.noContent().build();
    }
}
