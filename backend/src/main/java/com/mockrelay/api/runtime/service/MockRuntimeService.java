package com.mockrelay.api.runtime.service;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.entity.MockEndpoint;
import com.mockrelay.api.entity.MockResponse;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.exception.MockRouteNotFoundException;
import com.mockrelay.api.repository.MockEndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MockRuntimeService {

    private final MockEndpointRepository endpointRepository;

    @Transactional(readOnly = true)
    public ResolvedMockResponse resolve(String projectKey, HttpMethod method, String requestPath) {
        MockEndpoint endpoint = endpointRepository.findRuntimeCandidates(projectKey, method)
                .stream()
                .filter(candidate -> EndpointRouteMatcher.matches(candidate.getPath(), requestPath))
                .sorted(Comparator
                        .comparingInt((MockEndpoint candidate) ->
                                EndpointRouteMatcher.specificity(candidate.getPath())
                        )
                        .reversed()
                        .thenComparing(MockEndpoint::getCreatedAt))
                .findFirst()
                .orElseThrow(() -> new MockRouteNotFoundException(projectKey, method, requestPath));

        MockResponse response = endpoint.getResponse();
        List<ResponseHeader> headers = response.getHeaders().stream()
                .map(header -> new ResponseHeader(
                        header.getName(), header.getValue(), header.isEnabled()
                ))
                .toList();

        return new ResolvedMockResponse(
                response.getStatusCode(),
                response.getContentType(),
                headers,
                response.getBody(),
                response.getDelayMs()
        );
    }
}
