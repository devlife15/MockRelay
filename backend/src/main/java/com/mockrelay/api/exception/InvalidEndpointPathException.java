package com.mockrelay.api.exception;

public class InvalidEndpointPathException extends RuntimeException {

    public InvalidEndpointPathException(String path) {
        super("Invalid endpoint path: " + path);
    }
}
