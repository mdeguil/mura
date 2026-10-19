package io.mura.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // Case-insensitive on purpose: someone adding a teammate types the name
    // the way they remember it, not the way it was registered.
    @Query("""
            SELECT u FROM User u
            WHERE lower(u.email) = lower(:identifier)
               OR lower(u.username) = lower(:identifier)
            """)
    Optional<User> findByEmailOrUsername(@Param("identifier") String identifier);
}
