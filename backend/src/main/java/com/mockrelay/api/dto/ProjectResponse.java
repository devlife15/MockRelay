package com.mockrelay.api.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String projectKey,
        int endpointCount,
        Instant createdAt,
        Instant updatedAt
) {
}
