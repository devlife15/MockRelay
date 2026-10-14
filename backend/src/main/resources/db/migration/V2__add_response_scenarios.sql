ALTER TABLE mock_responses RENAME TO mock_response_scenarios;

ALTER TABLE mock_response_scenarios
    ADD COLUMN name VARCHAR(80);

UPDATE mock_response_scenarios
SET name = 'Default';

ALTER TABLE mock_response_scenarios
    ALTER COLUMN name SET NOT NULL,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE mock_response_scenarios
    ALTER COLUMN is_active DROP DEFAULT,
    DROP CONSTRAINT uk_mock_responses_endpoint,
    ADD CONSTRAINT ck_mock_response_scenarios_name_not_blank
        CHECK (btrim(name) <> '');

CREATE UNIQUE INDEX uk_mock_response_scenarios_endpoint_name
    ON mock_response_scenarios (endpoint_id, lower(name));

CREATE UNIQUE INDEX uk_mock_response_scenarios_active_endpoint
    ON mock_response_scenarios (endpoint_id)
    WHERE is_active;
