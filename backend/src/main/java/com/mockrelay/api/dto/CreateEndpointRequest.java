package com.mockrelay.api.dto;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.validation.ValidEndpointPath;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEndpointRequest(
        @Size(max = 80, message = "Endpoint name must be at most 80 characters")
        String name,

        @NotNull(message = "HTTP method is required")
        HttpMethod method,

        @NotBlank(message = "Endpoint path is required")
        @Size(max = 255, message = "Endpoint path must be at most 255 characters")
        @ValidEndpointPath
        String path
) {
}
