package com.mockrelay.api.dto;

import com.mockrelay.api.entity.HttpMethod;

import java.util.List;

public record StarterApiTemplateEndpointPreviewResponse(
        String name,
        HttpMethod method,
        String path,
        int scenarioCount,
        List<StarterApiTemplateScenarioPreviewResponse> scenarios
) {
}
