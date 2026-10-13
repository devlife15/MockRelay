package com.mockrelay.api.validation;

import java.util.regex.Pattern;

public final class EndpointPathNormalizer {

    private static final Pattern PATH_PARAMETER = Pattern.compile("\\{[A-Za-z][A-Za-z0-9_]*}");
    private static final Pattern FORBIDDEN_CHARACTER = Pattern.compile("[\\s?#]");
    private static final Pattern REMAINING_BRACE = Pattern.compile("[{}]");

    private EndpointPathNormalizer() {
    }

    public static boolean isValid(String value) {
        if (value == null || value.isBlank() || !value.equals(value.trim())) {
            return false;
        }
        if (!value.startsWith("/") || FORBIDDEN_CHARACTER.matcher(value).find()) {
            return false;
        }

        String withoutParameters = PATH_PARAMETER.matcher(value).replaceAll("");
        return !REMAINING_BRACE.matcher(withoutParameters).find();
    }

    public static String normalize(String value) {
        return value.trim();
    }

    public static String toSignature(String normalizedPath) {
        return PATH_PARAMETER.matcher(normalizedPath).replaceAll("{}");
    }
}
