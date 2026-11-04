package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    // Case-insensitive on purpose: an email typed from memory often carries
    // capitals the registered address does not.
    Optional<User> findByEmailIgnoreCase(String email);

    // Uniqueness ignores case too, matching the indexes on lower(email) and
    // lower(username): one person must not be able to register twice by
    // capitalising their address differently.
    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    // Active administrators other than this one: counted in the database
    // rather than by loading every account to look.
    long countByAccountRoleAndSuspendedAtIsNullAndIdNot(AccountRole accountRole, UUID id);

    // A statement rather than delete(entity), which proved unreliable in
    // the one transaction that matters: after handing a project over to
    // its new owner, the entity-level delete emitted no SQL at all while
    // the handover itself still committed. This cannot silently do
    // nothing -- it reports the rows it removed. The rest goes with it
    // through the schema's own ON DELETE CASCADE.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM User u WHERE u.id = :id")
    int deleteAccountById(@Param("id") UUID id);
}
