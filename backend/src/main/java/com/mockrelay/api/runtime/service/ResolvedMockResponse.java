package com.mockrelay.api.runtime.service;

import com.mockrelay.api.entity.ResponseHeader;

import java.util.List;

public record ResolvedMockResponse(
        int statusCode,
        String contentType,
        List<ResponseHeader> headers,
        String body,
        int delayMs
) {
}
