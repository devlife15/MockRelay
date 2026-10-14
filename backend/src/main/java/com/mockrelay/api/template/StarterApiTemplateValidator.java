package com.mockrelay.api.template;

import com.mockrelay.api.response.ResponseBodyPolicy;
import com.mockrelay.api.template.model.StarterApiTemplateDefinition;
import com.mockrelay.api.template.model.StarterEndpointDefinition;
import com.mockrelay.api.template.model.StarterScenarioDefinition;
import com.mockrelay.api.validation.EndpointPathNormalizer;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

@Component
public class StarterApiTemplateValidator {

    public static final int SUPPORTED_SCHEMA_VERSION = 1;
    public static final Set<String> SUPPORTED_CATEGORIES = Set.of(
            "essentials",
            "loyalty-retail",
            "commerce",
            "content-social",
            "business",
            "jobs-hr",
            "finance",
            "travel-hospitality",
            "education",
            "health-fitness",
            "media-entertainment",
            "developer-tools",
            "logistics"
    );
    public static final Set<String> SUPPORTED_BEHAVIORS = Set.of(
            "paginated",
            "auth",
            "async",
            "error-heavy",
            "scenario-driven",
            "delayed",
            "custom-headers",
            "bodyless-responses",
            "nested-resources",
            "file-upload",
            "webhook",
            "state-machine",
            "empty-state",
            "validation-errors"
    );
    public static final Set<String> SUPPORTED_COMPLEXITIES = Set.of(
            "basic",
            "standard",
            "advanced"
    );

    private final Validator validator;

    public StarterApiTemplateValidator(Validator validator) {
        this.validator = validator;
    }

    public void validate(StarterApiTemplateDefinition template) {
        Set<String> errors = new LinkedHashSet<>();

        validator.validate(template).stream()
                .map(this::formatViolation)
                .forEach(errors::add);

        if (template.schemaVersion() != SUPPORTED_SCHEMA_VERSION) {
            errors.add("schemaVersion: unsupported version " + template.schemaVersion());
        }

        validateCatalogueMetadata(template, errors);

        validateEndpoints(template, errors);

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(
                    "Invalid starter API template '" + template.key() + "': "
                            + String.join("; ", errors)
            );
        }
    }

    private void validateCatalogueMetadata(
            StarterApiTemplateDefinition template,
            Set<String> errors
    ) {
        if (template.category() != null && !SUPPORTED_CATEGORIES.contains(template.category())) {
            errors.add("category: unsupported category '" + template.category() + "'");
        }

        if (template.complexity() != null
                && !SUPPORTED_COMPLEXITIES.contains(template.complexity())) {
            errors.add("complexity: unsupported complexity '" + template.complexity() + "'");
        }

        if (template.behaviors() == null) {
            return;
        }

        Set<String> uniqueBehaviors = new HashSet<>();
        for (String behavior : template.behaviors()) {
            if (behavior == null) {
                continue;
            }
            if (!SUPPORTED_BEHAVIORS.contains(behavior)) {
                errors.add("behaviors: unsupported behavior '" + behavior + "'");
            }
            if (!uniqueBehaviors.add(behavior)) {
                errors.add("behaviors: duplicate behavior '" + behavior + "'");
            }
        }
    }

    private void validateEndpoints(StarterApiTemplateDefinition template, Set<String> errors) {
        if (template.endpoints() == null) {
            return;
        }

        Set<String> routes = new HashSet<>();
        for (int endpointIndex = 0; endpointIndex < template.endpoints().size(); endpointIndex++) {
            StarterEndpointDefinition endpoint = template.endpoints().get(endpointIndex);
            if (endpoint == null) {
                continue;
            }

            if (endpoint.method() != null && EndpointPathNormalizer.isValid(endpoint.path())) {
                String route = endpoint.method() + " "
                        + EndpointPathNormalizer.toSignature(endpoint.path());
                if (!routes.add(route)) {
                    errors.add("endpoints[" + endpointIndex + "]: duplicate route " + route);
                }
            }

            validateScenarios(endpoint, endpointIndex, errors);
        }
    }

    private void validateScenarios(
            StarterEndpointDefinition endpoint,
            int endpointIndex,
            Set<String> errors
    ) {
        if (endpoint.scenarios() == null) {
            return;
        }

        long activeCount = endpoint.scenarios().stream()
                .filter(scenario -> scenario != null && scenario.active())
                .count();
        if (activeCount != 1) {
            errors.add("endpoints[" + endpointIndex + "].scenarios: exactly one scenario must be active");
        }

        Set<String> scenarioNames = new HashSet<>();
        for (int scenarioIndex = 0; scenarioIndex < endpoint.scenarios().size(); scenarioIndex++) {
            StarterScenarioDefinition scenario = endpoint.scenarios().get(scenarioIndex);
            if (scenario == null) {
                continue;
            }

            String location = "endpoints[" + endpointIndex + "].scenarios[" + scenarioIndex + "]";
            if (scenario.name() != null
                    && !scenarioNames.add(scenario.name().trim().toLowerCase(Locale.ROOT))) {
                errors.add(location + ": scenario names must be unique within an endpoint");
            }

            validateBody(scenario, location, errors);
        }
    }

    private void validateBody(
            StarterScenarioDefinition scenario,
            String location,
            Set<String> errors
    ) {
        JsonNode body = scenario.body();
        if (!ResponseBodyPolicy.allowsBody(scenario.statusCode())) {
            if (body != null && !body.isNull()) {
                errors.add(location + ".body: status " + scenario.statusCode() + " cannot have a body");
            }
            return;
        }

        boolean isJson = scenario.contentType() != null
                && scenario.contentType().toLowerCase(Locale.ROOT).contains("json");
        if (!isJson && (body == null || !body.isString())) {
            errors.add(location + ".body: non-JSON content must use a string body");
            return;
        }

        if (body != null && body.toString().length() > 1_000_000) {
            errors.add(location + ".body: body must be at most 1000000 characters");
        }
    }

    private String formatViolation(ConstraintViolation<StarterApiTemplateDefinition> violation) {
        return violation.getPropertyPath() + ": " + violation.getMessage();
    }
}
