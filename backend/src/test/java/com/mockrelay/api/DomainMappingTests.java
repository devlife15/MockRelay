package com.mockrelay.api;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.entity.MockEndpoint;
import com.mockrelay.api.entity.MockResponse;
import com.mockrelay.api.entity.Project;
import com.mockrelay.api.entity.ResponseHeader;
import com.mockrelay.api.repository.MockEndpointRepository;
import com.mockrelay.api.repository.MockResponseRepository;
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
    private MockResponseRepository responseRepository;

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

        MockResponse response = new MockResponse();
        response.setStatusCode((short) 200);
        response.setBody("{\"message\":\"ok\"}");
        response.setHeaders(List.of(
                new ResponseHeader("X-Mock-Source", "MockRelay", true)
        ));

        endpoint.setResponse(response);
        project.addEndpoint(endpoint);
        projectRepository.saveAndFlush(project);

        entityManager.clear();

        Project savedProject = projectRepository.findByProjectKey("mapping-test").orElseThrow();
        MockEndpoint savedEndpoint = savedProject.getEndpoints().getFirst();

        assertThat(savedProject.getId()).isNotNull();
        assertThat(savedEndpoint.getMethod()).isEqualTo(HttpMethod.GET);
        assertThat(savedEndpoint.getResponse().getStatusCode()).isEqualTo((short) 200);
        assertThat(savedEndpoint.getResponse().getHeaders())
                .singleElement()
                .satisfies(header -> {
                    assertThat(header.getName()).isEqualTo("X-Mock-Source");
                    assertThat(header.getValue()).isEqualTo("MockRelay");
                    assertThat(header.isEnabled()).isTrue();
                });

        var endpointId = savedEndpoint.getId();
        var responseId = savedEndpoint.getResponse().getId();
        projectRepository.delete(savedProject);
        projectRepository.flush();

        assertThat(endpointRepository.existsById(endpointId)).isFalse();
        assertThat(responseRepository.existsById(responseId)).isFalse();
    }
}
