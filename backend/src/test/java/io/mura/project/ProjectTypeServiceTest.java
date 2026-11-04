package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.project.dto.ProjectTypeResponse;
import io.mura.project.dto.SaveProjectTypeRequest;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectTypeServiceTest {

    @Mock
    private ProjectTypeRepository typeRepository;
    @Mock
    private ProjectRepository projectRepository;
    @InjectMocks
    private ProjectTypeService service;

    private ProjectType web;
    private ProjectType other;

    @BeforeEach
    void setUp() {
        web = Fixtures.type("Web");
        web.setPosition(1);
        other = Fixtures.type("Autre");
        other.setPosition(5);
        other.setFallback(true);
    }

    private static ProjectRepository.TypeCount count(ProjectType type, long projects) {
        return new ProjectRepository.TypeCount() {
            @Override
            public UUID getTypeId() {
                return type.getId();
            }

            @Override
            public long getProjects() {
                return projects;
            }
        };
    }

    @Test
    void listWithCountsGivesEachTypeItsProjectCountInOneQuery() {
        when(typeRepository.findAllByOrderByPositionAscLabelAsc()).thenReturn(List.of(web, other));
        // A type nobody uses has no row of its own.
        when(projectRepository.countPerType()).thenReturn(List.of(count(web, 3)));

        List<ProjectTypeResponse> types = service.listWithCounts();

        assertThat(types).extracting(ProjectTypeResponse::label, ProjectTypeResponse::projectCount)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Web", 3L),
                        org.assertj.core.groups.Tuple.tuple("Autre", 0L));
        verify(projectRepository, never()).countByTypeId(any());
    }

    @Test
    void listLeavesTheCountOut() {
        when(typeRepository.findAllByOrderByPositionAscLabelAsc()).thenReturn(List.of(web));

        assertThat(service.list()).singleElement()
                .satisfies(type -> assertThat(type.projectCount()).isNull());
    }

    @Test
    void createAppendsTheNewTypeAfterTheLastOne() {
        when(typeRepository.findByLabelIgnoreCase("Mobile")).thenReturn(Optional.empty());
        when(typeRepository.findAllByOrderByPositionAscLabelAsc()).thenReturn(List.of(web, other));
        when(typeRepository.save(any(ProjectType.class))).thenAnswer(call -> call.getArgument(0));

        ProjectTypeResponse created = service.create(new SaveProjectTypeRequest("  Mobile ", "📱"));

        ArgumentCaptor<ProjectType> saved = ArgumentCaptor.forClass(ProjectType.class);
        verify(typeRepository).save(saved.capture());
        assertThat(saved.getValue().getPosition()).isEqualTo(6);
        assertThat(created.label()).isEqualTo("Mobile");
        assertThat(created.projectCount()).isZero();
    }

    @Test
    void createIsFirstWhenThereAreNoTypes() {
        when(typeRepository.findByLabelIgnoreCase("Web")).thenReturn(Optional.empty());
        when(typeRepository.findAllByOrderByPositionAscLabelAsc()).thenReturn(List.of());
        when(typeRepository.save(any(ProjectType.class))).thenAnswer(call -> call.getArgument(0));

        assertThat(service.create(new SaveProjectTypeRequest("Web", "🌐")).position()).isEqualTo(1);
    }

    @Test
    void createRefusesALabelThatAlreadyExistsWhateverItsCase() {
        when(typeRepository.findByLabelIgnoreCase("web")).thenReturn(Optional.of(web));

        assertThatThrownBy(() -> service.create(new SaveProjectTypeRequest("web", "🌐")))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getField()).isEqualTo("label");
                });
        verify(typeRepository, never()).save(any());
    }

    @Test
    void updateMayKeepItsOwnLabel() {
        when(typeRepository.findById(web.getId())).thenReturn(Optional.of(web));
        when(typeRepository.findByLabelIgnoreCase("Web")).thenReturn(Optional.of(web));
        when(projectRepository.countByTypeId(web.getId())).thenReturn(2L);

        ProjectTypeResponse updated = service.update(web.getId(), new SaveProjectTypeRequest("Web", "🕸️"));

        assertThat(updated.emoji()).isEqualTo("🕸️");
        assertThat(updated.projectCount()).isEqualTo(2L);
    }

    @Test
    void theFallbackCanNeitherBeEditedNorDeleted() {
        when(typeRepository.findById(other.getId())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.update(other.getId(), new SaveProjectTypeRequest("Divers", "📁")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        assertThatThrownBy(() -> service.delete(other.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verify(typeRepository, never()).delete(any());
    }

    @Test
    void deleteMovesItsProjectsToTheFallbackBeforeRemovingIt() {
        when(typeRepository.findById(web.getId())).thenReturn(Optional.of(web));
        when(typeRepository.findByFallbackTrue()).thenReturn(Optional.of(other));

        service.delete(web.getId());

        var order = org.mockito.Mockito.inOrder(projectRepository, typeRepository);
        order.verify(projectRepository).reassignType(web.getId(), other.getId());
        order.verify(typeRepository).delete(web);
    }

    @Test
    void deleteRefusesWhenNoFallbackExists() {
        when(typeRepository.findById(web.getId())).thenReturn(Optional.of(web));
        when(typeRepository.findByFallbackTrue()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(web.getId())).isInstanceOf(ApiException.class);
        verify(projectRepository, never()).reassignType(any(), any());
    }

    @Test
    void anUnknownTypeIsNotFound() {
        UUID unknown = UUID.randomUUID();
        when(typeRepository.findById(unknown)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.require(unknown))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
