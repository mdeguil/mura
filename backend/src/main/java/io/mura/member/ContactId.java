package io.mura.member;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class ContactId implements Serializable {

    private UUID ownerId;
    private UUID personId;

    public ContactId(UUID ownerId, UUID personId) {
        this.ownerId = ownerId;
        this.personId = personId;
    }
}
