package io.mura.member;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

/** The key of a {@link Contact}: whose carnet, and who is in it. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class ContactId implements Serializable {

    /** The account whose carnet holds the entry. */
    private UUID ownerId;

    /** The account the entry is about. */
    private UUID personId;

    /**
     * Builds the key of one carnet entry.
     *
     * @param ownerId the account whose carnet holds the entry
     * @param personId the account the entry is about
     */
    public ContactId(UUID ownerId, UUID personId) {
        this.ownerId = ownerId;
        this.personId = personId;
    }
}
