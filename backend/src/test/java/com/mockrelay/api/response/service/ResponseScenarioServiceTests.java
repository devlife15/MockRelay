package com.mockrelay.api.response.service;

import com.mockrelay.api.dto.CreateEndpointRequest;
import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.CreateResponseScenarioRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.dto.ResponseScenarioResponse;
import com.mockrelay.api.dto.UpdateResponseScenarioRequest;
import com.mockrelay.api.endpoint.service.EndpointService;
import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.exception.ResponseScenarioConflictException;
import com.mockrelay.api.exception.ResponseScenarioNotFoundException;
import com.mockrelay.api.project.service.ProjectService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ResponseScenarioServiceTests {

    @Autowired
    private ResponseScenarioService scenarioService;

    @Autowired
    private EndpointService endpointService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EntityManager entityManager;

    @Test
    void createsUpdatesActivatesAndDeletesAScenario() {
        ProjectResponse project = createProject("scenario-lifecycle");
        EndpointResponse endpoint = createEndpoint(project);

        ResponseScenarioResponse created = scenarioService.createScenario(
                project.id(),
                endpoint.id(),
                createRequest("Not found", 404, "{\"error\":\"missing\"}")
        );

        assertThat(created.name()).isEqualTo("Not found");
        assertThat(created.active()).isFalse();
        assertThat(scenarioService.getScenarios(project.id(), endpoint.id()))
                .extracting(ResponseScenarioResponse::name)
                .containsExactly("Default", "Not found");

        ResponseScenarioResponse updated = scenarioService.updateScenario(
                project.id(),
                endpoint.id(),
                created.id(),
                new UpdateResponseScenarioRequest(
                        "Unauthorized",
                        401,
                        "application/problem+json",
                        List.of(),
                        "{\"error\":\"unauthorized\"}",
                        75
                )
        );

        assertThat(updated.name()).isEqualTo("Unauthorized");
        assertThat(updated.statusCode()).isEqualTo(401);
        assertThat(updated.delayMs()).isEqualTo(75);

        ResponseScenarioResponse activated = scenarioService.activateScenario(
                project.id(), endpoint.id(), created.id()
        );

        assertThat(activated.active()).isTrue();
        assertThat(scenarioService.getScenarios(project.id(), endpoint.id()))
                .filteredOn(ResponseScenarioResponse::active)
                .singleElement()
                .extracting(ResponseScenarioResponse::id)
                .isEqualTo(created.id());
        assertThat(endpointService.getEndpoint(project.id(), endpoint.id()).statusCode())
                .isEqualTo(401);

        ResponseScenarioResponse defaultScenario = scenarioService
                .getScenarios(project.id(), endpoint.id())
                .stream()
                .filter(scenario -> scenario.name().equals("Default"))
                .findFirst()
                .orElseThrow();

        scenarioService.deleteScenario(project.id(), endpoint.id(), defaultScenario.id());
        entityManager.flush();

        assertThat(scenarioService.getScenarios(project.id(), endpoint.id()))
                .extracting(ResponseScenarioResponse::name)
                .containsExactly("Unauthorized");
    }

    @Test
    void rejectsDuplicateNamesIgnoringCaseAndWhitespace() {
        ProjectResponse project = createProject("scenario-duplicate");
        EndpointResponse endpoint = createEndpoint(project);

        scenarioService.createScenario(
                project.id(), endpoint.id(), createRequest("  Not Found  ", 404, "{}")
        );

        assertThatThrownBy(() -> scenarioService.createScenario(
                project.id(), endpoint.id(), createRequest("not found", 400, "{}")
        ))
                .isInstanceOf(ResponseScenarioConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void preventsDeletingTheActiveScenario() {
        ProjectResponse project = createProject("scenario-active-delete");
        EndpointResponse endpoint = createEndpoint(project);
        ResponseScenarioResponse active = scenarioService
                .getScenarios(project.id(), endpoint.id())
                .getFirst();

        assertThatThrownBy(() -> scenarioService.deleteScenario(
                project.id(), endpoint.id(), active.id()
        ))
                .isInstanceOf(ResponseScenarioConflictException.class)
                .hasMessageContaining("active scenario");
    }

    @Test
    void scopesScenarioLookupToItsEndpoint() {
        ProjectResponse project = createProject("scenario-scope");
        EndpointResponse firstEndpoint = createEndpoint(project);
        EndpointResponse secondEndpoint = endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("Second", HttpMethod.GET, "/second")
        );
        ResponseScenarioResponse scenario = scenarioService.createScenario(
                project.id(), firstEndpoint.id(), createRequest("Error", 500, "{}")
        );

        assertThatThrownBy(() -> scenarioService.getScenario(
                project.id(), secondEndpoint.id(), scenario.id()
        )).isInstanceOf(ResponseScenarioNotFoundException.class);
    }

    @Test
    void clearsBodiesForBodylessScenarioStatuses() {
        ProjectResponse project = createProject("scenario-bodyless");
        EndpointResponse endpoint = createEndpoint(project);

        ResponseScenarioResponse scenario = scenarioService.createScenario(
                project.id(), endpoint.id(), createRequest("No content", 204, "{\"stale\":true}")
        );

        assertThat(scenario.body()).isEmpty();
    }

    private ProjectResponse createProject(String projectKey) {
        return projectService.createProject(new CreateProjectRequest(
                "Scenario test project", null, projectKey
        ));
    }

    private EndpointResponse createEndpoint(ProjectResponse project) {
        return endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("Users", HttpMethod.GET, "/users")
        );
    }

    private CreateResponseScenarioRequest createRequest(
            String name,
            int statusCode,
            String body
    ) {
        return new CreateResponseScenarioRequest(
                name, statusCode, "application/json", List.of(), body, 0
        );
    }
}
