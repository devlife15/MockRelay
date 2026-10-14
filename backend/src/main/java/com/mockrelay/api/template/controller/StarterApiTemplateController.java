package com.mockrelay.api.template.controller;

import com.mockrelay.api.dto.StarterApiTemplateDetailResponse;
import com.mockrelay.api.dto.StarterApiTemplateSummaryResponse;
import com.mockrelay.api.template.service.StarterApiTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/project-templates")
@RequiredArgsConstructor
public class StarterApiTemplateController {

    private final StarterApiTemplateService templateService;

    @GetMapping
    public List<StarterApiTemplateSummaryResponse> getTemplates() {
        return templateService.getTemplates();
    }

    @GetMapping("/{templateKey}")
    public StarterApiTemplateDetailResponse getTemplate(@PathVariable String templateKey) {
        return templateService.getTemplate(templateKey);
    }
}
