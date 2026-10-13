package com.mockrelay.api.exception;

import java.util.UUID;

public class EndpointNotFoundException extends RuntimeException {

    public EndpointNotFoundException(UUID endpointId, UUID projectId) {
        super("Endpoint " + endpointId + " was not found in project " + projectId);
    }
}
