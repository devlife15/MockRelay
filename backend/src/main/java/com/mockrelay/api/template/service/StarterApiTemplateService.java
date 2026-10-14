package com.mockrelay.api.template.service;

import com.mockrelay.api.dto.StarterApiTemplateDetailResponse;
import com.mockrelay.api.dto.StarterApiTemplateEndpointPreviewResponse;
import com.mockrelay.api.dto.StarterApiTemplateScenarioPreviewResponse;
import com.mockrelay.api.dto.StarterApiTemplateSummaryResponse;
import com.mockrelay.api.exception.StarterApiTemplateNotFoundException;
import com.mockrelay.api.template.StarterApiTemplateCatalog;
import com.mockrelay.api.template.model.StarterApiTemplateDefinition;
import com.mockrelay.api.template.model.StarterEndpointDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StarterApiTemplateService {

    private final StarterApiTemplateCatalog catalog;

    public List<StarterApiTemplateSummaryResponse> getTemplates() {
        return catalog.findAll().stream()
                .map(this::toSummary)
                .toList();
    }

    public StarterApiTemplateDetailResponse getTemplate(String templateKey) {
        StarterApiTemplateDefinition template = catalog.findByKey(templateKey)
                .orElseThrow(() -> new StarterApiTemplateNotFoundException(templateKey));

        List<StarterApiTemplateEndpointPreviewResponse> endpoints = template.endpoints().stream()
                .map(this::toEndpointPreview)
                .toList();

        return new StarterApiTemplateDetailResponse(
                template.key(),
                template.name(),
                template.description(),
                template.category(),
                template.tags(),
                template.behaviors(),
                template.complexity(),
                template.featured(),
                template.limitations(),
                template.endpoints().size(),
                scenarioCount(template),
                endpoints
        );
    }

    private StarterApiTemplateSummaryResponse toSummary(StarterApiTemplateDefinition template) {
        return new StarterApiTemplateSummaryResponse(
                template.key(),
                template.name(),
                template.description(),
                template.category(),
                template.tags(),
                template.behaviors(),
                template.complexity(),
                template.featured(),
                template.limitations(),
                template.endpoints().size(),
                scenarioCount(template)
        );
    }

    private StarterApiTemplateEndpointPreviewResponse toEndpointPreview(
            StarterEndpointDefinition endpoint
    ) {
        List<StarterApiTemplateScenarioPreviewResponse> scenarios = endpoint.scenarios().stream()
                .map(scenario -> new StarterApiTemplateScenarioPreviewResponse(
                        scenario.name(),
                        scenario.active(),
                        scenario.statusCode(),
                        scenario.contentType(),
                        scenario.delayMs()
                ))
                .toList();

        return new StarterApiTemplateEndpointPreviewResponse(
                endpoint.name(),
                endpoint.method(),
                endpoint.path(),
                scenarios.size(),
                scenarios
        );
    }

    private int scenarioCount(StarterApiTemplateDefinition template) {
        return template.endpoints().stream()
                .mapToInt(endpoint -> endpoint.scenarios().size())
                .sum();
    }
}
