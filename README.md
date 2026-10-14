<p align="center">
  <img src="frontend/public/MockRelayIndigo.svg" width="78" alt="MockRelay logo" />
</p>

<h1 align="center">MockRelay</h1>

<p align="center">
  A developer-focused platform for creating configurable mock HTTP APIs, testing them quickly, and sharing stable mock URLs.
</p>

> [!NOTE]
> MockRelay is under active development. The React workspace is connected to the Spring Boot management APIs and dynamic mock runtime, completing the first end-to-end V1 workflow.

## Why MockRelay?

Frontend development and API integration often begin before a real backend is ready. MockRelay is designed to shorten that gap:

1. Create a project.
2. Define an HTTP method and path such as `GET /users/{id}`.
3. Configure the status, headers, body, content type, and delay.
4. Copy the generated mock URL.
5. Call it from an application or test it directly in the workspace.

The project is also a practical exploration of Spring Boot API design, relational modelling, dynamic route resolution, validation, exception handling, and a dense developer-tool interface.

## Current progress

### Implemented

- Responsive React project and endpoint workspace
- Light and dark themes
- Project and endpoint creation/editing flows in the frontend prototype
- CodeMirror JSON response editor with validation and formatting
- Configurable response status, content type, headers, body, and delay UI
- Collapsible, resizable endpoint test console
- Spring Boot project-management REST API
- Nested endpoint-management REST API
- Endpoint path validation, normalization, and route-conflict detection
- Configurable response persistence for status, content type, headers, body, and delay
- Dynamic mock runtime under `/mock/{projectKey}/...`
- HTTP method and parameterized-path matching with static-route precedence
- Runtime delivery of configured status, content type, enabled headers, body, and delay
- TanStack Query integration for server-owned project and endpoint state
- Typed frontend API client with Spring `ProblemDetail` error handling
- Real runtime requests from the endpoint test console
- Request validation and RFC-style `ProblemDetail` error responses
- Global exception handling with `@RestControllerAdvice`
- PostgreSQL schema managed by Flyway
- JPA entities, relationships, auditing, and repositories
- JSONB response-header persistence model
- Transactional service and API integration tests

### Next

- V1 architecture walkthrough and case-study documentation

### Later

- Authentication with Spring Security
- Stateful scenarios and conditional responses
- Templates and generated response data
- Request logs and webhook inspection
- OpenAPI import/export

See [V1.5 and beyond](mock-api-platform-v1.5-and-beyond.md) for the longer product roadmap.

## Technology stack

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI primitives
- CodeMirror 6
- Lucide icons

### Backend

- Java 25
- Spring Boot 4
- Spring MVC
- Spring Data JPA and Hibernate
- Bean Validation
- Flyway
- PostgreSQL 18
- Maven

### Infrastructure and testing

- Docker Compose
- JUnit 5
- Spring MockMvc
- AssertJ

## Architecture

```text
React SPA
   │
   │ Management REST API
   ▼
Spring Boot modular monolith
   │
   ├── Project and endpoint configuration
   ├── Validation and exception handling
   └── Dynamic mock runtime
   │
   │ JPA / Hibernate
   ▼
PostgreSQL
```

MockRelay deliberately separates two request flows:

```text
Management flow
React workspace → /api/... → validate → persist configuration

Runtime flow
Client request → /mock/{projectKey}/... → resolve endpoint → return configured response
```

## Repository structure

```text
mock-api-tool/
├── frontend/                    React and TypeScript workspace
├── backend/                     Spring Boot application
│   ├── compose.yaml             Local PostgreSQL service
│   └── src/main/
│       ├── java/com/mockrelay/api/
│       │   ├── audit/           JPA auditing configuration
│       │   ├── dto/             API request and response models
│       │   ├── entity/          JPA entities
│       │   ├── endpoint/        Endpoint controllers and services
│       │   ├── exception/       Exceptions and global handling
│       │   ├── project/         Project controllers and services
│       │   ├── repository/      Spring Data repositories
│       │   ├── runtime/         Dynamic mock request handling
│       │   └── validation/      Reusable endpoint path validation
│       └── resources/
│           └── db/migration/    Flyway migrations
├── DESIGN_SYSTEM.md
└── mock-api-platform-v1.5-and-beyond.md
```

The Java packages follow a domain-oriented structure: each domain keeps its controllers and services together, while shared DTOs, entities, exceptions, and repositories have dedicated top-level packages.

## Local development

### Prerequisites

- Java 25
- Node.js 22 or newer
- Docker Desktop with Docker Compose

### 1. Start PostgreSQL

From the repository root:

```powershell
cd backend
docker compose up -d
docker compose ps
```

The local database uses:

```text
Host:     localhost
Port:     15432
Database: mockrelay
Username: mockrelay
Password: mockrelay
```

Port `15432` is used because the standard PostgreSQL port is reserved on the original Windows development environment.

### 2. Start the backend

On Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

On macOS or Linux:

```bash
cd backend
./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`.

Database settings can be overridden without editing the committed configuration:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

### 3. Start the frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

The frontend currently uses prototype state and is not yet connected to the backend API.

## Available management API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/projects/{projectId}` | Retrieve a project |
| `PUT` | `/api/projects/{projectId}` | Update a project |
| `DELETE` | `/api/projects/{projectId}` | Delete a project |

Example request:

```http
POST /api/projects
Content-Type: application/json

{
  "name": "Storefront API",
  "description": "Mocks the storefront backend",
  "projectKey": "storefront-api"
}
```

Successful creation returns `201 Created` and a `Location` header pointing to the new project.

Validation and application errors use `application/problem+json` responses:

```json
{
  "type": "about:blank",
  "title": "Invalid request",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "errors": [
    {
      "field": "projectKey",
      "message": "Project key may contain lowercase letters, numbers, and single hyphens"
    }
  ]
}
```

## Running checks

Backend tests require the PostgreSQL container to be running:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

## Engineering decisions

- **Flyway owns the schema.** Hibernate uses `ddl-auto: validate` and cannot silently modify it.
- **UUID identifiers** keep persisted resources independent of database sequences.
- **JPA auditing** manages creation and modification timestamps in UTC.
- **Response headers use JSONB** to preserve ordering, duplicate header names, values, and enabled state.
- **Response bodies use text storage** so JSON, HTML, and plain text are all supported.
- **Parameterized paths have normalized signatures** in the data model so routes such as `/users/{id}` and `/users/{userId}` can be treated as conflicts.
- **Entities are not returned from controllers.** Explicit DTOs keep persistence concerns out of the public API.
- **Management and runtime routes remain separate** because they solve different problems and have different performance and security requirements.
- **Configured delays block a request thread in V1** to keep the learning implementation direct; a scheduler or reactive runtime can replace this if concurrency becomes a real requirement.

## Design direction

MockRelay uses a compact developer-tool visual system with near-black surfaces, a controlled indigo/violet accent, Space Grotesk for interface text, and Space Mono for machine-readable content. The complete token and component decisions are documented in the [design system](DESIGN_SYSTEM.md).

## Project status

This is a personal learning project being developed in public. The repository intentionally documents the progression from UI prototype through persistence, management APIs, and dynamic request resolution.
