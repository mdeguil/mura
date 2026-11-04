package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/** The accounts. */
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Case-insensitive on purpose: an email typed from memory often carries
     * capitals the registered address does not.
     *
     * @param email the address, in any case
     * @return the account using it, if any
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Uniqueness ignores case too, matching the index on lower(email): one
     * person must not be able to register twice by capitalising their
     * address differently.
     *
     * @param email the address, in any case
     * @return whether an account already uses it
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Matches the index on lower(username).
     *
     * @param username the name, in any case
     * @return whether an account already uses it
     */
    boolean existsByUsernameIgnoreCase(String username);

    /**
     * Counts the active accounts with a role, leaving one out: counted in
     * the database rather than by loading every account to look.
     *
     * @param accountRole the role to count, in practice ADMIN
     * @param id the account to leave out of the count
     * @return how many unsuspended accounts other than {@code id} hold it
     */
    long countByAccountRoleAndSuspendedAtIsNullAndIdNot(AccountRole accountRole, UUID id);

    /**
     * Deletes an account by statement rather than delete(entity), which
     * proved unreliable in the one transaction that matters: after handing a
     * project over to its new owner, the entity-level delete emitted no SQL
     * at all while the handover itself still committed. This cannot
     * silently do nothing -- it reports the rows it removed. The rest goes
     * with it through the schema's own ON DELETE CASCADE.
     *
     * @param id the account to delete
     * @return the number of rows removed: 1, or 0 if it was already gone
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM User u WHERE u.id = :id")
    int deleteAccountById(@Param("id") UUID id);
}
