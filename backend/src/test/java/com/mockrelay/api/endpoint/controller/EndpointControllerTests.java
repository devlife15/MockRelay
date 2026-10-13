package com.mockrelay.api.endpoint.controller;

import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.project.service.ProjectService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EndpointControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EntityManager entityManager;

    @Test
    void supportsTheNestedEndpointCrudApi() throws Exception {
        ProjectResponse project = createProject("controller-crud");
        String collectionUrl = "/api/projects/" + project.id() + "/endpoints";

        String location = mockMvc.perform(post(collectionUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Get user",
                                  "method": "GET",
                                  "path": "/users/{id}"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.projectId").value(project.id().toString()))
                .andExpect(jsonPath("$.method").value("GET"))
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.contentType").value("application/json"))
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Update user",
                                  "method": "PUT",
                                  "path": "/users/{userId}",
                                  "statusCode": 201,
                                  "contentType": "application/json",
                                  "headers": [
                                    {
                                      "name": "X-Mock-Source",
                                      "value": "MockRelay",
                                      "enabled": true
                                    }
                                  ],
                                  "body": "{\\\"updated\\\":true}",
                                  "delayMs": 150
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Update user"))
                .andExpect(jsonPath("$.method").value("PUT"))
                .andExpect(jsonPath("$.headers[0].name").value("X-Mock-Source"))
                .andExpect(jsonPath("$.body").value("{\"updated\":true}"))
                .andExpect(jsonPath("$.delayMs").value(150));

        mockMvc.perform(get(collectionUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].path").value("/users/{userId}"));

        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(201));

        mockMvc.perform(delete(location))
                .andExpect(status().isNoContent());

        entityManager.clear();

        mockMvc.perform(get(location))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Endpoint not found"));
    }

    @Test
    void returnsValidationErrorsForInvalidEndpointConfiguration() throws Exception {
        ProjectResponse project = createProject("controller-validation");
        String collectionUrl = "/api/projects/" + project.id() + "/endpoints";

        mockMvc.perform(post(collectionUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Invalid path",
                                  "method": "GET",
                                  "path": "/users/{}"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid request"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void returnsConflictForAnEquivalentRoute() throws Exception {
        ProjectResponse project = createProject("controller-conflict");
        String collectionUrl = "/api/projects/" + project.id() + "/endpoints";

        mockMvc.perform(post(collectionUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"First","method":"GET","path":"/orders/{id}"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post(collectionUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Second","method":"GET","path":"/orders/{orderId}"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Endpoint route conflict"));
    }

    @Test
    void returnsNotFoundWhenTheProjectDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/projects/{projectId}/endpoints", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Project not found"));
    }

    private ProjectResponse createProject(String projectKey) {
        return projectService.createProject(new CreateProjectRequest(
                "Controller endpoint test",
                null,
                projectKey
        ));
    }
}
