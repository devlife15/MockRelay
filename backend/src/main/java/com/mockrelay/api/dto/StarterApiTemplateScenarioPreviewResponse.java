package com.mockrelay.api.dto;

public record StarterApiTemplateScenarioPreviewResponse(
        String name,
        boolean active,
        int statusCode,
        String contentType,
        int delayMs
) {
}
