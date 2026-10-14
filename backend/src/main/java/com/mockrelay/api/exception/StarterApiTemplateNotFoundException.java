package com.mockrelay.api.exception;

public class StarterApiTemplateNotFoundException extends RuntimeException {

    public StarterApiTemplateNotFoundException(String templateKey) {
        super("Starter API template not found: " + templateKey);
    }
}
