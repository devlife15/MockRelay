package com.mockrelay.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 80, message = "Project name must be at most 80 characters")
        String name,

        @Size(max = 160, message = "Description must be at most 160 characters")
        String description,

        @NotBlank(message = "Project key is required")
        @Size(max = 48, message = "Project key must be at most 48 characters")
        @Pattern(
                regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Project key may contain lowercase letters, numbers, and single hyphens"
        )
        String projectKey
) {
}
