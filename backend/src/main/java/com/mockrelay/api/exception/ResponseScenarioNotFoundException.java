package com.mockrelay.api.exception;

import java.util.UUID;

public class ResponseScenarioNotFoundException extends RuntimeException {

    public ResponseScenarioNotFoundException(UUID scenarioId, UUID endpointId) {
        super("Response scenario " + scenarioId + " was not found for endpoint " + endpointId);
    }
}
