package com.mockrelay.api.project.service;

import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.dto.UpdateProjectRequest;
import com.mockrelay.api.exception.ProjectKeyAlreadyExistsException;
import com.mockrelay.api.exception.ProjectNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ProjectServiceTests {

    @Autowired
    private ProjectService projectService;

    @Test
    void createsUpdatesListsAndDeletesAProject() {
        ProjectResponse created = projectService.createProject(new CreateProjectRequest(
                "  Course API  ",
                "  Used while learning Spring Boot  ",
                "course-api"
        ));

        assertThat(created.id()).isNotNull();
        assertThat(created.name()).isEqualTo("Course API");
        assertThat(created.description()).isEqualTo("Used while learning Spring Boot");
        assertThat(created.endpointCount()).isZero();
        assertThat(created.createdAt()).isNotNull();
        assertThat(created.updatedAt()).isNotNull();
        assertThat(projectService.getProjects()).extracting(ProjectResponse::id).contains(created.id());

        ProjectResponse updated = projectService.updateProject(created.id(), new UpdateProjectRequest(
                "Updated Course API",
                " ",
                "updated-course-api"
        ));

        assertThat(updated.name()).isEqualTo("Updated Course API");
        assertThat(updated.description()).isNull();
        assertThat(updated.projectKey()).isEqualTo("updated-course-api");
        assertThat(updated.updatedAt()).isAfterOrEqualTo(created.updatedAt());

        projectService.deleteProject(created.id());

        assertThatThrownBy(() -> projectService.getProject(created.id()))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void rejectsADuplicateProjectKey() {
        projectService.createProject(new CreateProjectRequest(
                "First project",
                null,
                "duplicate-key"
        ));

        assertThatThrownBy(() -> projectService.createProject(new CreateProjectRequest(
                "Second project",
                null,
                "duplicate-key"
        )))
                .isInstanceOf(ProjectKeyAlreadyExistsException.class)
                .hasMessageContaining("duplicate-key");
    }
}
