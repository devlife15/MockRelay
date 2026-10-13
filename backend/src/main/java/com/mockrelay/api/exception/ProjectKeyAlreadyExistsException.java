package com.mockrelay.api.exception;

public class ProjectKeyAlreadyExistsException extends RuntimeException {

    public ProjectKeyAlreadyExistsException(String projectKey) {
        super("Project key is already in use: " + projectKey);
    }
}
