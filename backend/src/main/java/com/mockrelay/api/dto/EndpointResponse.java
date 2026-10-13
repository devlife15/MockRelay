package com.mockrelay.api.dto;

import com.mockrelay.api.entity.HttpMethod;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EndpointResponse(
        UUID id,
        UUID projectId,
        String name,
        HttpMethod method,
        String path,
        int statusCode,
        String contentType,
        List<ResponseHeaderResponse> headers,
        String body,
        int delayMs,
        Instant createdAt,
        Instant updatedAt
) {
}
