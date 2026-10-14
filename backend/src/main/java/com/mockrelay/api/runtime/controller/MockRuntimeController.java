package com.mockrelay.api.runtime.controller;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.runtime.service.MockRuntimeService;
import com.mockrelay.api.runtime.service.ResolvedMockResponse;
import com.mockrelay.api.response.ResponseBodyPolicy;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class MockRuntimeController {

    private static final Set<String> RESTRICTED_RESPONSE_HEADERS = Set.of(
            "content-length",
            "content-type",
            "transfer-encoding"
    );

    private final MockRuntimeService runtimeService;

    @RequestMapping(
            path = {"/mock/{projectKey}", "/mock/{projectKey}/**"},
            method = {
                    RequestMethod.GET,
                    RequestMethod.POST,
                    RequestMethod.PUT,
                    RequestMethod.PATCH,
                    RequestMethod.DELETE
            }
    )
    public ResponseEntity<String> handleMockRequest(
            @PathVariable String projectKey,
            HttpServletRequest request
    ) throws InterruptedException {
        HttpMethod method = HttpMethod.valueOf(request.getMethod());
        String requestPath = extractEndpointPath(projectKey, request);
        ResolvedMockResponse mockResponse = runtimeService.resolve(projectKey, method, requestPath);

        if (mockResponse.delayMs() > 0) {
            Thread.sleep(mockResponse.delayMs());
        }

        HttpHeaders headers = new HttpHeaders();
        boolean bodyAllowed = ResponseBodyPolicy.allowsBody(mockResponse.statusCode());
        if (bodyAllowed) {
            headers.setContentType(MediaType.parseMediaType(mockResponse.contentType()));
        }
        mockResponse.headers().stream()
                .filter(ResponseHeader::isEnabled)
                .filter(header -> !RESTRICTED_RESPONSE_HEADERS.contains(
                        header.getName().toLowerCase(Locale.ROOT)
                ))
                .forEach(header -> headers.add(header.getName(), header.getValue()));

        String body = ResponseBodyPolicy.bodyForServing(
                mockResponse.statusCode(),
                mockResponse.body()
        );

        return ResponseEntity
                .status(HttpStatusCode.valueOf(mockResponse.statusCode()))
                .headers(headers)
                .body(body);
    }

    private String extractEndpointPath(String projectKey, HttpServletRequest request) {
        String runtimePrefix = request.getContextPath() + "/mock/" + projectKey;
        String requestUri = request.getRequestURI();
        String path = requestUri.substring(runtimePrefix.length());
        return path.isEmpty() ? "/" : path;
    }
}
