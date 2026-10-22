package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;

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
}
