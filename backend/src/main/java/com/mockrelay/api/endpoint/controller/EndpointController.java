package com.mockrelay.api.endpoint.controller;

import com.mockrelay.api.dto.CreateEndpointRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.UpdateEndpointRequest;
import com.mockrelay.api.endpoint.service.EndpointService;
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
@RequestMapping("/api/projects/{projectId}/endpoints")
@RequiredArgsConstructor
public class EndpointController {

    private final EndpointService endpointService;

    @PostMapping
    public ResponseEntity<EndpointResponse> createEndpoint(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateEndpointRequest request
    ) {
        EndpointResponse endpoint = endpointService.createEndpoint(projectId, request);
        URI location = URI.create(
                "/api/projects/" + projectId + "/endpoints/" + endpoint.id()
        );
        return ResponseEntity.created(location).body(endpoint);
    }

    @GetMapping
    public List<EndpointResponse> getEndpoints(@PathVariable UUID projectId) {
        return endpointService.getEndpoints(projectId);
    }

    @GetMapping("/{endpointId}")
    public EndpointResponse getEndpoint(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId
    ) {
        return endpointService.getEndpoint(projectId, endpointId);
    }

    @PutMapping("/{endpointId}")
    public EndpointResponse updateEndpoint(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId,
            @Valid @RequestBody UpdateEndpointRequest request
    ) {
        return endpointService.updateEndpoint(projectId, endpointId, request);
    }

    @DeleteMapping("/{endpointId}")
    public ResponseEntity<Void> deleteEndpoint(
            @PathVariable UUID projectId,
            @PathVariable UUID endpointId
    ) {
        endpointService.deleteEndpoint(projectId, endpointId);
        return ResponseEntity.noContent().build();
    }
}
