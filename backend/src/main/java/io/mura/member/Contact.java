package io.mura.member;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * What one account decided about another in its carnet. Most carnet entries
 * are worked out from shared projects and invitations rather than stored;
 * a row exists only once someone acts: asks to add a person, stars them, or
 * takes them out of the list.
 */
@Entity
@Table(name = "contacts")
@Getter
@Setter
@NoArgsConstructor
public class Contact {

    @EmbeddedId
    private ContactId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("ownerId")
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("personId")
    @JoinColumn(name = "person_id")
    private User person;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // A row can mean two opposite things: someone put in the carnet, or
    // someone taken out of it who would otherwise keep coming back through
    // a shared project.
    @Column(nullable = false)
    private boolean hidden;

    @Column(nullable = false)
    private boolean favourite;

    // Adding someone is a request now: nothing reaches either carnet
    // until they agree.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactStatus status = ContactStatus.PENDING;

    /**
     * A new entry, pending until the person agrees.
     *
     * @param owner the account whose carnet holds the entry
     * @param person the account the entry is about
     */
    public Contact(User owner, User person) {
        this.owner = owner;
        this.person = person;
        this.id = new ContactId(owner.getId(), person.getId());
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
