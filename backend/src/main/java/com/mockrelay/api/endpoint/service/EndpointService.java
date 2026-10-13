package com.mockrelay.api.endpoint.service;

import com.mockrelay.api.dto.CreateEndpointRequest;
import com.mockrelay.api.dto.EndpointResponse;
import com.mockrelay.api.dto.ResponseHeaderRequest;
import com.mockrelay.api.dto.ResponseHeaderResponse;
import com.mockrelay.api.dto.UpdateEndpointRequest;
import com.mockrelay.api.entity.MockEndpoint;
import com.mockrelay.api.entity.MockResponse;
import com.mockrelay.api.entity.Project;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.exception.EndpointNotFoundException;
import com.mockrelay.api.exception.EndpointRouteConflictException;
import com.mockrelay.api.exception.InvalidEndpointPathException;
import com.mockrelay.api.exception.ProjectNotFoundException;
import com.mockrelay.api.repository.MockEndpointRepository;
import com.mockrelay.api.repository.ProjectRepository;
import com.mockrelay.api.validation.EndpointPathNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EndpointService {

    private static final String DEFAULT_RESPONSE_BODY = "{\n  \"message\": \"Mock response\"\n}";

    private final MockEndpointRepository endpointRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public EndpointResponse createEndpoint(UUID projectId, CreateEndpointRequest request) {
        Project project = findProject(projectId);
        String path = normalizeAndValidatePath(request.path());
        String pathSignature = EndpointPathNormalizer.toSignature(path);

        ensureRouteIsAvailable(projectId, request.method(), pathSignature, null);

        MockEndpoint endpoint = new MockEndpoint();
        endpoint.setName(trimToNull(request.name()));
        endpoint.setMethod(request.method());
        endpoint.setPath(path);
        endpoint.setPathSignature(pathSignature);

        MockResponse response = new MockResponse();
        response.setStatusCode((short) 200);
        response.setContentType("application/json");
        response.setHeaders(List.of());
        response.setBody(DEFAULT_RESPONSE_BODY);
        response.setDelayMs(0);

        endpoint.setResponse(response);
        project.addEndpoint(endpoint);

        return toResponse(endpointRepository.saveAndFlush(endpoint));
    }

    @Transactional(readOnly = true)
    public List<EndpointResponse> getEndpoints(UUID projectId) {
        findProject(projectId);
        return endpointRepository.findAllByProject_IdOrderByCreatedAtAsc(projectId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EndpointResponse getEndpoint(UUID projectId, UUID endpointId) {
        return toResponse(findEndpoint(projectId, endpointId));
    }

    @Transactional
    public EndpointResponse updateEndpoint(
            UUID projectId,
            UUID endpointId,
            UpdateEndpointRequest request
    ) {
        MockEndpoint endpoint = findEndpoint(projectId, endpointId);
        String path = normalizeAndValidatePath(request.path());
        String pathSignature = EndpointPathNormalizer.toSignature(path);

        ensureRouteIsAvailable(projectId, request.method(), pathSignature, endpointId);

        endpoint.setName(trimToNull(request.name()));
        endpoint.setMethod(request.method());
        endpoint.setPath(path);
        endpoint.setPathSignature(pathSignature);

        MockResponse response = endpoint.getResponse();
        if (response == null) {
            response = new MockResponse();
            endpoint.setResponse(response);
        }

        response.setStatusCode((short) request.statusCode());
        response.setContentType(request.contentType().trim());
        response.setHeaders(request.headers().stream().map(this::toHeader).toList());
        response.setBody(request.body());
        response.setDelayMs(request.delayMs());

        return toResponse(endpointRepository.saveAndFlush(endpoint));
    }

    @Transactional
    public void deleteEndpoint(UUID projectId, UUID endpointId) {
        MockEndpoint endpoint = findEndpoint(projectId, endpointId);
        endpoint.getProject().removeEndpoint(endpoint);
        projectRepository.flush();
    }

    private Project findProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    private MockEndpoint findEndpoint(UUID projectId, UUID endpointId) {
        return endpointRepository.findByIdAndProject_Id(endpointId, projectId)
                .orElseThrow(() -> new EndpointNotFoundException(endpointId, projectId));
    }

    private void ensureRouteIsAvailable(
            UUID projectId,
            com.mockrelay.api.entity.HttpMethod method,
            String pathSignature,
            UUID currentEndpointId
    ) {
        boolean routeExists = currentEndpointId == null
                ? endpointRepository.existsByProject_IdAndMethodAndPathSignature(
                        projectId, method, pathSignature
                )
                : endpointRepository.existsByProject_IdAndMethodAndPathSignatureAndIdNot(
                        projectId, method, pathSignature, currentEndpointId
                );

        if (routeExists) {
            throw new EndpointRouteConflictException(method, pathSignature);
        }
    }

    private String normalizeAndValidatePath(String path) {
        if (!EndpointPathNormalizer.isValid(path)) {
            throw new InvalidEndpointPathException(path);
        }
        return EndpointPathNormalizer.normalize(path);
    }

    private ResponseHeader toHeader(ResponseHeaderRequest header) {
        return new ResponseHeader(header.name(), header.value(), header.enabled());
    }

    private EndpointResponse toResponse(MockEndpoint endpoint) {
        MockResponse response = endpoint.getResponse();
        List<ResponseHeaderResponse> headers = response.getHeaders().stream()
                .map(header -> new ResponseHeaderResponse(
                        header.getName(), header.getValue(), header.isEnabled()
                ))
                .toList();

        return new EndpointResponse(
                endpoint.getId(),
                endpoint.getProject().getId(),
                endpoint.getName(),
                endpoint.getMethod(),
                endpoint.getPath(),
                response.getStatusCode(),
                response.getContentType(),
                headers,
                response.getBody(),
                response.getDelayMs(),
                endpoint.getCreatedAt(),
                endpoint.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
