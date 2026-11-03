package io.mura.support;

import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;
import io.mura.member.AccountRole;
import io.mura.member.User;
import io.mura.project.Project;
import io.mura.project.ProjectMember;
import io.mura.project.ProjectRole;
import io.mura.project.ProjectStatus;
import io.mura.project.ProjectType;
import io.mura.task.Subtask;
import io.mura.task.Task;
import io.mura.task.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entities as the database would hand them back: ids and timestamps already
 * set, since the services under test never persist anything for real.
 */
public final class Fixtures {

    private Fixtures() {}

    public static User user(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        user.setEmail(username + "@mura.test");
        user.setPassword("$2a$10$hash");
        user.setAccountRole(AccountRole.USER);
        user.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        user.setEmailVerifiedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return user;
    }

    public static User admin(String username) {
        User admin = user(username);
        admin.setAccountRole(AccountRole.ADMIN);
        return admin;
    }

    public static User suspended(User user) {
        user.setSuspendedAt(Instant.parse("2026-02-01T00:00:00Z"));
        return user;
    }

    public static ProjectType type(String label) {
        ProjectType type = new ProjectType();
        type.setId(UUID.randomUUID());
        type.setLabel(label);
        type.setEmoji("📁");
        type.setPosition(1);
        return type;
    }

    public static Project project(String name, User owner) {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName(name);
        project.setColor("#14b8a6");
        project.setType(type("Web"));
        project.setStatus(ProjectStatus.A_VENIR);
        project.setOwner(owner);
        project.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return project;
    }

    public static ProjectMember member(Project project, User user, ProjectRole role) {
        ProjectMember membership = new ProjectMember(project, user, role);
        membership.setJoinedAt(Instant.parse("2026-01-02T00:00:00Z"));
        return membership;
    }

    public static Task task(Project project, String name, TaskStatus status) {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setProject(project);
        task.setName(name);
        task.setStatus(status);
        task.setStartDate(LocalDate.parse("2026-03-01"));
        task.setEndDate(LocalDate.parse("2026-03-10"));
        return task;
    }

    public static Subtask subtask(Task task, String name, boolean done) {
        Subtask subtask = new Subtask();
        subtask.setId(UUID.randomUUID());
        subtask.setTask(task);
        subtask.setName(name);
        subtask.setDone(done);
        task.getSubtasks().add(subtask);
        return subtask;
    }

    public static UserGroup group(String name, User owner) {
        UserGroup group = new UserGroup();
        group.setId(UUID.randomUUID());
        group.setName(name);
        group.setOwner(owner);
        group.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return group;
    }

    public static UserGroupMember groupMember(UserGroup group, User user) {
        UserGroupMember membership = new UserGroupMember(group, user);
        membership.setJoinedAt(Instant.parse("2026-01-03T00:00:00Z"));
        return membership;
    }
}
