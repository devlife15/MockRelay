package com.mockrelay.api.template.model;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.validation.ValidEndpointPath;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record StarterEndpointDefinition(
        @NotBlank(message = "Template endpoint name is required")
        @Size(max = 80, message = "Endpoint name must be at most 80 characters")
        String name,

        @NotNull(message = "Template endpoint method is required")
        HttpMethod method,

        @NotBlank(message = "Template endpoint path is required")
        @Size(max = 255, message = "Endpoint path must be at most 255 characters")
        @ValidEndpointPath
        String path,

        @NotNull(message = "Template endpoint scenarios are required")
        @Size(min = 1, max = 20, message = "An endpoint must contain between 1 and 20 scenarios")
        List<@NotNull @Valid StarterScenarioDefinition> scenarios
) {

    public StarterEndpointDefinition {
        scenarios = scenarios == null ? null : List.copyOf(scenarios);
    }
}
