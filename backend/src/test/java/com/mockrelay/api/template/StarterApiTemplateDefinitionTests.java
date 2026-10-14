package com.mockrelay.api.template;

import com.mockrelay.api.template.model.StarterApiTemplateDefinition;
import com.mockrelay.api.template.model.StarterEndpointDefinition;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StarterApiTemplateDefinitionTests {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator beanValidator = Validation.buildDefaultValidatorFactory().getValidator();
    private final StarterApiTemplateValidator templateValidator =
            new StarterApiTemplateValidator(beanValidator);

    @Test
    void loadsAndValidatesTheUsersApiDefinition() throws IOException {
        StarterApiTemplateDefinition template = loadUsersTemplate();

        assertThatNoException().isThrownBy(() -> templateValidator.validate(template));
        assertThat(template.key()).isEqualTo("users-api");
        assertThat(template.category()).isEqualTo("essentials");
        assertThat(template.behaviors())
                .contains("empty-state", "validation-errors", "delayed");
        assertThat(template.featured()).isTrue();
        assertThat(template.endpoints()).hasSize(3);
        assertThat(template.endpoints().getFirst().scenarios().getFirst().body().isObject())
                .isTrue();
        assertThat(template.endpoints())
                .extracting(endpoint -> endpoint.method() + " " + endpoint.path())
                .containsExactly("GET /users", "GET /users/{id}", "POST /users");
    }

    @Test
    void rejectsRoutesThatOnlyDifferByParameterName() throws IOException {
        StarterApiTemplateDefinition template = loadUsersTemplate();
        StarterEndpointDefinition getUser = template.endpoints().get(1);
        StarterEndpointDefinition duplicate = new StarterEndpointDefinition(
                "Get user by another parameter name",
                getUser.method(),
                "/users/{userId}",
                getUser.scenarios()
        );
        List<StarterEndpointDefinition> endpoints = new ArrayList<>(template.endpoints());
        endpoints.add(duplicate);
        StarterApiTemplateDefinition invalid = new StarterApiTemplateDefinition(
                template.schemaVersion(),
                template.key(),
                template.name(),
                template.description(),
                template.category(),
                template.tags(),
                template.behaviors(),
                template.complexity(),
                template.featured(),
                template.limitations(),
                endpoints
        );

        assertThatThrownBy(() -> templateValidator.validate(invalid))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("duplicate route GET /users/{}");
    }

    @Test
    void rejectsUnknownCatalogueBehaviorLabels() throws IOException {
        StarterApiTemplateDefinition template = loadUsersTemplate();
        List<String> behaviors = new ArrayList<>(template.behaviors());
        behaviors.add("sometimes-unreliable");
        StarterApiTemplateDefinition invalid = new StarterApiTemplateDefinition(
                template.schemaVersion(),
                template.key(),
                template.name(),
                template.description(),
                template.category(),
                template.tags(),
                behaviors,
                template.complexity(),
                template.featured(),
                template.limitations(),
                template.endpoints()
        );

        assertThatThrownBy(() -> templateValidator.validate(invalid))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unsupported behavior 'sometimes-unreliable'");
    }

    private StarterApiTemplateDefinition loadUsersTemplate() throws IOException {
        try (InputStream input = getClass().getResourceAsStream(
                "/templates/v1/users-api.json"
        )) {
            return objectMapper.readValue(input, StarterApiTemplateDefinition.class);
        }
    }
}
