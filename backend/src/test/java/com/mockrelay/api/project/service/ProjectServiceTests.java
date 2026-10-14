package com.mockrelay.api.project.service;

import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.dto.ResponseScenarioResponse;
import com.mockrelay.api.dto.UpdateProjectRequest;
import com.mockrelay.api.endpoint.service.EndpointService;
import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.exception.ProjectKeyAlreadyExistsException;
import com.mockrelay.api.exception.ProjectNotFoundException;
import com.mockrelay.api.exception.StarterApiTemplateNotFoundException;
import com.mockrelay.api.repository.ProjectRepository;
import com.mockrelay.api.response.service.ResponseScenarioService;
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

    @Autowired
    private EndpointService endpointService;

    @Autowired
    private ResponseScenarioService responseScenarioService;

    @Autowired
    private ProjectRepository projectRepository;

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

    @Test
    void createsACompleteProjectFromTheLoyaltyTemplate() {
        ProjectResponse project = projectService.createProject(new CreateProjectRequest(
                "Loyalty sandbox",
                "Exercises loyalty client behavior",
                "loyalty-sandbox",
                "loyalty-points"
        ));

        assertThat(project.endpointCount()).isEqualTo(7);
        assertThat(projectRepository.findById(project.id()))
                .get()
                .satisfies(saved -> assertThat(saved.getEndpoints())
                        .allSatisfy(endpoint -> assertThat(endpoint.getProject()).isSameAs(saved)));

        var endpoints = endpointService.getEndpoints(project.id());
        assertThat(endpoints)
                .extracting(endpoint -> endpoint.method() + " " + endpoint.path())
                .containsExactlyInAnyOrder(
                        "GET /tiers",
                        "GET /members",
                        "GET /members/{id}",
                        "GET /members/{id}/points-ledger",
                        "GET /rewards",
                        "GET /redemptions/{id}",
                        "POST /redemptions"
                );

        int scenarioCount = endpoints.stream()
                .mapToInt(endpoint -> responseScenarioService
                        .getScenarios(project.id(), endpoint.id()).size())
                .sum();
        assertThat(scenarioCount).isEqualTo(26);
        assertThat(endpoints).allSatisfy(endpoint -> assertThat(responseScenarioService
                .getScenarios(project.id(), endpoint.id()))
                .filteredOn(ResponseScenarioResponse::active)
                .hasSize(1));

        EndpointResponse createRedemption = endpoints.stream()
                .filter(endpoint -> endpoint.method() == HttpMethod.POST)
                .filter(endpoint -> endpoint.path().equals("/redemptions"))
                .findFirst()
                .orElseThrow();
        assertThat(createRedemption.statusCode()).isEqualTo(201);
        assertThat(createRedemption.body()).contains("\"status\" : \"pending\"");
        assertThat(createRedemption.headers())
                .anySatisfy(header -> {
                    assertThat(header.name()).isEqualTo("Location");
                    assertThat(header.value()).isEqualTo("/redemptions/redemption_1046");
                });
    }

    @Test
    void rejectsAnUnknownTemplateWithoutCreatingAProject() {
        assertThatThrownBy(() -> projectService.createProject(new CreateProjectRequest(
                "Unknown template project",
                null,
                "unknown-template-project",
                "missing-template"
        )))
                .isInstanceOf(StarterApiTemplateNotFoundException.class)
                .hasMessageContaining("missing-template");

        assertThat(projectRepository.existsByProjectKey("unknown-template-project")).isFalse();
    }
}
