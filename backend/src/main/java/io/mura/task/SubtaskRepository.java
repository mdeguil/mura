package io.mura.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SubtaskRepository extends JpaRepository<Subtask, UUID> {
}
