package com.mockrelay.api.response.controller;

import com.mockrelay.api.dto.CreateResponseScenarioRequest;
import com.mockrelay.api.dto.ResponseScenarioResponse;
import com.mockrelay.api.dto.UpdateResponseScenarioRequest;
import com.mockrelay.api.response.service.ResponseScenarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/endpoints/{endpointId}/scenarios")
@RequiredArgsConstructor
public class ResponseScenarioController {

    private final ResponseScenarioService scenarioService;

    @PostMapping
    public ResponseEntity<ResponseScenarioResponse> createScenario(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId,
            @Valid @RequestBody CreateResponseScenarioRequest request
    ) {
        ResponseScenarioResponse scenario = scenarioService.createScenario(
                projectId, endpointId, request
        );
        URI location = URI.create(
                "/api/projects/" + projectId + "/endpoints/" + endpointId
                        + "/scenarios/" + scenario.id()
        );
        return ResponseEntity.created(location).body(scenario);
    }

    @GetMapping
    public List<ResponseScenarioResponse> getScenarios(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId
    ) {
        return scenarioService.getScenarios(projectId, endpointId);
    }

    @GetMapping("/{scenarioId}")
    public ResponseScenarioResponse getScenario(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId,
            @PathVariable UUID scenarioId
    ) {
        return scenarioService.getScenario(projectId, endpointId, scenarioId);
    }

    @PutMapping("/{scenarioId}")
    public ResponseScenarioResponse updateScenario(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId,
            @PathVariable UUID scenarioId,
            @Valid @RequestBody UpdateResponseScenarioRequest request
    ) {
        return scenarioService.updateScenario(projectId, endpointId, scenarioId, request);
    }

    @PutMapping("/{scenarioId}/activate")
    public ResponseScenarioResponse activateScenario(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId,
            @PathVariable UUID scenarioId
    ) {
        return scenarioService.activateScenario(projectId, endpointId, scenarioId);
    }

    @DeleteMapping("/{scenarioId}")
    public ResponseEntity<Void> deleteScenario(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId,
            @PathVariable UUID scenarioId
    ) {
        scenarioService.deleteScenario(projectId, endpointId, scenarioId);
        return ResponseEntity.noContent().build();
    }
}
