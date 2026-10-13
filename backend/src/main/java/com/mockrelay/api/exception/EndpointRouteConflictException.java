package com.mockrelay.api.exception;

import com.mockrelay.api.entity.HttpMethod;

public class EndpointRouteConflictException extends RuntimeException {

    public EndpointRouteConflictException(HttpMethod method, String path) {
        super("An endpoint already uses " + method + " " + path);
    }
}
