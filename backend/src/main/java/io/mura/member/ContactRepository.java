package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** The carnet decisions stored as {@link Contact} rows. */
public interface ContactRepository extends JpaRepository<Contact, ContactId> {

    /**
     * Every decision one account made about others, with the person each
     * is about.
     *
     * @param ownerId the account whose carnet it is
     * @return its rows, in no particular order
     */
    @Query("""
            SELECT c FROM Contact c
            JOIN FETCH c.person
            WHERE c.owner.id = :ownerId
            """)
    List<Contact> findAllForOwner(@Param("ownerId") UUID ownerId);

    /**
     * The one row an account may hold about another.
     *
     * @param ownerId the account whose carnet it is
     * @param personId the account the row is about
     * @return the row, if one was ever stored
     */
    Optional<Contact> findByOwnerIdAndPersonId(UUID ownerId, UUID personId);

    /**
     * The requests waiting on this person to answer, newest first, with
     * who asked.
     *
     * @param personId the account being asked
     * @return the pending rows addressed to them
     */
    @Query("""
            SELECT c FROM Contact c
            JOIN FETCH c.owner
            WHERE c.person.id = :personId AND c.status = io.mura.member.ContactStatus.PENDING
            ORDER BY c.createdAt DESC
            """)
    List<Contact> findPendingForPerson(@Param("personId") UUID personId);
}
