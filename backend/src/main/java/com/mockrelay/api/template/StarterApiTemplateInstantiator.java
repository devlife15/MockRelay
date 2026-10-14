package com.mockrelay.api.template;

import com.mockrelay.api.entity.MockEndpoint;
import com.mockrelay.api.entity.MockResponseScenario;
import com.mockrelay.api.entity.Project;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.exception.StarterApiTemplateNotFoundException;
import com.mockrelay.api.template.model.StarterEndpointDefinition;
import com.mockrelay.api.template.model.StarterScenarioDefinition;
import com.mockrelay.api.validation.EndpointPathNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StarterApiTemplateInstantiator {

    private final StarterApiTemplateCatalog templateCatalog;
    private final StarterScenarioBodySerializer bodySerializer;

    public void instantiateInto(Project project, String templateKey) {
        templateCatalog.findByKey(templateKey)
                .orElseThrow(() -> new StarterApiTemplateNotFoundException(templateKey))
                .endpoints().stream()
                .map(this::toEndpoint)
                .forEach(project::addEndpoint);
    }

    private MockEndpoint toEndpoint(StarterEndpointDefinition definition) {
        String path = EndpointPathNormalizer.normalize(definition.path());
        MockEndpoint endpoint = new MockEndpoint();
        endpoint.setName(definition.name().trim());
        endpoint.setMethod(definition.method());
        endpoint.setPath(path);
        endpoint.setPathSignature(EndpointPathNormalizer.toSignature(path));
        definition.scenarios().stream()
                .map(this::toScenario)
                .forEach(endpoint::addScenario);
        return endpoint;
    }

    private MockResponseScenario toScenario(StarterScenarioDefinition definition) {
        MockResponseScenario scenario = new MockResponseScenario();
        scenario.setName(definition.name().trim());
        scenario.setActive(definition.active());
        scenario.setStatusCode((short) definition.statusCode());
        scenario.setContentType(definition.contentType().trim());
        scenario.setHeaders(definition.headers().stream()
                .map(header -> new ResponseHeader(
                        header.name(),
                        header.value(),
                        header.enabled()
                ))
                .toList());
        scenario.setBody(bodySerializer.toStoredBody(
                definition.statusCode(),
                definition.contentType(),
                definition.body()
        ));
        scenario.setDelayMs(definition.delayMs());
        return scenario;
    }
}
