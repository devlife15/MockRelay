package com.mockrelay.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateResponseScenarioRequest(
        @NotBlank(message = "Scenario name is required")
        @Size(max = 80, message = "Scenario name must be at most 80 characters")
        String name,

        @Min(value = 100, message = "Status code must be at least 100")
        @Max(value = 599, message = "Status code must be at most 599")
        int statusCode,

        @NotBlank(message = "Content type is required")
        @Size(max = 100, message = "Content type must be at most 100 characters")
        String contentType,

        @NotNull(message = "Headers are required")
        @Size(max = 100, message = "At most 100 response headers are allowed")
        List<@Valid ResponseHeaderRequest> headers,

        @NotNull(message = "Response body is required")
        @Size(max = 1_000_000, message = "Response body must be at most 1000000 characters")
        String body,

        @Min(value = 0, message = "Delay cannot be negative")
        @Max(value = 30000, message = "Delay must be at most 30000 milliseconds")
        int delayMs
) {
}
