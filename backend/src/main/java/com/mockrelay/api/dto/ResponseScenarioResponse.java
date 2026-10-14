package com.mockrelay.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ResponseScenarioResponse(
        UUID id,
        UUID endpointId,
        String name,
        boolean active,
        int statusCode,
        String contentType,
        List<ResponseHeaderResponse> headers,
        String body,
        int delayMs,
        Instant createdAt,
        Instant updatedAt
) {
}
