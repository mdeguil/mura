package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** The project types. */
public interface ProjectTypeRepository extends JpaRepository<ProjectType, UUID> {

    /**
     * Every type, in the order they are offered.
     *
     * @return the types, by position then label
     */
    List<ProjectType> findAllByOrderByPositionAscLabelAsc();

    /**
     * The type that takes the projects of a deleted one.
     *
     * @return the fallback type; empty only if the data is broken
     */
    Optional<ProjectType> findByFallbackTrue();

    /**
     * Whether a label is taken, whatever its case.
     *
     * @param label the label
     * @return true if a type already uses it
     */
    boolean existsByLabelIgnoreCase(String label);

    /**
     * The type using a label, whatever its case.
     *
     * @param label the label
     * @return the type, if any
     */
    Optional<ProjectType> findByLabelIgnoreCase(String label);

    /**
     * How many types there are besides one.
     *
     * @param id the type to leave out
     * @return the number of other types
     */
    long countByIdNot(UUID id);
}
