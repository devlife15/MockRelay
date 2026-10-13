CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(160),
    project_key VARCHAR(48) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_projects_project_key UNIQUE (project_key),
    CONSTRAINT ck_projects_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT ck_projects_project_key_format CHECK (
        project_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
);

CREATE TABLE mock_endpoints (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    name VARCHAR(80),
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    path_signature VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mock_endpoints_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT uk_mock_endpoints_project_method_path
        UNIQUE (project_id, method, path_signature),
    CONSTRAINT ck_mock_endpoints_method CHECK (
        method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
    ),
    CONSTRAINT ck_mock_endpoints_path CHECK (
        path LIKE '/%'
        AND path !~ '[[:space:]?#]'
    ),
    CONSTRAINT ck_mock_endpoints_path_signature CHECK (
        path_signature LIKE '/%'
        AND path_signature !~ '[[:space:]?#]'
    )
);

CREATE TABLE mock_responses (
    id UUID PRIMARY KEY,
    endpoint_id UUID NOT NULL,
    status_code SMALLINT NOT NULL DEFAULT 200,
    content_type VARCHAR(100) NOT NULL DEFAULT 'application/json',
    headers JSONB NOT NULL DEFAULT '[]'::jsonb,
    body TEXT NOT NULL DEFAULT '',
    delay_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mock_responses_endpoint
        FOREIGN KEY (endpoint_id) REFERENCES mock_endpoints (id) ON DELETE CASCADE,
    CONSTRAINT uk_mock_responses_endpoint UNIQUE (endpoint_id),
    CONSTRAINT ck_mock_responses_status_code CHECK (
        status_code BETWEEN 100 AND 599
    ),
    CONSTRAINT ck_mock_responses_content_type_not_blank CHECK (
        btrim(content_type) <> ''
    ),
    CONSTRAINT ck_mock_responses_headers_array CHECK (
        jsonb_typeof(headers) = 'array'
    ),
    CONSTRAINT ck_mock_responses_delay CHECK (
        delay_ms BETWEEN 0 AND 30000
    )
);
