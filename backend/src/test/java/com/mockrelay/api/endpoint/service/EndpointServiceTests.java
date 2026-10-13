package com.mockrelay.api.endpoint.service;

import com.mockrelay.api.dto.CreateEndpointRequest;
import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.dto.ResponseHeaderRequest;
import com.mockrelay.api.dto.UpdateEndpointRequest;
import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.exception.EndpointNotFoundException;
import com.mockrelay.api.exception.EndpointRouteConflictException;
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
class EndpointServiceTests {

    @Autowired
    private EndpointService endpointService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EntityManager entityManager;

    @Test
    void createsUpdatesListsAndDeletesAnEndpoint() {
        ProjectResponse project = createProject("service-crud");

        EndpointResponse created = endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("  Get user  ", HttpMethod.GET, "/users/{id}")
        );

        assertThat(created.id()).isNotNull();
        assertThat(created.name()).isEqualTo("Get user");
        assertThat(created.method()).isEqualTo(HttpMethod.GET);
        assertThat(created.path()).isEqualTo("/users/{id}");
        assertThat(created.statusCode()).isEqualTo(200);
        assertThat(created.contentType()).isEqualTo("application/json");
        assertThat(created.headers()).isEmpty();
        assertThat(created.body()).contains("Mock response");
        assertThat(created.delayMs()).isZero();
        assertThat(created.createdAt()).isNotNull();

        EndpointResponse updated = endpointService.updateEndpoint(
                project.id(),
                created.id(),
                new UpdateEndpointRequest(
                        "Updated user",
                        HttpMethod.PATCH,
                        "/users/{userId}",
                        202,
                        " application/problem+json ",
                        List.of(new ResponseHeaderRequest("X-Mock-Source", "MockRelay", true)),
                        "{\"accepted\":true}",
                        250
                )
        );

        assertThat(updated.method()).isEqualTo(HttpMethod.PATCH);
        assertThat(updated.path()).isEqualTo("/users/{userId}");
        assertThat(updated.statusCode()).isEqualTo(202);
        assertThat(updated.contentType()).isEqualTo("application/problem+json");
        assertThat(updated.headers()).singleElement()
                .satisfies(header -> {
                    assertThat(header.name()).isEqualTo("X-Mock-Source");
                    assertThat(header.value()).isEqualTo("MockRelay");
                    assertThat(header.enabled()).isTrue();
                });
        assertThat(updated.body()).isEqualTo("{\"accepted\":true}");
        assertThat(updated.delayMs()).isEqualTo(250);
        assertThat(endpointService.getEndpoints(project.id()))
                .extracting(EndpointResponse::id)
                .containsExactly(created.id());

        endpointService.deleteEndpoint(project.id(), created.id());
        entityManager.clear();

        assertThatThrownBy(() -> endpointService.getEndpoint(project.id(), created.id()))
                .isInstanceOf(EndpointNotFoundException.class);
    }

    @Test
    void treatsDifferentlyNamedPathParametersAsTheSameRoute() {
        ProjectResponse project = createProject("route-signature");
        endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("First", HttpMethod.GET, "/users/{id}")
        );

        assertThatThrownBy(() -> endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("Duplicate", HttpMethod.GET, "/users/{userId}")
        ))
                .isInstanceOf(EndpointRouteConflictException.class)
                .hasMessageContaining("GET /users/{}");

        EndpointResponse postEndpoint = endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("Create", HttpMethod.POST, "/users/{userId}")
        );
        assertThat(postEndpoint.method()).isEqualTo(HttpMethod.POST);
    }

    @Test
    void preventsAccessThroughAnotherProject() {
        ProjectResponse owner = createProject("owner-project");
        ProjectResponse other = createProject("other-project");
        EndpointResponse endpoint = endpointService.createEndpoint(
                owner.id(),
                new CreateEndpointRequest("Private endpoint", HttpMethod.GET, "/private")
        );

        assertThatThrownBy(() -> endpointService.getEndpoint(other.id(), endpoint.id()))
                .isInstanceOf(EndpointNotFoundException.class);
    }

    private ProjectResponse createProject(String projectKey) {
        return projectService.createProject(new CreateProjectRequest(
                "Endpoint test project",
                null,
                projectKey
        ));
    }
}
