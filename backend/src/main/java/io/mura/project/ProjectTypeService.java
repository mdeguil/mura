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

@Service
@RequiredArgsConstructor
public class ProjectTypeService {

    private final ProjectTypeRepository typeRepository;
    private final ProjectRepository projectRepository;

    // Everyone reads them -- they fill the picker and the filters -- but only
    // an administrator writes them, which the controller enforces.
    @Transactional(readOnly = true)
    public List<ProjectTypeResponse> list() {
        return typeRepository.findAllByOrderByPositionAscLabelAsc().stream()
                .map(ProjectTypeResponse::from)
                .toList();
    }

    // The administration page needs to know what a deletion would move.
    @Transactional(readOnly = true)
    public List<ProjectTypeResponse> listWithCounts() {
        Map<UUID, Long> counts = projectRepository.countPerType().stream()
                .collect(Collectors.toMap(ProjectRepository.TypeCount::getTypeId, ProjectRepository.TypeCount::getProjects));
        return typeRepository.findAllByOrderByPositionAscLabelAsc().stream()
                .map(type -> ProjectTypeResponse.of(type, counts.getOrDefault(type.getId(), 0L)))
                .toList();
    }

    @Transactional
    public ProjectTypeResponse create(SaveProjectTypeRequest request) {
        refuseDuplicate(request.label(), null);

        ProjectType type = new ProjectType();
        apply(type, request);
        // Appended rather than inserted: an administrator who wants a
        // different order can say so, and until then a new type lands last.
        type.setPosition(typeRepository.findAllByOrderByPositionAscLabelAsc().stream()
                .mapToInt(ProjectType::getPosition)
                .max()
                .orElse(0) + 1);
        return ProjectTypeResponse.of(typeRepository.save(type), 0L);
    }

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
     * @throws ApiException 409 for the fallback type itself, which can be
     *         neither edited nor deleted
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

        // Moved before the row goes, not left to a cascade: the foreign key
        // would have refused, and a cascade would have taken the projects.
        projectRepository.reassignType(id, fallback.getId());
        typeRepository.delete(type);
    }

    // The fallback is where every other deletion sends its projects, so it
    // has to still be there and still mean what the message said it means.
    // Locked rather than merely undeletable: renaming "Autre" to something
    // else would make every deletion dialog quietly wrong.
    private void refuseTouchingTheFallback(ProjectType type, String verb) {
        if (type.isFallback()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "« " + type.getLabel() + " » est le type de repli : les projets des types "
                            + "supprimés y sont déplacés, donc il ne peut pas être " + verb + "."
            );
        }
    }

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
