package com.mockrelay.api.response;

public final class ResponseBodyPolicy {

    private ResponseBodyPolicy() {
    }

    public static boolean allowsBody(int statusCode) {
        return !(
                statusCode >= 100 && statusCode < 200
                        || statusCode == 204
                        || statusCode == 205
                        || statusCode == 304
        );
    }

    public static String bodyForStorage(int statusCode, String body) {
        if (!allowsBody(statusCode) || body == null) {
            return "";
        }
        return body;
    }

    public static String bodyForServing(int statusCode, String body) {
        if (!allowsBody(statusCode) || body == null || body.isEmpty()) {
            return null;
        }
        return body;
    }
}
