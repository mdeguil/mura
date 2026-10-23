package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectTypeRepository extends JpaRepository<ProjectType, UUID> {

    List<ProjectType> findAllByOrderByPositionAscLabelAsc();

    Optional<ProjectType> findByFallbackTrue();

    boolean existsByLabelIgnoreCase(String label);

    Optional<ProjectType> findByLabelIgnoreCase(String label);

    long countByIdNot(UUID id);
}
