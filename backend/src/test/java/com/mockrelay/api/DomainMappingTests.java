package com.mockrelay.api;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.entity.MockEndpoint;
import com.mockrelay.api.entity.MockResponseScenario;
import com.mockrelay.api.entity.Project;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.repository.MockEndpointRepository;
import com.mockrelay.api.repository.MockResponseScenarioRepository;
import com.mockrelay.api.repository.ProjectRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class DomainMappingTests {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private MockEndpointRepository endpointRepository;

    @Autowired
    private MockResponseScenarioRepository scenarioRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void persistsAndLoadsTheCompleteProjectGraph() {
        Project project = new Project();
        project.setName("Mapping test");
        project.setDescription("Verifies the initial JPA model");
        project.setProjectKey("mapping-test");

        MockEndpoint endpoint = new MockEndpoint();
        endpoint.setName("Get user");
        endpoint.setMethod(HttpMethod.GET);
        endpoint.setPath("/users/{id}");
        endpoint.setPathSignature("/users/{}");

        MockResponseScenario defaultScenario = new MockResponseScenario();
        defaultScenario.setName("Default");
        defaultScenario.setActive(true);
        defaultScenario.setStatusCode((short) 200);
        defaultScenario.setBody("{\"message\":\"ok\"}");
        defaultScenario.setHeaders(List.of(
                new ResponseHeader("X-Mock-Source", "MockRelay", true)
        ));

        MockResponseScenario notFoundScenario = new MockResponseScenario();
        notFoundScenario.setName("Not Found");
        notFoundScenario.setActive(false);
        notFoundScenario.setStatusCode((short) 404);
        notFoundScenario.setBody("{\"message\":\"Not found\"}");

        endpoint.addScenario(defaultScenario);
        endpoint.addScenario(notFoundScenario);
        project.addEndpoint(endpoint);
        projectRepository.saveAndFlush(project);

        entityManager.clear();

        Project savedProject = projectRepository.findByProjectKey("mapping-test").orElseThrow();
        MockEndpoint savedEndpoint = savedProject.getEndpoints().getFirst();

        assertThat(savedProject.getId()).isNotNull();
        assertThat(savedEndpoint.getMethod()).isEqualTo(HttpMethod.GET);
        assertThat(savedEndpoint.getScenarios()).hasSize(2);
        assertThat(savedEndpoint.getActiveScenario().getName()).isEqualTo("Default");
        assertThat(savedEndpoint.getActiveScenario().getStatusCode()).isEqualTo((short) 200);
        assertThat(savedEndpoint.getActiveScenario().getHeaders())
                .singleElement()
                .satisfies(header -> {
                    assertThat(header.getName()).isEqualTo("X-Mock-Source");
                    assertThat(header.getValue()).isEqualTo("MockRelay");
                    assertThat(header.isEnabled()).isTrue();
                });

        var endpointId = savedEndpoint.getId();
        var scenarioIds = savedEndpoint.getScenarios().stream()
                .map(MockResponseScenario::getId)
                .toList();
        projectRepository.delete(savedProject);
        projectRepository.flush();

        assertThat(endpointRepository.existsById(endpointId)).isFalse();
        assertThat(scenarioRepository.findAllById(scenarioIds)).isEmpty();
    }
}
