package com.mockrelay.api.repository;

import com.mockrelay.api.entity.MockResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MockResponseRepository extends JpaRepository<MockResponse, UUID> {

    Optional<MockResponse> findByEndpoint_Id(UUID endpointId);
}
