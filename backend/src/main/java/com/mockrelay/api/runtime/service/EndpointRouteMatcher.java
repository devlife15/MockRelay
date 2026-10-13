package com.mockrelay.api.runtime.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class EndpointRouteMatcher {

    private static final Pattern PATH_PARAMETER = Pattern.compile("\\{[A-Za-z][A-Za-z0-9_]*}");

    private EndpointRouteMatcher() {
    }

    static boolean matches(String configuredPath, String requestPath) {
        return compile(configuredPath).matcher(requestPath).matches();
    }

    static int specificity(String configuredPath) {
        return PATH_PARAMETER.matcher(configuredPath).replaceAll("").length();
    }

    private static Pattern compile(String configuredPath) {
        StringBuilder expression = new StringBuilder("^");
        Matcher matcher = PATH_PARAMETER.matcher(configuredPath);
        int literalStart = 0;

        while (matcher.find()) {
            expression.append(Pattern.quote(configuredPath.substring(literalStart, matcher.start())));
            expression.append("[^/]+");
            literalStart = matcher.end();
        }

        expression.append(Pattern.quote(configuredPath.substring(literalStart)));
        expression.append("$");
        return Pattern.compile(expression.toString());
    }
}
