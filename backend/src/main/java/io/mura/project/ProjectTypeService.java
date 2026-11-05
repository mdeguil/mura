package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.project.dto.ProjectTypeResponse;
import io.mura.project.dto.SaveProjectTypeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The project types. Everyone reads them -- they fill the picker and the
 * filters -- but only an administrator writes them, which the admin
 * controller enforces before calling in here.
 */
@Service
@RequiredArgsConstructor
public class ProjectTypeService {

    private final ProjectTypeRepository typeRepository;
    private final ProjectRepository projectRepository;

    /**
     * Every type, in the order offered.
     *
     * @return the types, without their project counts
     */
    @Transactional(readOnly = true)
    public List<ProjectTypeResponse> list() {
        return typeRepository.findAllByOrderByPositionAscLabelAsc().stream()
                .map(ProjectTypeResponse::from)
                .toList();
    }

    /**
     * Every type with how many projects it holds, in two queries: the
     * administration page needs to know what a deletion would move.
     *
     * @return the types, with their project counts
     */
    @Transactional(readOnly = true)
    public List<ProjectTypeResponse> listWithCounts() {
        Map<UUID, Long> counts = projectRepository.countPerType().stream()
                .collect(Collectors.toMap(ProjectRepository.TypeCount::getTypeId, ProjectRepository.TypeCount::getProjects));
        return typeRepository.findAllByOrderByPositionAscLabelAsc().stream()
                .map(type -> ProjectTypeResponse.of(type, counts.getOrDefault(type.getId(), 0L)))
                .toList();
    }

    /**
     * Creates a type, placed last in the list.
     *
     * @param request its label and emoji
     * @return the type, holding no projects yet
     * @throws ApiException 409 if the label is taken, whatever its case
     */
    @Transactional
    public ProjectTypeResponse create(SaveProjectTypeRequest request) {
        refuseDuplicate(request.label(), null);

        ProjectType type = new ProjectType();
        apply(type, request);
        type.setPosition(typeRepository.findAllByOrderByPositionAscLabelAsc().stream()
                .mapToInt(ProjectType::getPosition)
                .max()
                .orElse(0) + 1);
        return ProjectTypeResponse.of(typeRepository.save(type), 0L);
    }

    /**
     * Changes a type's label and emoji.
     *
     * @param id the type
     * @param request its new label and emoji
     * @return the type, with its project count
     * @throws ApiException 404 if the type does not exist; 409 for the
     *         fallback type, or if the label is taken by another type
     */
    @Transactional
    public ProjectTypeResponse update(UUID id, SaveProjectTypeRequest request) {
        ProjectType type = require(id);
        refuseTouchingTheFallback(type, "modifié");
        refuseDuplicate(request.label(), id);
        apply(type, request);
        return ProjectTypeResponse.of(type, projectRepository.countByTypeId(id));
    }

    /**
     * Deletes a type after moving its projects to the fallback type, so no
     * project is lost or left without one.
     *
     * @param id the type
     * @throws ApiException 404 if the type does not exist; 409 for the
     *         fallback type itself, which can be neither edited nor deleted
     */
    @Transactional
    public void delete(UUID id) {
        ProjectType type = require(id);

        refuseTouchingTheFallback(type, "supprimé");

        ProjectType fallback = typeRepository.findByFallbackTrue()
                .orElseThrow(() -> new ApiException(
                        HttpStatus.CONFLICT,
                        "Aucun type de repli n'est défini."
                ));

        projectRepository.reassignType(id, fallback.getId());
        typeRepository.delete(type);
    }

    private void refuseTouchingTheFallback(ProjectType type, String verb) {
        if (type.isFallback()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "« " + type.getLabel() + " » est le type de repli : les projets des types "
                            + "supprimés y sont déplacés, donc il ne peut pas être " + verb + "."
            );
        }
    }

    /**
     * A type by id, for the services that file a project under one.
     *
     * @param id the type
     * @return the type
     * @throws ApiException 404 if it does not exist
     */
    ProjectType require(UUID id) {
        return typeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ce type de projet n'existe pas."));
    }

    private void apply(ProjectType type, SaveProjectTypeRequest request) {
        type.setLabel(request.label());
        type.setEmoji(request.emoji());
    }

    private void refuseDuplicate(String label, UUID allowedId) {
        typeRepository.findByLabelIgnoreCase(label)
                .filter(existing -> !existing.getId().equals(allowedId))
                .ifPresent(existing -> {
                    throw new ApiException(
                            HttpStatus.CONFLICT,
                            "Un type « " + existing.getLabel() + " » existe déjà.",
                            "label"
                    );
                });
    }
}
