package com.mockrelay.api.repository;

import com.mockrelay.api.entity.HttpMethod;
import com.mockrelay.api.entity.MockEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MockEndpointRepository extends JpaRepository<MockEndpoint, UUID> {

    List<MockEndpoint> findAllByProject_IdOrderByCreatedAtAsc(UUID projectId);

    boolean existsByProject_IdAndMethodAndPathSignature(
            UUID projectId,
            HttpMethod method,
            String pathSignature
    );
}
