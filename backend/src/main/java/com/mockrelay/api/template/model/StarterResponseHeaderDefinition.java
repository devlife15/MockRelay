package com.mockrelay.api.template.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StarterResponseHeaderDefinition(
        @NotBlank(message = "Template response header name is required")
        @Size(max = 256, message = "Header name must be at most 256 characters")
        @Pattern(
                regexp = "^[A-Za-z0-9!#$%&'*+.^_`|~-]+$",
                message = "Header name contains invalid characters"
        )
        String name,

        @Size(max = 4096, message = "Header value must be at most 4096 characters")
        @Pattern(regexp = "^[^\\r\\n]*$", message = "Header value cannot contain line breaks")
        String value,

        boolean enabled
) {
}
