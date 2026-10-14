package com.mockrelay.api.dto;

import java.util.List;

public record StarterApiTemplateDetailResponse(
        String key,
        String name,
        String description,
        String category,
        List<String> tags,
        List<String> behaviors,
        String complexity,
        boolean featured,
        List<String> limitations,
        int endpointCount,
        int scenarioCount,
        List<StarterApiTemplateEndpointPreviewResponse> endpoints
) {
}
