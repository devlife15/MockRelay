package com.mockrelay.api.template.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

import java.util.List;

public record StarterScenarioDefinition(
        @NotBlank(message = "Template scenario name is required")
        @Size(max = 80, message = "Scenario name must be at most 80 characters")
        String name,

        boolean active,

        @Min(value = 100, message = "Status code must be at least 100")
        @Max(value = 599, message = "Status code must be at most 599")
        int statusCode,

        @NotBlank(message = "Scenario content type is required")
        @Size(max = 100, message = "Content type must be at most 100 characters")
        String contentType,

        @NotNull(message = "Scenario headers are required")
        @Size(max = 100, message = "At most 100 response headers are allowed")
        List<@NotNull @Valid StarterResponseHeaderDefinition> headers,

        JsonNode body,

        @Min(value = 0, message = "Scenario delay cannot be negative")
        @Max(value = 30000, message = "Scenario delay must be at most 30000 milliseconds")
        int delayMs
) {

    public StarterScenarioDefinition {
        headers = headers == null ? null : List.copyOf(headers);
    }
}
