package com.mockrelay.api.response;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ResponseBodyPolicyTests {

    @ParameterizedTest
    @ValueSource(ints = {100, 150, 199, 204, 205, 304})
    void rejectsBodiesForBodylessStatuses(int statusCode) {
        assertThat(ResponseBodyPolicy.allowsBody(statusCode)).isFalse();
        assertThat(ResponseBodyPolicy.bodyForStorage(statusCode, "stale")).isEmpty();
        assertThat(ResponseBodyPolicy.bodyForServing(statusCode, "stale")).isNull();
    }

    @ParameterizedTest
    @ValueSource(ints = {200, 201, 206, 300, 400, 500})
    void permitsBodiesForNormalStatuses(int statusCode) {
        assertThat(ResponseBodyPolicy.allowsBody(statusCode)).isTrue();
        assertThat(ResponseBodyPolicy.bodyForStorage(statusCode, "body")).isEqualTo("body");
        assertThat(ResponseBodyPolicy.bodyForServing(statusCode, "body")).isEqualTo("body");
    }

    @ParameterizedTest
    @ValueSource(ints = {200, 400, 500})
    void treatsNullAndEmptyBodiesAsAbsentWhenServing(int statusCode) {
        assertThat(ResponseBodyPolicy.bodyForServing(statusCode, null)).isNull();
        assertThat(ResponseBodyPolicy.bodyForServing(statusCode, "")).isNull();
    }
}
