package com.mockrelay.api.template;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class StarterScenarioBodySerializerTests {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StarterScenarioBodySerializer serializer =
            new StarterScenarioBodySerializer(objectMapper);

    @Test
    void serializesStructuredJsonForScenarioStorage() {
        var body = objectMapper.readTree("""
                {
                  "id": "game_1001",
                  "title": "Signal Horizon"
                }
                """);

        String stored = serializer.toStoredBody(200, "application/json", body);

        assertThat(stored).contains("\n", "\"id\"", "\"Signal Horizon\"");
        assertThat(objectMapper.readTree(stored)).isEqualTo(body);
    }

    @Test
    void preservesPlainTextWithoutJsonQuoting() {
        var body = objectMapper.readTree("\"Service unavailable\"");

        assertThat(serializer.toStoredBody(503, "text/plain", body))
                .isEqualTo("Service unavailable");
    }

    @Test
    void clearsBodiesForBodylessStatuses() {
        var staleBody = objectMapper.readTree("{\"message\":\"stale\"}");

        assertThat(serializer.toStoredBody(204, "application/json", staleBody)).isEmpty();
    }
}
