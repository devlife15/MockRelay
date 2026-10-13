package com.mockrelay.api.exception;

import com.mockrelay.api.entity.HttpMethod;

public class MockRouteNotFoundException extends RuntimeException {

    public MockRouteNotFoundException(String projectKey, HttpMethod method, String path) {
        super("No mock endpoint matches " + method + " " + path + " in project " + projectKey);
    }
}
