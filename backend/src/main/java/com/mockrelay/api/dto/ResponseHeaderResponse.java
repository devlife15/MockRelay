package com.mockrelay.api.dto;

public record ResponseHeaderResponse(
        String name,
        String value,
        boolean enabled
) {
}
