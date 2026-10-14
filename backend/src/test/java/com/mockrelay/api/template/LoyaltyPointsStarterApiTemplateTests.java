package com.mockrelay.api.template;

import com.mockrelay.api.template.model.StarterApiTemplateDefinition;
import com.mockrelay.api.template.model.StarterEndpointDefinition;
import com.mockrelay.api.template.model.StarterScenarioDefinition;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

class LoyaltyPointsStarterApiTemplateTests {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StarterApiTemplateValidator templateValidator = new StarterApiTemplateValidator(
            Validation.buildDefaultValidatorFactory().getValidator()
    );

    @Test
    void loadsTheApprovedLoyaltyContract() throws IOException {
        StarterApiTemplateDefinition template = loadTemplate();

        assertThatNoException().isThrownBy(() -> templateValidator.validate(template));
        assertThat(template.key()).isEqualTo("loyalty-points");
        assertThat(template.category()).isEqualTo("loyalty-retail");
        assertThat(template.complexity()).isEqualTo("advanced");
        assertThat(template.featured()).isTrue();
        assertThat(template.behaviors()).containsExactly(
                "paginated",
                "error-heavy",
                "scenario-driven",
                "state-machine",
                "empty-state",
                "validation-errors",
                "custom-headers"
        );
        assertThat(template.endpoints())
                .extracting(endpoint -> endpoint.method() + " " + endpoint.path())
                .containsExactly(
                        "GET /tiers",
                        "GET /members",
                        "GET /members/{id}",
                        "GET /members/{id}/points-ledger",
                        "GET /rewards",
                        "GET /redemptions/{id}",
                        "POST /redemptions"
                );
        assertThat(template.endpoints()).hasSize(7);
        assertThat(template.endpoints().stream()
                .flatMap(endpoint -> endpoint.scenarios().stream()))
                .hasSize(26);
        assertThat(template.endpoints())
                .allSatisfy(endpoint -> assertThat(endpoint.scenarios())
                        .filteredOn(StarterScenarioDefinition::active)
                        .hasSize(1));
    }

    @Test
    void keepsTheApprovedPaginationAndMemberRepresentations() throws IOException {
        StarterApiTemplateDefinition template = loadTemplate();
        StarterEndpointDefinition listMembers = endpoint(template, "GET /members");
        StarterEndpointDefinition getMember = endpoint(template, "GET /members/{id}");
        StarterScenarioDefinition membersAvailable = listMembers.scenarios().getFirst();
        StarterScenarioDefinition activeMember = getMember.scenarios().getFirst();

        assertThat(membersAvailable.body().path("data").size()).isEqualTo(10);
        assertThat(membersAvailable.body().path("pagination").path("totalItems").asInt())
                .isEqualTo(24);
        assertThat(membersAvailable.headers())
                .anySatisfy(header -> {
                    assertThat(header.name()).isEqualTo("X-Total-Count");
                    assertThat(header.value()).isEqualTo("24");
                    assertThat(header.enabled()).isTrue();
                });
        assertThat(activeMember.body().path("id").stringValue()).isEqualTo("member_1004");
        assertThat(membersAvailable.body().path("data"))
                .anySatisfy(member -> assertThat(member).isEqualTo(activeMember.body()));
    }

    @Test
    void includesEveryApprovedRedemptionOutcome() throws IOException {
        StarterEndpointDefinition createRedemption = endpoint(
                loadTemplate(),
                "POST /redemptions"
        );

        assertThat(createRedemption.scenarios())
                .extracting(StarterScenarioDefinition::statusCode)
                .containsExactly(201, 400, 403, 404, 404, 409, 422);
        assertThat(createRedemption.scenarios())
                .extracting(StarterScenarioDefinition::name)
                .containsExactly(
                        "Redemption accepted",
                        "Invalid request body",
                        "Suspended member",
                        "Member not found",
                        "Reward not found",
                        "Reward unavailable",
                        "Insufficient points"
                );
        assertThat(createRedemption.scenarios().getFirst().headers())
                .anySatisfy(header -> {
                    assertThat(header.name()).isEqualTo("Location");
                    assertThat(header.value()).isEqualTo("/redemptions/redemption_1046");
                });
        assertThat(createRedemption.scenarios().getFirst().body().path("status").stringValue())
                .isEqualTo("pending");
    }

    private StarterEndpointDefinition endpoint(
            StarterApiTemplateDefinition template,
            String route
    ) {
        return template.endpoints().stream()
                .filter(endpoint -> (endpoint.method() + " " + endpoint.path()).equals(route))
                .findFirst()
                .orElseThrow();
    }

    private StarterApiTemplateDefinition loadTemplate() throws IOException {
        try (InputStream input = getClass().getResourceAsStream(
                "/templates/v1/loyalty-points.json"
        )) {
            return objectMapper.readValue(input, StarterApiTemplateDefinition.class);
        }
    }
}
