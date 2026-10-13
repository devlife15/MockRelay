package com.mockrelay.api.repository;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.entity.MockEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MockEndpointRepository extends JpaRepository<MockEndpoint, UUID> {

    List<MockEndpoint> findAllByProject_IdOrderByCreatedAtAsc(UUID projectId);

    boolean existsByProject_IdAndMethodAndPathSignature(
            UUID projectId,
            HttpMethod method,
            String pathSignature
    );

    boolean existsByProject_IdAndMethodAndPathSignatureAndIdNot(
            UUID projectId,
            HttpMethod method,
            String pathSignature,
            UUID endpointId
    );

    Optional<MockEndpoint> findByIdAndProject_Id(UUID endpointId, UUID projectId);
}
