package com.mockrelay.api.template.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record StarterApiTemplateDefinition(
        @Min(value = 1, message = "Template schema version must be at least 1")
        int schemaVersion,

        @NotBlank(message = "Template key is required")
        @Size(max = 64, message = "Template key must be at most 64 characters")
        @Pattern(
                regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Template key may contain lowercase letters, numbers, and single hyphens"
        )
        String key,

        @NotBlank(message = "Template name is required")
        @Size(max = 80, message = "Template name must be at most 80 characters")
        String name,

        @NotBlank(message = "Template description is required")
        @Size(max = 240, message = "Template description must be at most 240 characters")
        String description,

        @NotBlank(message = "Template category is required")
        @Size(max = 40, message = "Template category must be at most 40 characters")
        @Pattern(
                regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Template category must be a lowercase key"
        )
        String category,

        @NotNull(message = "Template tags are required")
        @Size(max = 8, message = "A template can have at most 8 tags")
        List<@NotBlank @Size(max = 32) String> tags,

        @NotNull(message = "Template behaviors are required")
        @Size(min = 1, max = 12, message = "A template must have between 1 and 12 behaviors")
        List<@NotBlank @Size(max = 40) String> behaviors,

        @NotBlank(message = "Template complexity is required")
        @Size(max = 16, message = "Template complexity must be at most 16 characters")
        String complexity,

        boolean featured,

        @NotNull(message = "Template limitations are required")
        @Size(max = 6, message = "A template can describe at most 6 limitations")
        List<@NotBlank @Size(max = 240) String> limitations,

        @NotNull(message = "Template endpoints are required")
        @Size(min = 1, max = 50, message = "A template must contain between 1 and 50 endpoints")
        List<@NotNull @Valid StarterEndpointDefinition> endpoints
) {

    public StarterApiTemplateDefinition {
        tags = immutableCopy(tags);
        behaviors = immutableCopy(behaviors);
        limitations = immutableCopy(limitations);
        endpoints = immutableCopy(endpoints);
    }

    private static <T> List<T> immutableCopy(List<T> values) {
        return values == null ? null : List.copyOf(values);
    }
}
