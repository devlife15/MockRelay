package com.mockrelay.api.response.service;

import com.mockrelay.api.dto.CreateResponseScenarioRequest;
import com.mockrelay.api.dto.ResponseHeaderRequest;
import com.mockrelay.api.dto.ResponseHeaderResponse;
import com.mockrelay.api.dto.ResponseScenarioResponse;
import com.mockrelay.api.dto.UpdateResponseScenarioRequest;
import com.mockrelay.api.entity.MockEndpoint;
import com.mockrelay.api.entity.MockResponseScenario;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.exception.EndpointNotFoundException;
import com.mockrelay.api.exception.ResponseScenarioConflictException;
import com.mockrelay.api.exception.ResponseScenarioNotFoundException;
import com.mockrelay.api.repository.MockEndpointRepository;
import com.mockrelay.api.repository.MockResponseScenarioRepository;
import com.mockrelay.api.response.ResponseBodyPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResponseScenarioService {

    private static final int MAX_SCENARIOS_PER_ENDPOINT = 20;

    private final MockEndpointRepository endpointRepository;
    private final MockResponseScenarioRepository scenarioRepository;

    @Transactional
    public ResponseScenarioResponse createScenario(
            UUID projectId,
            UUID endpointId,
            CreateResponseScenarioRequest request
    ) {
        MockEndpoint endpoint = findEndpoint(projectId, endpointId);
        String name = normalizeName(request.name());

        if (scenarioRepository.countByEndpoint_Id(endpointId) >= MAX_SCENARIOS_PER_ENDPOINT) {
            throw new ResponseScenarioConflictException(
                    "An endpoint can have at most " + MAX_SCENARIOS_PER_ENDPOINT + " scenarios"
            );
        }
        ensureNameIsAvailable(endpointId, name, null);

        MockResponseScenario scenario = new MockResponseScenario();
        scenario.setName(name);
        scenario.setActive(false);
        applyConfiguration(
                scenario,
                request.statusCode(),
                request.contentType(),
                request.headers(),
                request.body(),
                request.delayMs()
        );
        endpoint.addScenario(scenario);

        return toResponse(scenarioRepository.saveAndFlush(scenario));
    }

    @Transactional(readOnly = true)
    public List<ResponseScenarioResponse> getScenarios(UUID projectId, UUID endpointId) {
        findEndpoint(projectId, endpointId);
        return scenarioRepository.findAllByEndpoint_IdOrderByCreatedAtAsc(endpointId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResponseScenarioResponse getScenario(
            UUID projectId,
            UUID endpointId,
            UUID scenarioId
    ) {
        findEndpoint(projectId, endpointId);
        return toResponse(findScenario(endpointId, scenarioId));
    }

    @Transactional
    public ResponseScenarioResponse updateScenario(
            UUID projectId,
            UUID endpointId,
            UUID scenarioId,
            UpdateResponseScenarioRequest request
    ) {
        findEndpoint(projectId, endpointId);
        MockResponseScenario scenario = findScenario(endpointId, scenarioId);
        String name = normalizeName(request.name());
        ensureNameIsAvailable(endpointId, name, scenarioId);

        scenario.setName(name);
        applyConfiguration(
                scenario,
                request.statusCode(),
                request.contentType(),
                request.headers(),
                request.body(),
                request.delayMs()
        );

        return toResponse(scenarioRepository.saveAndFlush(scenario));
    }

    @Transactional
    public ResponseScenarioResponse activateScenario(
            UUID projectId,
            UUID endpointId,
            UUID scenarioId
    ) {
        findEndpoint(projectId, endpointId);
        MockResponseScenario target = findScenario(endpointId, scenarioId);

        if (target.isActive()) {
            return toResponse(target);
        }

        scenarioRepository.findByEndpoint_IdAndActiveTrue(endpointId)
                .ifPresent(current -> {
                    current.setActive(false);
                    scenarioRepository.saveAndFlush(current);
                });

        target.setActive(true);
        return toResponse(scenarioRepository.saveAndFlush(target));
    }

    @Transactional
    public void deleteScenario(UUID projectId, UUID endpointId, UUID scenarioId) {
        MockEndpoint endpoint = findEndpoint(projectId, endpointId);
        MockResponseScenario scenario = findScenario(endpointId, scenarioId);

        if (scenario.isActive()) {
            throw new ResponseScenarioConflictException(
                    "The active scenario cannot be deleted; activate another scenario first"
            );
        }
        if (scenarioRepository.countByEndpoint_Id(endpointId) <= 1) {
            throw new ResponseScenarioConflictException(
                    "An endpoint must have at least one response scenario"
            );
        }

        endpoint.removeScenario(scenario);
        endpointRepository.flush();
    }

    private MockEndpoint findEndpoint(UUID projectId, UUID endpointId) {
        return endpointRepository.findByIdAndProject_Id(endpointId, projectId)
                .orElseThrow(() -> new EndpointNotFoundException(endpointId, projectId));
    }

    private MockResponseScenario findScenario(UUID endpointId, UUID scenarioId) {
        return scenarioRepository.findByIdAndEndpoint_Id(scenarioId, endpointId)
                .orElseThrow(() -> new ResponseScenarioNotFoundException(scenarioId, endpointId));
    }

    private void ensureNameIsAvailable(UUID endpointId, String name, UUID currentScenarioId) {
        boolean exists = currentScenarioId == null
                ? scenarioRepository.existsByEndpoint_IdAndNameIgnoreCase(endpointId, name)
                : scenarioRepository.existsByEndpoint_IdAndNameIgnoreCaseAndIdNot(
                        endpointId, name, currentScenarioId
                );

        if (exists) {
            throw new ResponseScenarioConflictException(
                    "A scenario named '" + name + "' already exists for this endpoint"
            );
        }
    }

    private void applyConfiguration(
            MockResponseScenario scenario,
            int statusCode,
            String contentType,
            List<ResponseHeaderRequest> headers,
            String body,
            int delayMs
    ) {
        scenario.setStatusCode((short) statusCode);
        scenario.setContentType(contentType.trim());
        scenario.setHeaders(headers.stream().map(this::toHeader).toList());
        scenario.setBody(ResponseBodyPolicy.bodyForStorage(statusCode, body));
        scenario.setDelayMs(delayMs);
    }

    private ResponseHeader toHeader(ResponseHeaderRequest header) {
        return new ResponseHeader(header.name(), header.value(), header.enabled());
    }

    private ResponseScenarioResponse toResponse(MockResponseScenario scenario) {
        List<ResponseHeaderResponse> headers = scenario.getHeaders().stream()
                .map(header -> new ResponseHeaderResponse(
                        header.getName(), header.getValue(), header.isEnabled()
                ))
                .toList();

        return new ResponseScenarioResponse(
                scenario.getId(),
                scenario.getEndpoint().getId(),
                scenario.getName(),
                scenario.isActive(),
                scenario.getStatusCode(),
                scenario.getContentType(),
                headers,
                scenario.getBody(),
                scenario.getDelayMs(),
                scenario.getCreatedAt(),
                scenario.getUpdatedAt()
        );
    }

    private String normalizeName(String name) {
        return name.trim();
    }
}
