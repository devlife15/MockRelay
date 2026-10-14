package com.mockrelay.api.template;

import com.mockrelay.api.template.model.StarterApiTemplateDefinition;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StarterApiTemplateCatalog {

    static final String TEMPLATE_RESOURCE_PATTERN = "classpath*:templates/v1/*.json";

    private final ResourcePatternResolver resourceResolver;
    private final ObjectMapper objectMapper;
    private final StarterApiTemplateValidator templateValidator;

    private Map<String, StarterApiTemplateDefinition> templatesByKey = Map.of();

    @PostConstruct
    void load() {
        try {
            Resource[] resources = resourceResolver.getResources(TEMPLATE_RESOURCE_PATTERN);
            templatesByKey = loadDefinitions(resources);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to load the starter API template catalogue", exception);
        }
    }

    public List<StarterApiTemplateDefinition> findAll() {
        return List.copyOf(templatesByKey.values());
    }

    public Optional<StarterApiTemplateDefinition> findByKey(String key) {
        if (key == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(templatesByKey.get(key));
    }

    Map<String, StarterApiTemplateDefinition> loadDefinitions(Resource[] resources) {
        if (resources.length == 0) {
            throw new IllegalStateException(
                    "No starter API templates matched " + TEMPLATE_RESOURCE_PATTERN
            );
        }

        Map<String, StarterApiTemplateDefinition> loaded = new LinkedHashMap<>();
        Arrays.stream(resources)
                .sorted(Comparator.comparing(this::resourceName))
                .forEach(resource -> loadDefinition(resource, loaded));
        return Collections.unmodifiableMap(new LinkedHashMap<>(loaded));
    }

    private void loadDefinition(
            Resource resource,
            Map<String, StarterApiTemplateDefinition> loaded
    ) {
        StarterApiTemplateDefinition template;
        try (var input = resource.getInputStream()) {
            template = objectMapper.readValue(input, StarterApiTemplateDefinition.class);
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to read starter API template " + resource.getDescription(),
                    exception
            );
        }

        templateValidator.validate(template);
        StarterApiTemplateDefinition existing = loaded.putIfAbsent(template.key(), template);
        if (existing != null) {
            throw new IllegalStateException(
                    "Duplicate starter API template key '" + template.key() + "' in "
                            + resource.getDescription()
            );
        }
    }

    private String resourceName(Resource resource) {
        String filename = resource.getFilename();
        return filename == null ? resource.getDescription() : filename;
    }
}
