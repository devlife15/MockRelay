package com.mockrelay.api.exception;

public record ValidationError(
        String field,
        String message
) {
}
