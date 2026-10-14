package com.mockrelay.api.project.service;

import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.dto.UpdateProjectRequest;
import com.mockrelay.api.entity.Project;
import com.mockrelay.api.exception.ProjectKeyAlreadyExistsException;
import com.mockrelay.api.exception.ProjectNotFoundException;
import com.mockrelay.api.repository.ProjectRepository;
import com.mockrelay.api.template.StarterApiTemplateInstantiator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final StarterApiTemplateInstantiator templateInstantiator;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        String projectKey = request.projectKey().trim();
        ensureProjectKeyIsAvailable(projectKey, null);

        Project project = new Project();
        project.setName(request.name().trim());
        project.setDescription(trimToNull(request.description()));
        project.setProjectKey(projectKey);

        String templateKey = trimToNull(request.templateKey());
        if (templateKey != null) {
            templateInstantiator.instantiateInto(project, templateKey);
        }

        return toResponse(projectRepository.saveAndFlush(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects() {
        return projectRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId) {
        return toResponse(findProject(projectId));
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request) {
        Project project = findProject(projectId);
        String projectKey = request.projectKey().trim();
        ensureProjectKeyIsAvailable(projectKey, project);

        project.setName(request.name().trim());
        project.setDescription(trimToNull(request.description()));
        project.setProjectKey(projectKey);

        return toResponse(projectRepository.saveAndFlush(project));
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        projectRepository.delete(findProject(projectId));
    }

    private Project findProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    private void ensureProjectKeyIsAvailable(String projectKey, Project currentProject) {
        if (currentProject != null && currentProject.getProjectKey().equals(projectKey)) {
            return;
        }

        if (projectRepository.existsByProjectKey(projectKey)) {
            throw new ProjectKeyAlreadyExistsException(projectKey);
        }
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getProjectKey(),
                project.getEndpoints().size(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
