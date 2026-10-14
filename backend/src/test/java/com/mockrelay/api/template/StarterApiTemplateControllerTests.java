package com.mockrelay.api.template;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StarterApiTemplateControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsLightweightTemplateCards() throws Exception {
        mockMvc.perform(get("/api/project-templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].key").value("loyalty-points"))
                .andExpect(jsonPath("$[0].category").value("loyalty-retail"))
                .andExpect(jsonPath("$[0].endpointCount").value(7))
                .andExpect(jsonPath("$[0].scenarioCount").value(26))
                .andExpect(jsonPath("$[0].featured").value(true))
                .andExpect(jsonPath("$[0].endpoints").doesNotExist())
                .andExpect(jsonPath("$[1].key").value("users-api"))
                .andExpect(jsonPath("$[1].endpointCount").value(3));
    }

    @Test
    void previewsRoutesAndScenariosWithoutReturningConfiguredBodies() throws Exception {
        mockMvc.perform(get("/api/project-templates/users-api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("users-api"))
                .andExpect(jsonPath("$.endpoints[0].method").value("GET"))
                .andExpect(jsonPath("$.endpoints[0].path").value("/users"))
                .andExpect(jsonPath("$.endpoints[0].scenarios[0].name").value("Success"))
                .andExpect(jsonPath("$.endpoints[0].scenarios[0].statusCode").value(200))
                .andExpect(jsonPath("$.endpoints[0].scenarios[0].contentType")
                        .value("application/json"))
                .andExpect(jsonPath("$.endpoints[0].scenarios[0].body").doesNotExist())
                .andExpect(jsonPath("$.endpoints[0].scenarios[0].headers").doesNotExist());
    }

    @Test
    void previewsTheLoyaltyTemplateWithoutExposingConfiguredBodies() throws Exception {
        mockMvc.perform(get("/api/project-templates/loyalty-points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("loyalty-points"))
                .andExpect(jsonPath("$.endpoints.length()").value(7))
                .andExpect(jsonPath("$.endpoints[0].path").value("/tiers"))
                .andExpect(jsonPath("$.endpoints[6].method").value("POST"))
                .andExpect(jsonPath("$.endpoints[6].path").value("/redemptions"))
                .andExpect(jsonPath("$.endpoints[6].scenarios.length()").value(7))
                .andExpect(jsonPath("$.endpoints[6].scenarios[0].name")
                        .value("Redemption accepted"))
                .andExpect(jsonPath("$.endpoints[6].scenarios[0].body").doesNotExist())
                .andExpect(jsonPath("$.endpoints[6].scenarios[0].headers").doesNotExist());
    }

    @Test
    void returnsNotFoundForAnUnknownTemplate() throws Exception {
        mockMvc.perform(get("/api/project-templates/missing-template"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Starter API template not found"));
    }
}
