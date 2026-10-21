package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, ContactId> {

    @Query("""
            SELECT c FROM Contact c
            JOIN FETCH c.person
            WHERE c.owner.id = :ownerId
            """)
    List<Contact> findAllForOwner(@Param("ownerId") UUID ownerId);

    Optional<Contact> findByOwnerIdAndPersonId(UUID ownerId, UUID personId);
}
