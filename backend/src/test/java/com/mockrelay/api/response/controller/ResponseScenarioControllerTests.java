package com.mockrelay.api.response.controller;

import com.mockrelay.api.dto.CreateEndpointRequest;
import com.mockrelay.api.dto.CreateProjectRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.ProjectResponse;
import com.mockrelay.api.endpoint.service.EndpointService;
import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.project.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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
class ResponseScenarioControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EndpointService endpointService;

    @Test
    void supportsTheNestedScenarioApi() throws Exception {
        ProjectResponse project = projectService.createProject(
                new CreateProjectRequest("Scenario controller", null, "scenario-controller")
        );
        EndpointResponse endpoint = endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("Users", HttpMethod.GET, "/users")
        );
        String collectionUrl = "/api/projects/" + project.id()
                + "/endpoints/" + endpoint.id() + "/scenarios";

        String location = mockMvc.perform(post(collectionUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Not found",
                                  "statusCode": 404,
                                  "contentType": "application/json",
                                  "headers": [],
                                  "body": "{\\\"error\\\":\\\"missing\\\"}",
                                  "delayMs": 25
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.name").value("Not found"))
                .andExpect(jsonPath("$.active").value(false))
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(get(collectionUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Default"));

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Server error",
                                  "statusCode": 500,
                                  "contentType": "application/problem+json",
                                  "headers": [],
                                  "body": "{\\\"error\\\":\\\"failed\\\"}",
                                  "delayMs": 50
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Server error"))
                .andExpect(jsonPath("$.statusCode").value(500));

        mockMvc.perform(put(location + "/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(get("/mock/scenario-controller/users"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("failed"));

        mockMvc.perform(delete(location))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Response scenario conflict"));
    }

    @Test
    void validatesScenarioRequests() throws Exception {
        ProjectResponse project = projectService.createProject(
                new CreateProjectRequest("Scenario validation", null, "scenario-validation")
        );
        EndpointResponse endpoint = endpointService.createEndpoint(
                project.id(),
                new CreateEndpointRequest("Users", HttpMethod.GET, "/users")
        );

        mockMvc.perform(post("/api/projects/{projectId}/endpoints/{endpointId}/scenarios",
                        project.id(), endpoint.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": " ",
                                  "statusCode": 99,
                                  "contentType": "",
                                  "headers": [],
                                  "body": "",
                                  "delayMs": -1
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid request"))
                .andExpect(jsonPath("$.errors").isArray());
    }
}
