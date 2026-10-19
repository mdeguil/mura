package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // Case-insensitive on purpose: an email typed from memory often carries
    // capitals the registered address does not.
    Optional<User> findByEmailIgnoreCase(String email);
}
