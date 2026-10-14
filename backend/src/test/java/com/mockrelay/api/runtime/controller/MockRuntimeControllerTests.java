package com.mockrelay.api.runtime.controller;

import com.mockrelay.api.dto.CreateEndpointRequest;
import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.dto.ResponseHeaderRequest;
import com.mockrelay.api.dto.UpdateEndpointRequest;
import com.mockrelay.api.endpoint.service.EndpointService;
import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.project.service.ProjectService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MockRuntimeControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EndpointService endpointService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    void returnsTheConfiguredResponseForAParameterizedRoute() throws Exception {
        ProjectResponse project = createProject("runtime-response");
        EndpointResponse endpoint = createEndpoint(
                project,
                HttpMethod.GET,
                "/users/{id}",
                "Get user"
        );
        configureEndpoint(
                project,
                endpoint,
                201,
                "application/json",
                List.of(
                        new ResponseHeaderRequest("X-Mock-Source", "MockRelay", true),
                        new ResponseHeaderRequest("X-Disabled", "hidden", false)
                ),
                "{\"name\":\"Ayan\"}",
                25
        );

        long startedAt = System.nanoTime();
        mockMvc.perform(get("/mock/runtime-response/users/42?expand=true"))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(header().string("X-Mock-Source", "MockRelay"))
                .andExpect(header().doesNotExist("X-Disabled"))
                .andExpect(content().json("{\"name\":\"Ayan\"}"));
        long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;

        assertThat(elapsedMs).isGreaterThanOrEqualTo(20);
    }

    @Test
    void prefersStaticRoutesAndKeepsHttpMethodsIndependent() throws Exception {
        ProjectResponse project = createProject("runtime-precedence");
        EndpointResponse dynamic = createEndpoint(
                project,
                HttpMethod.GET,
                "/users/{id}",
                "Dynamic user"
        );
        configureEndpoint(project, dynamic, 200, "text/plain", List.of(), "dynamic", 0);

        EndpointResponse staticGet = createEndpoint(
                project,
                HttpMethod.GET,
                "/users/me",
                "Current user"
        );
        configureEndpoint(project, staticGet, 200, "text/plain", List.of(), "static", 0);

        EndpointResponse staticPost = createEndpoint(
                project,
                HttpMethod.POST,
                "/users/me",
                "Create current user"
        );
        configureEndpoint(project, staticPost, 202, "text/plain", List.of(), "posted", 0);

        mockMvc.perform(get("/mock/runtime-precedence/users/me"))
                .andExpect(status().isOk())
                .andExpect(content().string("static"));

        mockMvc.perform(get("/mock/runtime-precedence/users/123"))
                .andExpect(status().isOk())
                .andExpect(content().string("dynamic"));

        mockMvc.perform(post("/mock/runtime-precedence/users/me"))
                .andExpect(status().isAccepted())
                .andExpect(content().string("posted"));

        mockMvc.perform(put("/mock/runtime-precedence/users/me"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Mock route not found"));
    }

    @Test
    void preservesAConfiguredErrorResponse() throws Exception {
        ProjectResponse project = createProject("runtime-error");
        EndpointResponse endpoint = createEndpoint(
                project,
                HttpMethod.GET,
                "/unavailable",
                "Unavailable"
        );
        configureEndpoint(
                project,
                endpoint,
                404,
                "application/json",
                List.of(),
                "{\"error\":\"Not available\"}",
                0
        );

        mockMvc.perform(get("/mock/runtime-error/unavailable"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"error\":\"Not available\"}"))
                .andExpect(jsonPath("$.title").doesNotExist());
    }

    @Test
    void returnsProblemDetailsWhenNoRouteMatches() throws Exception {
        createProject("runtime-missing");

        mockMvc.perform(get("/mock/runtime-missing/unknown"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Mock route not found"))
                .andExpect(jsonPath("$.detail").value(
                        "No mock endpoint matches GET /unknown in project runtime-missing"
                ));
    }

    @Test
    void mapsTheProjectRootToTheRootEndpoint() throws Exception {
        ProjectResponse project = createProject("runtime-root");
        EndpointResponse endpoint = createEndpoint(project, HttpMethod.GET, "/", "Root");
        configureEndpoint(project, endpoint, 200, "text/plain", List.of(), "root response", 0);

        mockMvc.perform(get("/mock/runtime-root"))
                .andExpect(status().isOk())
                .andExpect(content().string("root response"));

        mockMvc.perform(get("/mock/runtime-root/"))
                .andExpect(status().isOk())
                .andExpect(content().string("root response"));
    }

    @ParameterizedTest
    @ValueSource(ints = {204, 205, 304})
    void suppressesStaleBodiesAndContentTypesForBodylessStatuses(int statusCode) throws Exception {
        ProjectResponse project = createProject("runtime-bodyless-" + statusCode);
        EndpointResponse endpoint = createEndpoint(
                project,
                HttpMethod.GET,
                "/bodyless",
                "Bodyless response"
        );

        jdbcTemplate.update(
                """
                update mock_response_scenarios
                set status_code = ?, content_type = 'application/json', body = '{"stale":true}'
                where endpoint_id = ?
                """,
                statusCode,
                endpoint.id()
        );
        entityManager.clear();

        mockMvc.perform(get("/mock/runtime-bodyless-" + statusCode + "/bodyless"))
                .andExpect(status().is(statusCode))
                .andExpect(header().doesNotExist(HttpHeaders.CONTENT_TYPE))
                .andExpect(content().string(""));
    }

    private ProjectResponse createProject(String projectKey) {
        return projectService.createProject(new CreateProjectRequest(
                "Runtime test project",
                null,
                projectKey
        ));
    }

    private EndpointResponse createEndpoint(
            ProjectResponse project,
            HttpMethod method,
            String path,
            String name
    ) {
        return endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest(name, method, path)
        );
    }

    private EndpointResponse configureEndpoint(
            ProjectResponse project,
            EndpointResponse endpoint,
            int statusCode,
            String contentType,
            List<ResponseHeaderRequest> headers,
            String body,
            int delayMs
    ) {
        return endpointService.updateEndpoint(
                project.id(),
                endpoint.id(),
                new UpdateEndpointRequest(
                        endpoint.name(),
                        endpoint.method(),
                        endpoint.path(),
                        statusCode,
                        contentType,
                        headers,
                        body,
                        delayMs
                )
        );
    }
}
