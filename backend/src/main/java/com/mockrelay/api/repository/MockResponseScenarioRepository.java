package com.mockrelay.api.repository;

import com.mockrelay.api.entity.MockResponseScenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MockResponseScenarioRepository extends JpaRepository<MockResponseScenario, UUID> {

    List<MockResponseScenario> findAllByEndpoint_IdOrderByCreatedAtAsc(UUID endpointId);

    Optional<MockResponseScenario> findByIdAndEndpoint_Id(UUID scenarioId, UUID endpointId);

    Optional<MockResponseScenario> findByEndpoint_IdAndActiveTrue(UUID endpointId);

    boolean existsByEndpoint_IdAndNameIgnoreCase(UUID endpointId, String name);

    boolean existsByEndpoint_IdAndNameIgnoreCaseAndIdNot(
            UUID endpointId,
            String name,
            UUID scenarioId
    );

    long countByEndpoint_Id(UUID endpointId);
}
