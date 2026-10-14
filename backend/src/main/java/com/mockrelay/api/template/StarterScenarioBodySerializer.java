package com.mockrelay.api.template;

import com.mockrelay.api.response.ResponseBodyPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class StarterScenarioBodySerializer {

    private final ObjectMapper objectMapper;

    public String toStoredBody(int statusCode, String contentType, JsonNode body) {
        if (!ResponseBodyPolicy.allowsBody(statusCode)) {
            return "";
        }

        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("json")) {
            try {
                return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(body);
            } catch (Exception exception) {
                throw new IllegalArgumentException("Unable to serialize template JSON body", exception);
            }
        }

        if (body == null || !body.isString()) {
            throw new IllegalArgumentException("Non-JSON template bodies must be strings");
        }
        return body.stringValue();
    }
}
