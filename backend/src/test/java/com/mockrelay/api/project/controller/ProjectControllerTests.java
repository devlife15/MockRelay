package com.mockrelay.api.project.controller;

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
class ProjectControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void supportsTheProjectCrudApi() throws Exception {
        String location = mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Storefront API",
                                  "description": "Mocks the storefront backend",
                                  "projectKey": "storefront-api"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.name").value("Storefront API"))
                .andExpect(jsonPath("$.projectKey").value("storefront-api"))
                .andExpect(jsonPath("$.endpointCount").value(0))
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Mocks the storefront backend"));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].projectKey").value("storefront-api"));

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Storefront API v2",
                                  "description": "Updated project",
                                  "projectKey": "storefront-v2"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Storefront API v2"))
                .andExpect(jsonPath("$.projectKey").value("storefront-v2"));

        mockMvc.perform(delete(location))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(location))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Project not found"));
    }

    @Test
    void returnsValidationErrorsForAnInvalidRequestBody() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": null,
                                  "projectKey": "Invalid Key"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid request"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void createsAProjectFromAStarterTemplate() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Loyalty sandbox",
                                  "description": "Created from a starter template",
                                  "projectKey": "loyalty-controller-test",
                                  "templateKey": "loyalty-points"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.projectKey").value("loyalty-controller-test"))
                .andExpect(jsonPath("$.endpointCount").value(7));
    }

    @Test
    void servesMocksImmediatelyAfterTemplateInstantiation() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Runtime loyalty sandbox",
                                  "description": null,
                                  "projectKey": "loyalty-runtime-test",
                                  "templateKey": "loyalty-points"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/mock/loyalty-runtime-test/tiers"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/json"))
                .andExpect(jsonPath("$.data.length()").value(4))
                .andExpect(jsonPath("$.data[3].name").value("Platinum"));

        mockMvc.perform(get("/mock/loyalty-runtime-test/members"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", "24"))
                .andExpect(jsonPath("$.data.length()").value(10))
                .andExpect(jsonPath("$.pagination.totalItems").value(24));

        mockMvc.perform(post("/mock/loyalty-runtime-test/redemptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "memberId": "member_1004",
                                  "rewardId": "reward_1001"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string(
                        "Location",
                        "/redemptions/redemption_1046"
                ))
                .andExpect(jsonPath("$.status").value("pending"));
    }

    @Test
    void returnsNotFoundForAnUnknownStarterTemplate() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Unknown template",
                                  "description": null,
                                  "projectKey": "unknown-template-controller-test",
                                  "templateKey": "missing-template"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Starter API template not found"));
    }

    @Test
    void returnsBadRequestForAnInvalidProjectId() throws Exception {
        mockMvc.perform(get("/api/projects/not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid parameter"));
    }

    @Test
    void returnsNotFoundForAnUnknownProject() throws Exception {
        mockMvc.perform(get("/api/projects/{projectId}", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
