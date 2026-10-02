# WAYNAH — PHASE 4 SYSTEM ARCHITECTURE MASTER STUDY (V1.0)

> **PROJECT:** WAYNAH (وينه؟ — Geographic Discovery & Local Trust Platform)
> **BRAND UMBRELLA:** M.GH.AL
> **DOCUMENT ID:** WAYNAH_PHASE_4_SYSTEM_ARCHITECTURE_STUDY_V1_0
> **REFERENCE DATE:** 1 October 2026
> **PHASE STATUS:** PHASE 4 — READY FOR INDEPENDENT ARCHITECTURE REVIEW
> **PREVIOUS PHASES:** PHASE 1 — CLOSED | PHASE 2 — CLOSED | PHASE 3 — CLOSED
> **BOUNDARIES:** ZERO Source Code Changes | ZERO Schema/Database Changes | ZERO Migration Creation | ZERO Dependency Changes | ZERO API/Auth/UI Changes
> **TAXONOMY NOTATION:** `[ARCHITECTURE FACT]` | `[ARCHITECTURE DECISION]` | `[ARCHITECTURE HYPOTHESIS]` | `[UNKNOWN / VALIDATION REQUIRED]` | `[IMPLEMENTATION DETAIL — PHASE 6]` | `[ARCHITECTURE ILLUSTRATION]`
> **DOCUMENT REVISION:** V1.0-R1 — One-Pass Architecture Review & Remediation (1 October 2026)

---

## 1. EXECUTIVE SUMMARY

This document is the **Phase 4 System Architecture Master Study** for the WAYNAH platform. It translates the locked Domain Model from Phase 3 (V1.2) into a technically grounded, structurally sound architecture study — without implementing anything and without reopening Phase 3.

The study was produced by:
1. Reading the complete Phase 3 Domain Model (V1.2) as authoritative input.
2. Physically inspecting the current WAYNAH codebase, including all packages, apps, Prisma schema, routes, domain services, middleware, and deployment configuration.
3. Applying the Phase 4 Architecture Taxonomy to classify every material architectural assertion.

**Key Findings:**
- WAYNAH already has a working pnpm monorepo with Turborepo orchestration, two application units (`apps/api`, `apps/web`), and six shared packages.
- The stack is **Hono (Node.js)** for the API, **Next.js 16** for the web frontend, **PostgreSQL 16 + PostGIS 3.4** for the database, and **Prisma 6** as the ORM.
- Existing search uses **PostgreSQL `pg_trgm`** trigram similarity plus **PostGIS `ST_DWithin`** — a pragmatic and correct fit for the current stage.
- Authentication is session-token based; RBAC uses permission strings (`domain.action`) implemented in a shared `@waynah/shared` package.
- The architecture is already modular within a single deployment unit — this is a **Modular Monolith**, and this study concludes that it is the **correct and recommended architecture direction** for the current project stage.
- The Prisma schema partially overlaps with but does NOT yet fully implement the Phase 3 Domain Model. Several Phase 3 entities (Branch, Provider, Service Offering, Claim, Evidence, Verification Record, Entity Alias, Duplicate Candidate, Review, User Contribution) are absent from the schema. This is an expected gap — Phase 4 is the architectural bridge.

**Recommended Architecture Direction:** Modular Monolith with domain-oriented module boundaries, a shared PostgreSQL/PostGIS database with module-level logical data ownership, and incremental feature extension driven strictly by Domain Model priorities.

---

## 2. PHASE 4 SCOPE

### 2.1 What Phase 4 Covers

Phase 4 is a **system architecture study only**. It:
- Maps the Phase 3 Domain Model to a technical architecture.
- Defines layer responsibilities and dependency directions.
- Maps the 7 Candidate Bounded Contexts to architectural modules.
- Studies the existing stack and its fitness for domain requirements.
- Documents architectural decisions and hypotheses.
- Identifies deferred decisions and open risks.

### 2.2 What Phase 4 Does NOT Do

Phase 4 does NOT:
- Implement source code changes.
- Create or modify database migrations.
- Modify the Prisma schema.
- Define API routes, controllers, or UI components.
- Configure production infrastructure.
- Begin Phase 5 (UX/UI Design System).
- Reopen Phase 3 Domain Model decisions.

### 2.3 Phase Sequence Reference

```text
Phase 1: Security & Codebase Safety Gate ──► [CLOSED]
  └── Phase 2: Domain / Real-World Logic Validation (V1.1) ──► [CLOSED]
       └── Phase 3: Domain Model Master Study (V1.2) ──► [CLOSED]
            └── Phase 4: System Architecture (CURRENT) ──► [THIS DOCUMENT]
                 └── Phase 5: UX/UI Design System ──► [NOT STARTED]
                      └── Phase 6+: Engineering, Implementation & Validation ──► [FUTURE]
```

---

## 3. INPUTS & CONSTRAINTS

### 3.1 Authoritative Inputs

| Input | Source | Status |
|---|---|---|
| Domain Model V1.2 | `docs/WAYNAH_PHASE_3_DOMAIN_MODEL_STUDY_V1_2.md` | `[ARCHITECTURE FACT]` — Read in full |
| Existing codebase | `f:\waynah\` — physically inspected | `[ARCHITECTURE FACT]` |
| Phase 1 findings | Security & Safety Gate | `[ARCHITECTURE FACT]` — CLOSED |
| Phase 2 findings | Domain/Real-World Logic Validation V1.1 | `[ARCHITECTURE FACT]` — CLOSED |

### 3.2 Non-Negotiable Phase 3 Constraints

The following are locked `[CONSTRAINT]`s inherited from Phase 3 that architecture must respect:

1. `Place ≠ Business` — must remain architecturally distinct entities.
2. `Business ≠ Branch` — Branch is an independent operational unit; must not be collapsed into Business.
3. `Provider ≠ Business` — Independent providers must be architecturally representable.
4. `Service Offering ≠ Product` — intangible capability, not inventory item.
5. `Claim ≠ Truth` — multi-source, time-scoped attribute assertions, not boolean flags.
6. `Verification ≠ Permanent Truth` — verification is scoped, temporal, and attribute-specific.
7. `Review ≠ Factual Claim` — subjective sentiment strictly decoupled from factual data.
8. `Phone Number ≠ Immutable Identity` — phone is a mutable contact attribute.
9. `Address Description ≠ Single Text Field` — layered addressing model (coordinates + administrative + descriptive anchors).
10. `Immutable History` — historical domain lineage must not be silently overwritten.
11. `Reversible Merge/Split` — duplicate entity resolution must be domain-reversible.
12. `Scoped Verification` — verification records are attribute-scoped and time-bounded.

### 3.3 Existing Stack — Observed Facts

The following are `[ARCHITECTURE FACT]`s derived from the current codebase state. They are established technical realities that architecture decisions must account for:

- **pnpm monorepo + Turborepo** is the build system — cannot be changed without full restructure.
- **PostgreSQL 16 + PostGIS 3.4** is already running via Docker — the database engine is established.
- **Prisma 6** is the ORM — already integrated into the database package and consumed by the API.
- **Hono 4** is the API framework — already fully wired with routes, middleware, and auth.
- **Next.js 16 / React 19** is the web frontend — the framework is selected.
- **Session-token authentication** (cryptographically random token, stored in `sessions` table) is the current authentication mechanism — Phase 1 closed this design; specific TTL and rotation policy remain `[UNKNOWN / VALIDATION REQUIRED]` (see DD-19).
- **Permission string RBAC** (`domain.action` pattern, enforced in `authorization.middleware.ts`) is the authorization model — Phase 1 closed this.
- **TypeScript 5.8** is the language — not negotiable.
- **No external message queue** currently exists in the codebase.
- **No dedicated search engine** (e.g., Elasticsearch, Meilisearch) is installed.
- **No caching layer** (e.g., Redis) is installed.
- **No object storage** is configured.
- **Deployment topology** is currently Docker-local for development; production target is not yet determined — `[UNKNOWN / VALIDATION REQUIRED]` (see DD-06).

---

## 4. EXISTING ARCHITECTURE ASSESSMENT

### 4.1 Monorepo Structure `[ARCHITECTURE FACT]`

```text
waynah-monorepo/                         ← pnpm workspace root (Turborepo)
├── apps/
│   ├── api/                             ← @waynah/api   — Hono Node.js API server
│   └── web/                             ← @waynah/web   — Next.js 16 web client
├── packages/
│   ├── config/                          ← @waynah/config — Shared TS/lint/build config
│   ├── database/                        ← @waynah/database — Prisma client + PostGIS utilities
│   ├── maps/                            ← @waynah/maps — Geographic utilities (stub)
│   ├── search/                          ← @waynah/search — Search utilities (stub)
│   ├── shared/                          ← @waynah/shared — Types, schemas, auth contracts, permissions
│   └── ui/                              ← @waynah/ui — Shared React components
├── docker/
│   └── docker-compose.yml               ← PostgreSQL 16 + PostGIS 3.4 development database
├── tests/
│   ├── integration/                     ← Integration test suite (currently stub)
│   ├── e2e/                             ← End-to-end test suite (currently stub)
│   └── fixtures/                        ← Test fixture data
└── docs/                                ← All project documentation
```

**Assessment `[ARCHITECTURE FACT]`:** The monorepo structure is sound and well-organized. The separation of `apps/` from `packages/` is architecturally correct. The `@waynah/shared` package correctly centralizes domain contracts. The `@waynah/database` package correctly encapsulates Prisma access.

### 4.2 API Architecture — Actual State `[ARCHITECTURE FACT]`

The `apps/api` application is a Hono-based Node.js HTTP server with the following observed structure:

```text
apps/api/src/
├── server.ts                 ← Application factory + startup
├── config/
│   └── security.config.ts    ← CORS origins, API key config
├── middleware/
│   ├── auth.middleware.ts     ← Session/API-key authentication → Actor identity
│   ├── authorization.middleware.ts ← Permission/Role/ActorType guards
│   ├── logging.middleware.ts  ← Request logging
│   ├── rate-limit.middleware.ts ← In-memory rate limiting (public + protected tiers)
│   └── security-headers.middleware.ts ← HTTP security headers
├── routes/v1/
│   ├── auth.routes.ts         ← /v1/auth — Register, Login, Logout, Me
│   ├── user.routes.ts         ← /v1/user — Favorites, Service Requests
│   ├── business.routes.ts     ← /v1/businesses — CRUD, Verification submit/read
│   ├── search.routes.ts       ← /v1/search — Place search, Categories, Place by ID
│   ├── discovery.routes.ts    ← /v1/discovery — Ingestion endpoint (protected)
│   ├── admin.routes.ts        ← /v1/admin — Conflicts, Verification review queue
│   └── geography.routes.ts    ← /v1/geography — Governorates, Districts (public read)
├── domain/
│   ├── admin/                 ← AdminService, AdminVerificationService
│   ├── business/              ← BusinessService, BusinessVerificationService
│   ├── discovery/             ← DiscoveryOrchestratorService, IngestionService,
│   │                             EntityResolutionService, ChangeDetectionService
│   ├── geography/             ← GeographyService, GeographyImportService,
│   │                             GeographySpatialResolutionService, 8 files total
│   ├── intelligence/          ← ConfidenceScoringService
│   ├── search/                ← SearchService (PostgreSQL full-text + PostGIS)
│   └── user/                  ← UserFavoritesService, UserRequestsService
├── services/
│   └── auth.service.ts        ← Register, Login, Logout, ValidateSession
├── repositories/              ← Stub (not yet implemented)
├── utils/
│   ├── api-response.ts        ← Standardized response builder
│   └── audit-logger.ts        ← Structured audit event logging
└── validators/                ← Stub (validation lives in routes currently)
```

**Observations:**
1. `[ARCHITECTURE FACT]` Domain logic lives in `domain/` subdirectories — correct layering direction.
2. `[ARCHITECTURE FACT]` The `repositories/` directory is a stub — data access is currently performed directly by domain services via injected `PrismaClient`. This is a known gap; see Architecture Issue [AI-005].
3. `[ARCHITECTURE FACT]` The existing ingestion pipeline (`DiscoveryOrchestratorService`) is the most sophisticated existing domain component — it implements a 4-stage pipeline: Ingest → EntityResolution → ChangeDetection → ConfidenceScoring. The new-entity path wraps multiple operations in a database transaction. See `[ARCHITECTURE ILLUSTRATION]` note in Diagram 8.
4. `[ARCHITECTURE FACT]` The pipeline uses PostGIS `ST_DWithin` for spatial entity resolution and `pg_trgm` similarity for name matching — both are correct architectural choices for the current stage.
5. `[ARCHITECTURE FACT]` Rate limiting is in-memory — this limits multi-instance deployments; see Architecture Issue [AI-004].
6. `[ARCHITECTURE HYPOTHESIS]` The `packages/search` and `packages/maps` stubs suggest a possible future extraction of search and geographic utility logic into dedicated packages. This direction is architecturally plausible but not yet decided.

### 4.3 Web Frontend — Actual State `[ARCHITECTURE FACT]`

```text
apps/web/
├── app/                ← Next.js 15 App Router directory
├── components/         ← React components
├── hooks/              ← React hooks
├── lib/                ← Client utilities
├── styles/             ← Global stylesheets
├── types/              ← Frontend-specific TypeScript types
├── public/             ← Static assets
└── tailwind.config.ts  ← TailwindCSS 4 configuration
```

Dependencies: `leaflet 1.9`, `next 16.3`, `react 19`, `tailwindcss 4`, `lucide-react`.

**Assessment:** The web frontend uses Leaflet for map rendering. It does not currently depend on `@waynah/database` directly — it consumes the API. This is the correct boundary.

### 4.4 Database Package — Actual State `[ARCHITECTURE FACT]`

The `@waynah/database` package exposes:
- **Prisma Client** — generated from `schema.prisma`.
- **Spatial utilities** — `verifySpatialConnection()`, `findCandidateMatches()` (PostGIS-based).
- **Type exports** — Re-exports Prisma-generated types.

Current Prisma schema models: `HealthCheck`, `Governorate`, `District`, `Category`, `Place`, `PlaceLocation`, `DataSource`, `PlaceObservation`, `DataConflict`, `User`, `Session`, `Favorite`, `ServiceRequest`, `Business`, `BusinessMember`, `BusinessVerification`.

**Schema Assessment:**
- PostGIS is correctly enabled via `postgresqlExtensions` preview feature.
- `geography(Point, 4326)` is used for `PlaceLocation` and `PlaceObservation` — correct for accuracy-preserving distance calculations.
- `geography(MultiPolygon, 4326)` is used for `District.boundary` — correct for containment queries.
- GiST indexes are defined on geometry columns — correct for spatial query performance.
- `pg_trgm`-based similarity is used in raw SQL queries — this requires the `pg_trgm` extension, which must be verified in migrations.

**Domain Model Gap — `[CONSTRAINT]`:**
The following Phase 3 entities are NOT yet in the Prisma schema:
- Branch (Phase 3 Section 14)
- Provider (Phase 3 Section 15)
- Service Offering (Phase 3 Section 16)
- Claim (Phase 3 Section 19)
- Evidence (Phase 3 Section 19)
- Verification Record (Phase 3 Section 20)
- Review (Phase 3 Section 23)
- User Contribution (Phase 3 Section 26 via UserContribution)
- Duplicate Candidate (Phase 3 Section 24)
- Entity Alias (Phase 3 Section 5.1)

Additionally, `Place` currently has a direct `businessId` FK — this partially violates the `Place ≠ Business` domain principle, because `Business → Branch → Place` is the correct relational path per Phase 3. See Architecture Issue [AI-001] below.

### 4.5 Existing Migrations `[ARCHITECTURE FACT]`

```text
0_init_extensions/
20260929233000_client_favorites_and_requests/
20260929235000_business_domain_foundation/
20260930000000_business_verification_foundation/
20260930010000_administrative_boundaries_postgis/
20260930_geographic_data_foundation/
```

The migration history reflects an iterative growth pattern, beginning with PostgreSQL extensions, then adding client-facing features, then the business domain, then spatial foundations.

### 4.6 Architecture Issues Detected `[CONSTRAINT]`

The following architecture issues were detected during codebase inspection. These do NOT trigger Phase 3 reopening — they are recorded as architecture validation issues for Phase 6 engineering to resolve:

**[AI-001] Place.businessId Direct FK Violates Branch-as-Mediator Principle**
- **Observed:** `Place` model has `businessId String? @map("business_id")` and `business Business? @relation(...)`.
- **Phase 3 Principle:** The correct relational path is `Business → Branch → Place`. `Branch` is the authoritative operational location link between a Business and a Place (Phase 3 Section 12.2, Relationship Matrix Row: `Branch | Located at | Place | * ── 0..1`).
- **Impact:** Direct `Place.businessId` creates a shortcut that bypasses Branch semantics. When Branch is introduced as a full domain entity, this must be evaluated.
- **Resolution:** Deferred to Phase 6. Phase 4 records this but does NOT change the schema.

**[AI-002] `VerificationStatus` Enum on Place Is a Simplified Proxy**
- **Observed:** `Place.verificationStatus` is a single enum (`UNVERIFIED | VERIFIED | CLAIMED | REPORTED | CLOSED`).
- **Phase 3 Principle:** Verification is attribute-scoped, time-bounded, and backed by Claims and Evidence (Phase 3 Section 20). A single boolean-like enum does not represent the full domain model.
- **Impact:** Acceptable as a temporary proxy for the current stage. Will need to be supplemented by the full Claim/Evidence/Verification Record structure in Phase 6.
- **Resolution:** Deferred to Phase 6. Do NOT treat `verificationStatus` as the full Trust Architecture.

**[AI-003] No Branch, Provider, Service Offering in Schema Yet**
- **Observed:** These three Phase 3 entities are absent from the Prisma schema.
- **Impact:** Expected — these were not in scope for Phase 1/2 implementation. Phase 4 defines their architectural boundaries. Phase 6 implements them.
- **Resolution:** Architectural boundaries defined in Section 8 of this document. Implementation deferred.

**[AI-004] In-Memory Rate Limiter Cannot Survive Multi-Instance Deployment**
- **Observed:** `rate-limit.middleware.ts` uses in-process counters.
- **Impact:** If the API runs more than one process/instance (e.g., Docker replicas, Vercel serverless), rate limit state is not shared.
- **Resolution:** Acceptable for current single-instance development deployment. Architecture Section 17 (Caching) addresses the longer-term strategy.

**[AI-005] `repositories/` Layer Stub — Domain Services Directly Access Prisma**
- **Observed:** Domain services (e.g., `SearchService`, `BusinessService`) inject `PrismaClient` directly and call Prisma methods internally.
- **Impact:** The domain layer is currently coupled to Prisma types and query patterns, making it harder to unit-test domain logic in isolation from the database.
- **Architecture Note `[ARCHITECTURE HYPOTHESIS]`:** A persistence abstraction layer between domain services and Prisma may improve testability and domain purity. The form this abstraction takes (Repository pattern, query object, or other mechanism) is `[IMPLEMENTATION DETAIL — PHASE 6]` and is deferred (see DD-20). See also Section 10.4.

---

## 5. ARCHITECTURE PRINCIPLES

The following 12 principles govern all Phase 4 architecture decisions:

1. **Domain Model is Primary `[ARCHITECTURE DECISION]`:** Every architectural choice must be grounded in the Phase 3 Domain Model. The architecture serves the domain; the domain does not serve the architecture.

2. **Modular Monolith First `[ARCHITECTURE DECISION]`:** All feature development begins inside the monolith. Extraction to separate services is permitted only when justified by specific, demonstrated operational need — not by default.

3. **PostgreSQL as the Single Source of Truth `[ARCHITECTURE DECISION]`:** All durable state lives in PostgreSQL. No supplementary persistent store is introduced without a demonstrated, irreplaceable need.

4. **Explicit Layer Dependency Direction `[ARCHITECTURE DECISION]`:** Dependencies flow inward: `Infrastructure → Application → Domain`. The Domain layer must not depend on Infrastructure. Prisma is Infrastructure.

5. **Prisma is NOT the Domain Model `[ARCHITECTURE DECISION]`:** Prisma models are persistence representations. Domain entities, their invariants, and their behavior are defined in domain service code, not in Prisma schema structures.

6. **No Premature Optimization `[ARCHITECTURE DECISION]`:** Do not introduce external caches, search engines, or message queues until there is a concrete, measurable reason to do so that cannot be satisfied by the existing stack.

7. **Claims and Evidence Are First-Class Concerns `[ARCHITECTURE DECISION]`:** The Trust & Provenance architecture is central to WAYNAH's value proposition. It must be designed with explicit transaction boundaries, immutable history, and audit traceability — not retrofitted as an afterthought.

8. **PostGIS for Spatial — No Alternative Until Proven Necessary `[ARCHITECTURE DECISION]`:** PostgreSQL/PostGIS is the spatial database. No separate geospatial service is introduced.

9. **Resilience for Yemen Conditions `[ARCHITECTURE DECISION]`:** Architecture must assume unstable connectivity, high latency, and mobile-first access. Reads must be designed for graceful degradation; writes must be designed for explicit failure handling — callers must always receive a clear success or failure signal, never an ambiguous state.

10. **Security Boundaries Must Be Explicit `[ARCHITECTURE DECISION]`:** Authentication and authorization are enforced at the API boundary. Internal module boundaries enforce data ownership. No module may directly access another module's data store path without going through a defined interface.

11. **Observability Must Be Structural `[ARCHITECTURE DECISION]`:** Structured logging and audit trails are not optional. Every sensitive operation (auth, verification, data mutation) generates a structured audit log entry.

12. **Do Not Reverse Phase 3 `[ARCHITECTURE DECISION]`:** If implementation pressure creates a conflict with Phase 3, the conflict is recorded and escalated — not silently resolved by changing the domain model.

---

## 6. SYSTEM CONTEXT

### 6.1 System Context Diagram (Conceptual)

```text
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         WAYNAH SYSTEM CONTEXT                                   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  EXTERNAL ACTORS                                                                 ║
║  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               ║
║  │  Public Visitor  │  │  Citizen User    │  │ Business Actor   │               ║
║  │  (No Auth)       │  │  (Registered)    │  │ (Owner/Manager)  │               ║
║  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘               ║
║           │                     │                     │                          ║
║           ▼                     ▼                     ▼                          ║
║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
║  │                         WAYNAH WEB FRONTEND                                │  ║
║  │                  (apps/web — Next.js 16 / React 19)                       │  ║
║  └─────────────────────────────────┬──────────────────────────────────────────┘  ║
║                                    │ HTTPS REST API Calls                        ║
║                                    ▼                                             ║
║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
║  │                          WAYNAH API SERVER                                 │  ║
║  │               (apps/api — Hono 4 / Node.js)                               │  ║
║  │  Auth │ Authorization │ Routes │ Domain Services │ PostGIS Queries         │  ║
║  └───────────────────────────────┬─────────────────────────────────────────┬──┘  ║
║                                  │                                         │     ║
║         ┌────────────────────────┘                       ┌─────────────────┘     ║
║         ▼                                               ▼                       ║
║  ┌──────────────────────────┐              ┌──────────────────────────────────┐  ║
║  │   PostgreSQL 16          │              │   Object Storage (Future)        │  ║
║  │   + PostGIS 3.4          │              │   Evidence Artifacts / Media     │  ║
║  │   (Primary Data Store)   │              │   [ARCHITECTURE HYPOTHESIS]      │  ║
║  └──────────────────────────┘              └──────────────────────────────────┘  ║
║                                                                                  ║
║  EXTERNAL SYSTEMS (Future Candidates — not yet integrated)                       ║
║  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               ║
║  │  UN OCHA COD-AB  │  │  Field Agent App │  │  Telecom/SMS     │               ║
║  │  Geographic Data │  │  (Future)        │  │  (Future)        │               ║
║  └──────────────────┘  └──────────────────┘  └──────────────────┘               ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### 6.2 Current External Integration Points `[ARCHITECTURE FACT]`

| Integration | Type | Status | Notes |
|---|---|---|---|
| PostgreSQL 16 + PostGIS | Database | Active (Docker dev) | Primary data store |
| UN OCHA COD-AB data | Import (manual/batch) | Partially implemented | `GeographyImportService` exists |
| Web Browser (Leaflet) | Client-side map rendering | Active | Map tiles from external tile server `[UNKNOWN]` |
| Object Storage | File/Evidence artifacts | Not connected | Future integration candidate |

---

## 7. ARCHITECTURE STYLE

### 7.1 Architecture Style Selection

#### Candidate A — Modular Monolith

A single deployable unit with internal module boundaries enforced by code organization, shared database with module-level logical data ownership.

**Strengths for WAYNAH:**
- Eliminates network latency between components.
- Supports full ACID transactions across module boundaries (critical for Trust & Provenance).
- Single deployment unit greatly reduces operational complexity.
- Appropriate for a small team building a geographically focused platform.
- Easy to refactor and move boundaries as domain understanding evolves.
- Debugging and observability are simpler — one process, one log stream.

**Weaknesses:**
- Must enforce module isolation through code discipline, not infrastructure.
- Scaling individual modules requires scaling the whole application.
- Long-term risk of coupling between modules if discipline is not maintained.

#### Candidate B — Microservices

Multiple independently deployable services communicating via network calls.

**Assessment against WAYNAH's current reality:**
- Current team size and project stage make microservices premature operational overhead.
- WAYNAH's Trust & Provenance model frequently requires cross-aggregate transactions (e.g., creating a Claim while linking Evidence while updating a Verification Record atomically). Distributed transactions are significantly harder to implement correctly than local transactions.
- Yemen connectivity constraints mean API latency between services will compound into poor user experience on high-latency networks.
- Deployment complexity (service discovery, health checks, load balancers per service) is not justified at the current scale.

**Conclusion for Candidate B:** `[ARCHITECTURE DECISION]` — **Microservices are explicitly rejected for the current project stage.** This decision must be revisited only when specific operational evidence demands it (e.g., geographic processing queue creates resource contention with user-facing requests).

#### Candidate C — Hybrid / Selective Extraction

Modular Monolith core with selective extraction of specific bounded contexts when operationally justified.

**Assessment:** This is the correct long-term direction, but premature to plan specific extractions now. The architecture should be designed to make future extraction possible (clean module interfaces, no cross-module direct data access), without committing to when or what to extract.

### 7.2 Recommended Architecture Direction `[ARCHITECTURE DECISION]`

**WAYNAH SHALL BE A MODULAR MONOLITH.**

Rationale:
1. The current codebase already demonstrates modular structure within a single deployment unit.
2. ACID transaction support across the Trust & Provenance model is architecturally essential.
3. Team size and operational maturity justify monolith simplicity.
4. Yemen network conditions make inter-service latency a genuine reliability risk.
5. The domain boundaries are not yet validated empirically — splitting too early locks premature boundaries.
6. The architecture must be designed for future extraction possibility (clean interfaces), but extraction is deferred.

**Non-negotiable constraint on future extraction:** A module may only be considered for extraction into an independent service when all of the following are true:
- The module has zero need for synchronous cross-module transactions.
- It has a clearly defined and stable public interface.
- There is demonstrated operational evidence (metrics) that isolation provides specific, measurable benefit.

---

## 8. MODULAR BOUNDARIES

### 8.1 Module Boundary Map

```text
WAYNAH MODULAR MONOLITH — LOGICAL MODULE BOUNDARIES

apps/api/src/domain/
├── geography/        ← [Geographic Context Module]
│   Owns: Governorate, District, Uzlah, Village, Landmark entities
│   Provides: Administrative reference data, spatial district resolution
│
├── place-registry/   ← [Place Registry Context Module]  ← (to be established)
│   Owns: Place, PlaceLocation
│   Provides: Canonical physical location identity and spatial pin
│
├── operating-presence/ ← [Business & Operating Presence Context Module] ← (to be established)
│   Owns: Business, Branch, Provider, BusinessMember
│   Provides: Commercial identity, operational presence, provider capabilities
│
├── service-offerings/  ← [Service Offerings Context Module] ← (to be established)
│   Owns: ServiceOffering
│   Provides: Intangible capability catalog, delivery mode, availability
│
├── trust/             ← [Trust & Provenance Context Module] ← (to be established)
│   Owns: Claim, Evidence, VerificationRecord, DataSource
│   Provides: Multi-source trust evaluation, provenance audit
│
├── community/         ← [Community & Moderation Context Module] ← (to be established)
│   Owns: Review, UserContribution
│   Provides: Crowdsourced contributions, experience reports, moderation queue
│
├── identity-resolution/ ← [Identity & Resolution Context Module] ← (to be established)
│   Owns: DuplicateCandidate, EntityAlias
│   Provides: Duplicate detection, entity merge/split, alias management
│
├── discovery/         ← [Discovery Pipeline — crosses multiple contexts]
│   Consumes: PlaceRegistry, Trust, Geographic
│   Provides: Data ingestion orchestration, entity resolution, confidence scoring
│
├── search/            ← [Search — cross-cutting concern]
│   Consumes: PlaceRegistry, Operating Presence, Geographic, Trust
│   Provides: Multi-dimensional discovery results
│
├── intelligence/      ← [Confidence Scoring — internal to Trust]
│   Currently: Standalone. Should migrate under Trust module
│
├── business/          ← [Current proxy for Operating Presence — interim]
│   Will migrate to: operating-presence/
│
└── user/              ← [User personal profile concerns]
    Owns: User session data (favorites, personal requests)
    Note: Must be decoupled from Business domain membership in Phase 6
```

**Module Interaction Rules `[ARCHITECTURE DECISION]`:**
1. Modules communicate through defined service interfaces, never by directly importing another module's Prisma queries.
2. A module may read reference data from the Geographic module (governorates, districts) — this is read-only reference data access, not an ownership violation.
3. The Trust module owns all Claim/Evidence/Verification data. Other modules that need verification status read it through the Trust module's public interface.
4. The Discovery pipeline orchestrates across modules — it is an Application Service, not a Domain module.

---

## 9. BOUNDED CONTEXT MAPPING

### 9.1 Context 1: Geographic Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Maintains authoritative administrative hierarchy and spatial reference data |
| **Candidate Module** | `domain/geography/` |
| **Owned Concepts** | Governorate, District, Uzlah/Sub-District, Village/Neighborhood, Landmark |
| **Consumed Concepts** | None from other modules |
| **Published Concepts** | `DistrictRef`, `GovernorateRef` (read-only references consumed by Place, Branch, Provider) |
| **Data Ownership** | `governorates`, `districts` tables (exclusive ownership) |
| **External Dependencies** | UN OCHA COD-AB geographic data (import-time only) |
| **Transaction Boundary** | Self-contained — geographic data mutations are rare batch imports |
| **Security Boundary** | Read: Public. Write/Import: `ADMIN_GEOGRAPHY_IMPORT` permission only |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith; it is foundational reference data |

### 9.2 Context 2: Place Registry Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Canonical physical location identity, spatial pin, site lifecycle |
| **Candidate Module** | `domain/place-registry/` (currently partially implemented in `discovery/`) |
| **Owned Concepts** | Place, PlaceLocation |
| **Consumed Concepts** | DistrictRef (from Geographic Context), CategoryRef |
| **Published Concepts** | `PlaceRef`, `SpatialPin` (consumed by Branch, Provider, Search) |
| **Data Ownership** | `places`, `place_locations` tables |
| **External Dependencies** | PostGIS for spatial operations |
| **Transaction Boundary** | Place creation is transactional (Place + PlaceLocation must be atomic) |
| **Security Boundary** | Read: Public. Create: `PLACE_CREATE`. Update: `PLACE_UPDATE`. Delete: `PLACE_DELETE` |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith; core discovery entity |

### 9.3 Context 3: Business & Operating Presence Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Commercial identity, brand, branch operational presence, provider capabilities |
| **Candidate Module** | `domain/operating-presence/` (currently `domain/business/`) |
| **Owned Concepts** | Business, Branch, Provider, BusinessMember, BusinessVerification (interim proxy) |
| **Consumed Concepts** | PlaceRef (from Place Registry), DistrictRef (from Geographic), ServiceOfferingRef |
| **Published Concepts** | `BusinessRef`, `BranchRef`, `ProviderRef` (consumed by Trust, Search, Community) |
| **Data Ownership** | `businesses`, `branches` (to be created), `providers` (to be created), `business_members` tables |
| **External Dependencies** | None — self-contained |
| **Transaction Boundary** | Creating a Branch links it to a Business and optionally a Place — transactional |
| **Security Boundary** | Read: `BUSINESS_READ`. Manage: `BUSINESS_MANAGE`. Branch management deferred |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith; deeply interlinked with Trust and Search |

### 9.4 Context 4: Service Offerings Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Intangible service capabilities, execution modes, availability conditions |
| **Candidate Module** | `domain/service-offerings/` (not yet implemented) |
| **Owned Concepts** | ServiceOffering |
| **Consumed Concepts** | BranchRef, ProviderRef (from Operating Presence), DistrictRef (for mobile coverage area) |
| **Published Concepts** | `ServiceOfferingRef` (consumed by Search, Community) |
| **Data Ownership** | `service_offerings` table (to be created) |
| **External Dependencies** | None |
| **Transaction Boundary** | Adding/removing offerings is scoped to the Branch/Provider owning them |
| **Security Boundary** | Manage: Branch/Provider owner permissions |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith; tightly coupled to Operating Presence and Search |

### 9.5 Context 5: Trust & Provenance Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Multi-source Claims, Evidence artifacts, scoped Verification Records, Data Source provenance |
| **Candidate Module** | `domain/trust/` (not yet implemented; `domain/intelligence/` is a partial stub) |
| **Owned Concepts** | Claim, Evidence, VerificationRecord, DataSource |
| **Consumed Concepts** | PlaceRef, BusinessRef, BranchRef, ProviderRef (targets of claims) |
| **Published Concepts** | `TrustContext` — verification state per entity/attribute scope (consumed by Search, Community) |
| **Data Ownership** | `claims`, `evidence`, `verification_records`, `data_sources` tables (to be created) |
| **External Dependencies** | Object Storage (future) for Evidence binary artifacts |
| **Transaction Boundary** | Submitting a Claim + attaching Evidence must be atomic. Verification decision update must be atomic. |
| **Security Boundary** | Read: `PLACE_READ` (for current verification state). Submit: per actor role. Verify: `ADMIN_VERIFICATION_REVIEW` |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith; requires cross-entity transactions with Place and Business |

### 9.6 Context 6: Community & Moderation Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Crowdsourced contributions, experience reviews, moderation queues |
| **Candidate Module** | `domain/community/` (not yet implemented) |
| **Owned Concepts** | Review, UserContribution |
| **Consumed Concepts** | PlaceRef, BusinessRef, BranchRef, ServiceOfferingRef (review targets) |
| **Published Concepts** | Moderation queue events (consumed by Admin tooling) |
| **Data Ownership** | `reviews`, `user_contributions` tables (to be created) |
| **External Dependencies** | None |
| **Transaction Boundary** | Submitting a review or contribution is self-contained |
| **Security Boundary** | Contribute: authenticated citizen. Moderate: `admin.*` permissions |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith for now; candidate for future extraction if moderation load warrants it |

### 9.7 Context 7: Identity & Resolution Context

| Dimension | Value |
|---|---|
| **Domain Responsibility** | Duplicate entity detection, entity merge/split, EntityAlias management |
| **Candidate Module** | `domain/identity-resolution/` (not yet implemented) |
| **Owned Concepts** | DuplicateCandidate, EntityAlias |
| **Consumed Concepts** | PlaceRef, BusinessRef, BranchRef (pairs of candidate duplicates) |
| **Published Concepts** | Resolution outcomes (notified back to affected entity modules) |
| **Data Ownership** | `duplicate_candidates`, `entity_aliases` tables (to be created) |
| **External Dependencies** | PostGIS (spatial signals), pg_trgm (name similarity signals) |
| **Transaction Boundary** | Entity merge is a complex, multi-step transaction spanning Place and Business data |
| **Security Boundary** | Read: `ADMIN_CONFLICTS_READ`. Resolve: `admin.*` |
| **Monolith Residency** | `[ARCHITECTURE DECISION]` — MUST remain in monolith; merge operations require cross-entity ACID transactions |

---

## 10. APPLICATION / DOMAIN / INFRASTRUCTURE LAYERS

### 10.1 Layer Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION / INTERFACE LAYER                          │
│  apps/web (Next.js)         |  apps/api (Hono — Routes, Middleware, Validators)│
│  • HTTP request/response    |  • Input validation (Zod)                        │
│  • React UI rendering       |  • Auth/Authz middleware                         │
│  • Client-side state        |  • API response formatting                       │
│  KNOWS: Application Layer contracts (schemas, response types)                   │
│  DOES NOT KNOW: Domain internals, Prisma models, database queries               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                          APPLICATION LAYER                                       │
│  apps/api/src/domain/ (service orchestrators)                                   │
│  • Orchestrates use cases (e.g., processObservation, reviewVerification)        │
│  • Calls Domain Services and Repository interfaces                              │
│  • Coordinates transactions                                                     │
│  • Converts Domain objects to API response shapes                               │
│  KNOWS: Domain Layer interfaces, Repository interfaces                          │
│  DOES NOT KNOW: HTTP concerns, Prisma types, SQL queries                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                            DOMAIN LAYER                                          │
│  Domain entities, invariants, domain events, business rules                     │
│  • Phase 3 entities (Place, Business, Branch, Claim, etc.)                      │
│  • Domain invariants (Place ≠ Business, Claim ≠ Truth, etc.)                   │
│  • Domain events (PlaceDiscovered, ClaimSubmitted, VerificationPerformed, etc.) │
│  • No external framework dependencies                                           │
│  KNOWS: Domain concepts only                                                    │
│  DOES NOT KNOW: Prisma, PostgreSQL, HTTP, Next.js                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                         INFRASTRUCTURE LAYER                                     │
│  packages/database (Prisma + PostGIS)                                           │
│  • Prisma Client — database query execution                                     │
│  • Repository implementations — translates domain queries to SQL                │
│  • Spatial utilities — PostGIS query helpers                                    │
│  • External service clients (future: object storage, geocoding API)            │
│  KNOWS: Prisma types, PostgreSQL, SQL, PostGIS                                  │
│  DOES NOT KNOW: Domain business rules, HTTP, React                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Dependency Direction Rule `[ARCHITECTURE DECISION]`

```text
Presentation Layer  →  Application Layer  →  Domain Layer  ←  Infrastructure Layer
```

The arrow means "depends on" or "knows about." The Domain Layer has NO outward arrows. Infrastructure depends on Domain interfaces, not the reverse.

**Current State Assessment `[ARCHITECTURE FACT]`:** In the current codebase, domain services (`SearchService`, `BusinessService`, etc.) import `PrismaClient` directly. This places Prisma knowledge inside the Application/Domain layer. This is a pragmatic reality of the current project stage. The form of the persistence abstraction to be introduced in Phase 6 is `[IMPLEMENTATION DETAIL — PHASE 6]` (see DD-20).

### 10.3 Where Domain Rules Live `[ARCHITECTURE DECISION]`

| Concern | Layer | Examples |
|---|---|---|
| Domain invariants (Place ≠ Business) | Domain | Entity type checks, relationship validations |
| HTTP validation | Presentation (Zod schemas) | `searchParamsSchema`, `createBusinessSchema` |
| Orchestration logic | Application | `DiscoveryOrchestratorService` |
| Persistence queries | Infrastructure | Prisma queries, raw SQL |
| Auth/Authz enforcement | Presentation (Middleware) | `requirePermission`, `requireRole` |
| Confidence scoring rules | Domain | `ConfidenceScoringService` calculation logic |
| Spatial resolution logic | Infrastructure (PostGIS) | `GeographySpatialResolutionService` |

### 10.4 Persistence Abstraction — Target Direction `[ARCHITECTURE HYPOTHESIS]`

The current codebase injects `PrismaClient` directly into service constructors. This is a pragmatic current approach that creates Prisma coupling inside the application layer.

A persistence abstraction between domain services and Prisma is a plausible improvement that would increase domain-layer testability and reduce ORM coupling. The specific mechanism (Repository interface, query object, or other pattern) and any DI framework choice are `[IMPLEMENTATION DETAIL — PHASE 6]` — see DD-20.

The architectural direction (dependency inversion, infrastructure implements domain interfaces) is captured in Section 10.1 and Diagram 4.

**Current state `[ARCHITECTURE FACT]`:** `repositories/` directory is a stub. `PrismaClient` is injected into service constructors. This is functional but couples the application layer to the ORM. The form of the Phase 6 improvement is deferred.

---

## 11. DATA ARCHITECTURE

### 11.1 Database Architecture Philosophy `[ARCHITECTURE DECISION]`

**WAYNAH uses a single PostgreSQL database with logical module-level data ownership within a shared schema.**

This is appropriate because:
1. ACID transactions across module boundaries are architecturally necessary (e.g., Trust & Provenance, Duplicate Resolution).
2. A single database eliminates distributed transaction complexity.
3. PostGIS spatial functions can operate across tables within the same database efficiently.
4. The current deployment stage does not require polyglot persistence.

**Alternative rejected:** Multiple databases per bounded context. This would prevent atomic cross-context operations and is premature given the project stage.

### 11.2 Database Ownership Model `[ARCHITECTURE DECISION]`

Each module owns its tables. No module may directly execute SQL against another module's tables in production code (all access must go through the owning module's service interface):

| Module | Owned Tables |
|---|---|
| Geographic Context | `governorates`, `districts` |
| Place Registry | `places`, `place_locations`, `categories` |
| Operating Presence | `businesses`, `branches`*, `providers`*, `business_members`, `business_verifications` |
| Service Offerings | `service_offerings`* |
| Trust & Provenance | `claims`*, `evidence`*, `verification_records`*, `data_sources`, `place_observations`, `data_conflicts` |
| Community | `reviews`*, `user_contributions`* |
| Identity & Resolution | `duplicate_candidates`*, `entity_aliases`* |
| User/Auth | `users`, `sessions`, `favorites`, `service_requests` |

*Tables marked with `*` do not yet exist in the schema. Phase 6 creates them.

### 11.3 Relational Modeling Implications `[ARCHITECTURE DECISION]`

**Key relational paths that must be preserved in schema evolution:**

```text
[ARCHITECTURE ILLUSTRATION — exact arity subject to Phase 6 design]

Business ──(1:*)──► Branch ──(0..1:1)──► Place
    ↑                              ↑
    └── BusinessMember             └── PlaceLocation (geographic pin)

Claim subject (any of): Place | Business | Branch | ServiceOffering | Provider
    │
    ├──(1:*)──► Evidence (zero or more evidence records per claim)
    │
    └──► VerificationRecord (0..* over time; each decision is a new record;
    │    a Claim may accumulate multiple verification decisions as conditions change)
    │
    └──(M:1)──► DataSource (claim was asserted by this source)
```

> **Note on VerificationRecord arity:** Per Phase 3, verification is scoped, temporal, and attribute-specific. A Claim does not produce exactly one Verification Record — it may be verified, later superseded, or re-evaluated. The exact state machine governing Claim → VerificationRecord transitions is `[UNKNOWN / VALIDATION REQUIRED]` (see DD-17).

**Key invariant:** Branch is always the join between Business and Place. Direct `Place.businessId` (Architecture Issue [AI-001]) must be evaluated in Phase 6.

### 11.4 Transaction Boundaries `[ARCHITECTURE DECISION]`

| Operation | Transaction Required | Scope |
|---|---|---|
| Create Place + PlaceLocation | YES | Atomic (both or neither) |
| Create Branch → link to Business + Place | YES | Atomic |
| Relocate Branch (new Place link) | YES | Atomic (preserve old link in history) |
| Submit Claim + attach Evidence | YES | Atomic |
| Issue Verification Record | YES | Atomic (Claim state + Verification Record) |
| Duplicate resolution (Merge) | YES | Complex transaction — Entity A + Entity B + Alias |
| User registration | YES | User + Session |
| Discovery pipeline — New Entity | YES | Observation + Place + PlaceLocation + status update |
| Discovery pipeline — Conflict | YES | Observation + DataConflict records |
| Ingest observation (Pending) | YES | Single observation record |
| Update confidence score | NO (best-effort update) | Can be retried |

### 11.5 Soft Deletion & Lifecycle Semantics `[ARCHITECTURE DECISION]`

WAYNAH does NOT use hard deletes for domain entities. The Phase 3 Domain Invariant "Immutable History" requires that:
- Places, Businesses, Branches, and Providers transition to explicit operational states (deprecated, closed, retired) rather than being deleted.
- Claims and Verification Records are immutable once issued. Supersession creates a new record; it does not overwrite the old one.
- Entity merges preserve both original records — the merged-out entity transitions to a deprecated state with an EntityAlias linking it to the survivor.

**Physical deletion policy** for privacy, legal compliance, and GDPR-like obligations is `[UNKNOWN / VALIDATION REQUIRED]` — this must be addressed by governance policy in Phase 6.

### 11.6 Historical Data & Audit Trail `[ARCHITECTURE DECISION]`

All domain-significant state changes produce an immutable audit record. Current implementation uses `AuditLogger` structured console output. Phase 6 must persist audit logs to a durable audit table or log stream.

Candidate audit events that require durable records:
- All authentication events (success, failure, logout)
- All Claim submissions
- All Verification decisions
- All entity merge/split operations
- All admin actions

---

## 12. POSTGRESQL / POSTGIS ARCHITECTURE

### 12.1 PostGIS Architectural Role `[ARCHITECTURE DECISION]`

PostgreSQL + PostGIS 3.4 serves as:
1. **Primary spatial data store** — `geography(Point, 4326)` for place locations and observation points.
2. **Spatial query engine** — `ST_DWithin` for proximity search and entity resolution, `ST_Covers`/`ST_Within` for district containment, `ST_Distance` for distance calculation.
3. **Administrative boundary store** — `geography(MultiPolygon, 4326)` for district polygon containment queries.
4. **Duplicate candidate detection** — spatial proximity signal via `ST_DWithin` within configurable radius.

### 12.2 Spatial Responsibilities by Module

| Module | Spatial Responsibility |
|---|---|
| Geographic Context | District boundary polygons (`MultiPolygon`), boundary containment queries |
| Place Registry | Place location points (`Point`), GiST index maintenance |
| Discovery Pipeline | District resolution from coordinates (`ST_Covers` polygon containment), entity resolution spatial matching (`ST_DWithin`) |
| Search | Proximity search (`ST_DWithin`), distance calculation (`ST_Distance`) |
| Identity & Resolution | Duplicate spatial proximity signal (`ST_DWithin` within detection radius) |

### 12.3 Geographic Data Types `[ARCHITECTURE DECISION]`

| Concept | PostGIS Type | SRID | Justification |
|---|---|---|---|
| Place coordinates | `geography(Point, 4326)` | 4326 (WGS84) | Distance calculations in meters via geodetic math |
| Observation coordinates | `geography(Point, 4326)` | 4326 | Consistent with Place type |
| District boundaries | `geography(MultiPolygon, 4326)` | 4326 | Containment queries; correct geodetic handling |
| Proximity radius queries | `ST_DWithin(geom, center, meters)` | — | geography type enables meter-unit radius |

**Note `[ARCHITECTURE FACT]`:** PostGIS `geography` type performs accurate geodetic distance calculations without projection distortion — essential for Yemen's geography. `geometry` types require explicit projection for accurate distance calculations and are not used here.

### 12.4 Index Strategy (Conceptual) `[ARCHITECTURE DECISION]`

| Index | Type | On | Purpose |
|---|---|---|---|
| `place_locations.geom` | GiST | PlaceLocation spatial column | Proximity search, entity resolution |
| `place_observations.geom` | GiST | PlaceObservation spatial column | Ingestion entity resolution |
| `districts.boundary` | GiST | District boundary polygon | District containment queries |
| `places.name_ar` | GIN/pg_trgm | Arabic name | Text similarity search |
| `places.category_id` | B-tree | Category FK | Category filtering |
| `places.district_id` | B-tree | District FK | Geographic filtering |
| `claims.target_entity_id` | B-tree | Claim target | Trust lookup by entity |
| `entity_aliases.canonical_entity_id` | B-tree | Alias → canonical entity | Resolution lookup |

**Note:** `pg_trgm` GIN indexes require the `pg_trgm` extension to be enabled. This should be verified in migrations.

### 12.5 Future Scaling Concerns `[ARCHITECTURE HYPOTHESIS]`

At significant scale (nationwide Yemen deployment), the following spatial scaling patterns may become relevant:
- Table partitioning on `places` by `district_id` — deferred.
- Read replicas for spatial query offloading — deferred.
- Dedicated spatial cache (PostGIS query result cache) — deferred.

These are `[ARCHITECTURE HYPOTHESIS]` and must not be implemented prematurely.

---

## 13. SEARCH ARCHITECTURE

### 13.1 Current Search Implementation `[ARCHITECTURE FACT]`

The existing search service uses:
- **`pg_trgm` trigram similarity** for Arabic and English name matching.
- **PostGIS `ST_DWithin`** for geographic radius filtering.
- **`ILIKE`** for fallback substring matching.
- A **blended relevance score** combining text relevance and geographic proximity signals. The specific weighting formula applied in the current codebase is an `[IMPLEMENTATION DETAIL — PHASE 6]` — ranking weights are `[UNKNOWN / VALIDATION REQUIRED]` and must be empirically tuned (see DD-08).
- Executed as raw SQL via the database client.

### 13.2 Search Intent Dimensions vs. Current Implementation

| Phase 3 Intent | Current Implementation | Gap |
|---|---|---|
| Category Intent | ✅ `categoryId` filter | No hierarchical category traversal |
| Name Intent (Arabic) | ✅ `pg_trgm` on `name_ar` | No phonetic/transliteration matching |
| Name Intent (English) | ✅ `pg_trgm` on `name_en` | Partial |
| Proximity Intent | ✅ `ST_DWithin` | ✅ Working |
| Service Intent | ❌ Not implemented | `ServiceOffering` not yet in schema |
| Phone Intent | ❌ Not implemented | Phone stored as text field on Place |
| Local Vernacular Intent | ❌ Not implemented | `EntityAlias` not yet in schema |

### 13.3 Arabic Language Search Considerations `[ARCHITECTURE DECISION]`

Arabic search via `pg_trgm` works for trigram-level matching (shared character n-grams). Limitations:
- **Diacritic normalization:** Arabic text with/without tashkeel (e.g., `مدرسةُ` vs `مدرسة`) creates different trigrams. PostgreSQL unaccent extension or normalization required.
- **Root-based morphology:** `pg_trgm` does not understand Arabic root morphology. A search for `مدرسة` will not match `المدارس` via trigrams.
- **Local vernacular names:** Names like `وايت ماء` or `سطحة` require EntityAlias matching, which is not yet implemented.

`[ARCHITECTURE DECISION]` — For the current stage, `pg_trgm` + `ILIKE` is the correct starting point. It is functional, requires no additional infrastructure, and handles the primary search patterns. Arabic morphology and transliteration improvements are explicitly deferred.

### 13.4 Search Architecture Comparison

| Architecture | Fit for Current Stage | Long-Term Scalability | Infrastructure Cost |
|---|---|---|---|
| **PostgreSQL `pg_trgm` + PostGIS** | ✅ Excellent | Adequate for Yemen-scale | Zero additional infrastructure |
| PostgreSQL + PostGIS + pg_trgm + EntityAlias table | ✅ Excellent | Good | Zero additional infrastructure |
| Dedicated search engine (Meilisearch/Elasticsearch) | ❌ Premature | Excellent | High — additional service, sync complexity |
| Hybrid (PostgreSQL primary + search engine secondary) | ❌ Premature | Excellent | Very high — dual maintenance |

### 13.5 Search Architecture Decision `[ARCHITECTURE DECISION]`

**WAYNAH search remains PostgreSQL-native (pg_trgm + PostGIS) for the foreseeable future.**

The search architecture evolves in three phases:
- **Phase 6 (Current Implementation Milestone):** PostgreSQL `pg_trgm` + PostGIS + EntityAlias table for vernacular/transliteration matching + Phone-number search on Contact collection.
- **Phase 7+ (If scale demands):** Evaluate dedicated Arabic-capable search engine only when PostgreSQL search demonstrably becomes a bottleneck under real load metrics.
- **Phase 8+ (Nationwide):** Full text search with Arabic morphology analysis — only if empirical evidence demands it.

Ranking formula weights (text vs. proximity vs. operational state vs. verification confidence vs. freshness) are `[UNKNOWN / VALIDATION REQUIRED]` — deferred to product empirical tuning.

---

## 14. TRUST & PROVENANCE ARCHITECTURE

### 14.1 Claim / Evidence / Verification Flow `[ARCHITECTURE DECISION]`

```text
╔═══════════════════════════════════════════════════════════════════════╗
║                  CLAIM / EVIDENCE / PROVENANCE FLOW                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Data Source                                                          ║
║      │                                                                ║
║      ▼                                                                ║
║  Claim (ClaimSubmitted event)                                         ║
║      │ ← source attribution + timestamp + attribute scope + value    ║
║      │ ← Data Source ID (Gov Import | Field Agent | Owner | Citizen)  ║
║      │                                                                ║
║      ├──► Evidence (EvidenceAttached event) [0..*]                   ║
║      │         │ ← binary artifact locator (object storage ref)       ║
║      │         │ ← collection method + collector ref + timestamp       ║
║      │                                                                ║
║      ▼                                                                ║
║  Evaluation Triage                                                    ║
║      │ ← ConflictDetected (if conflicting claims exist)              ║
║      │ ← VerificationPerformed (when reviewer issues decision)        ║
║      │                                                                ║
║      ▼                                                                ║
║  Verification Record (scoped to attribute + time window)              ║
║      │ ← reviewer identity + effective date + expiry date            ║
║      │ ← verification authority tier concept                          ║
║      │ ← unverified attribute list (explicitly scoped)               ║
║      │                                                                ║
║  READ MODEL: Current trust context per entity/attribute               ║
║      │ ← derived from most recent non-expired Verification Record    ║
║      │    for each attribute scope of the entity                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 14.2 Provenance Storage Responsibility `[ARCHITECTURE DECISION]`

| Artifact | Stored In | Mutable? |
|---|---|---|
| Claim record | PostgreSQL `claims` table | Immutable once issued |
| Evidence metadata | PostgreSQL `evidence` table | Immutable once attached |
| Evidence binary artifact | Object Storage (future) | Retention policy governed |
| Verification Record | PostgreSQL `verification_records` table | Immutable once issued; superseded by new records |
| Conflict record | PostgreSQL `data_conflicts` table | Resolution status mutable; original conflict immutable |
| Confidence score | PostgreSQL `place_observations.confidence_score` | Recalculable (not a source of truth) |

### 14.3 Transaction Boundaries for Trust `[ARCHITECTURE DECISION]`

| Operation | Transaction | Consistency Model |
|---|---|---|
| Submit Claim | YES — Claim + DataSource link + initial status | Strongly consistent |
| Attach Evidence to Claim | YES — Evidence record + Claim link | Strongly consistent |
| Issue Verification Record | YES — VerificationRecord + Claim status update | Strongly consistent |
| Detect Conflict | YES — DataConflict record + Claim conflict flag | Strongly consistent |
| Update Confidence Score | NO — can be async recalculation | Eventually consistent |

### 14.4 Temporal Validity `[ARCHITECTURE DECISION]`

Every Verification Record carries:
- `effectiveDate` — when verification was issued.
- `expiryDate` — when the verification scope expires.
- `attributeScope` — which specific attributes were verified.

A Verification Record is **not globally valid** — it is valid for specific attributes within a specific time window. Search and display logic must respect this temporal validity.

### 14.5 Read Model Implications `[ARCHITECTURE HYPOTHESIS]`

For performance in Discovery queries, a derived "current trust context" view per entity may be beneficial:

```text
[ARCHITECTURE HYPOTHESIS] CurrentEntityTrustView
  entity_id | attribute_scope | is_verified | expiry_date | confidence_level
```

This view would be derived from the most recent non-expired Verification Records for each entity/attribute combination. Whether this is a materialized view, a cached query, or a computed column is `[UNKNOWN / VALIDATION REQUIRED]` — deferred to Phase 6.

---

## 15. EVIDENCE / OBJECT STORAGE ARCHITECTURE

### 15.1 Evidence Metadata vs. Binary Object `[ARCHITECTURE DECISION]`

Evidence is architecturally split into two distinct concerns:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  EVIDENCE METADATA                                                    │
│  (PostgreSQL — permanent, authoritative)                              │
│  • evidence.id                                                        │
│  • evidence.claim_id                                                  │
│  • evidence.collection_method (photo, document, field report)        │
│  • evidence.collector_ref (field agent ID or system)                 │
│  • evidence.collected_at (timestamp)                                  │
│  • evidence.storage_locator (reference to binary artifact location)  │
│  • evidence.media_type (image/jpeg, application/pdf, etc.)           │
│  • evidence.file_size_bytes                                           │
│  • evidence.checksum (SHA-256 for integrity verification)            │
│  • evidence.access_policy (public | restricted | admin-only)        │
│  • evidence.created_at                                               │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  BINARY ARTIFACT                                                       │
│  (Object Storage — separate from database)                            │
│  • Stored at: {bucket}/{entity-type}/{entity-id}/{evidence-id}.{ext} │
│  • Access: Via signed URLs with expiry (never direct bucket access)  │
│  • Deletion: Governed by retention policy (not immediate)             │
└──────────────────────────────────────────────────────────────────────┘
```

### 15.2 Object Storage Architecture `[ARCHITECTURE HYPOTHESIS]`

No object storage provider is currently integrated. The architecture decision for the storage backend is `[UNKNOWN / VALIDATION REQUIRED]`.

Candidate providers:
- Cloudflare R2 (S3-compatible, no egress fees)
- AWS S3
- DigitalOcean Spaces (S3-compatible)
- Self-hosted MinIO (for air-gapped/private deployment)

**Selection criteria for Yemen context:**
- Low egress cost (data is expensive in Yemen).
- S3-compatible API (for provider portability).
- Signed URL support with short expiry windows.
- Durability guarantees for legal evidence artifacts.

Provider selection is deferred to Phase 6.

### 15.3 Access Control for Evidence `[ARCHITECTURE DECISION]`

- Evidence binary artifacts are NEVER exposed via public URLs.
- Access is via **signed URLs with short expiry** (e.g., 15-minute TTL).
- Evidence access is gated by the same permission system as Claim access.
- Evidence for verified claims in a resolution case: `admin.*` only.
- Evidence submitted by a citizen: visible to submitter + admin.

### 15.4 Retention & Legal Constraints `[UNKNOWN / VALIDATION REQUIRED]`

Evidence retention, legal hold, and deletion policies are `[UNKNOWN / VALIDATION REQUIRED]`. These require:
- Legal review in the Yemen/Yemen-operations context.
- Governance policy definition.
- Phase 6 implementation of retention lifecycle management.

---

## 16. ASYNC PROCESSING ARCHITECTURE

### 16.1 Candidate Asynchronous Workloads

| Workload | Sync or Async? | Reason | Retry Safe? | Idempotency | Failure Behavior |
|---|---|---|---|---|---|
| Discovery ingestion (core pipeline) | **Sync** | Data consistency required; caller needs result | YES | YES (deduplication via entity resolution) | Return error; caller retries |
| District resolution (from coordinates) | **Sync** | Required for Place creation in pipeline | YES | YES | Throw domain error |
| Confidence score recalculation | **Async (future)** | Can be eventually consistent; does not block ingestion | YES | YES (idempotent recalculation) | Silent retry; non-critical |
| Search index refresh | **Not needed** | PostgreSQL is the search index; no separate sync required | — | — | — |
| Duplicate detection analysis | **Async (future)** | Background analysis; result creates DuplicateCandidate record | YES | YES | Retry silently |
| Evidence file virus scan | **Async (future)** | Cannot block upload response; result updates evidence status | YES | YES | Mark as pending-scan |
| Notifications (verification decisions) | **Async (future)** | Non-critical; can be delayed | YES | YES | Retry with backoff |
| Geographic data import | **Sync (admin)** | Admin-triggered batch, runs in admin context | YES | YES | Admin sees error |
| Session cleanup (expired) | **Async (future)** | Background maintenance; no user impact | YES | YES | Silent |

### 16.2 Async Processing — Technology Decision `[ARCHITECTURE DECISION]`

**No external message queue is introduced at this stage.**

Rationale:
- Current async workloads (confidence recalculation, session cleanup) can be handled via `setTimeout`/`setInterval` deferred execution or database-polled background jobs within the same Node.js process.
- Introducing a message queue (e.g., BullMQ, AWS SQS) at this stage adds operational complexity without demonstrated need.
- The workloads most likely to become asynchronous (duplicate detection, notifications) are not yet implemented.

**Trigger for queue introduction `[ARCHITECTURE HYPOTHESIS]`:** When background job processing demonstrates contention with user-facing request latency in production metrics, a PostgreSQL-backed job queue may be evaluated before introducing an external broker. Technology selection for the job queue is `[UNKNOWN / VALIDATION REQUIRED]` (see DD-11).

---

## 17. CACHING ARCHITECTURE

### 17.1 What Can Be Cached vs. What Must Remain Source of Truth

| Data | Cacheable? | Reason | Invalidation Strategy |
|---|---|---|---|
| Geographic reference data (Governorates, Districts) | ✅ YES | Rarely changes; public read | TTL-based (configurable); invalidate on import. Exact TTL is `[IMPLEMENTATION DETAIL — PHASE 6]` |
| Category list | ✅ YES | Rarely changes | TTL-based (configurable). Exact TTL is `[IMPLEMENTATION DETAIL — PHASE 6]` |
| Public discovery reads (Place + location + category) | ✅ YES (with caution) | High read volume; tolerate small staleness | Short TTL or on-write invalidation. Exact TTL and strategy are `[IMPLEMENTATION DETAIL — PHASE 6]` |
| Search results | ✅ YES (query cache, non-personalized) | Frequent identical queries | Short TTL; not user-specific. Exact TTL is `[IMPLEMENTATION DETAIL — PHASE 6]` |
| Operational schedules | ❌ NO (or very short TTL) | Dynamic; seasonal exceptions require freshness | Freshness required; short TTL acceptable only after Phase 6 tuning |
| Claim / Trust state | ❌ NO | Integrity-sensitive; must be current | Always source-of-truth |
| Verification records | ❌ NO | Must be accurate; legal significance | Always source-of-truth |
| User session data | ✅ YES (database-backed) | Sessions are already in PostgreSQL | Validated per-request; no additional cache |
| Evidence metadata | ❌ NO | Access-controlled; must not leak across actors | Always source-of-truth |
| Admin verification queue | ❌ NO | Must be current for reviewer | Always source-of-truth |

### 17.2 Caching Technology Decision `[ARCHITECTURE DECISION]`

**No external cache layer (Redis, Memcached) is introduced at this stage.**

Rationale:
- PostgreSQL read performance at the current scale is sufficient.
- In-process caching (Node.js module-level Map with TTL) can cover geographic reference data.
- Adding Redis introduces a new operational dependency without measured need.

**Trigger for Redis introduction `[ARCHITECTURE HYPOTHESIS]`:** When load testing or production metrics demonstrate that PostgreSQL read latency is a user-facing bottleneck, and when:
1. The bottleneck is on data that is genuinely cacheable (reference data, public reads).
2. Multi-instance deployment has been adopted (making in-process caches unreliable).

**For geographic reference data** (governorates, districts): Application-level in-memory cache with a configurable TTL is acceptable as a Phase 6 implementation.

**For rate limiting with multi-instance:** If the API scales beyond one instance, Redis is necessary for shared rate limit state. This is a Phase 6 decision conditioned on deployment topology.

---

## 18. SECURITY ARCHITECTURE

### 18.1 Authentication Architecture `[ARCHITECTURE FACT]`

Current authentication uses:
- **Cryptographically random session tokens** (via `crypto.randomBytes(32)` — 256-bit entropy).
- **Server-side session expiry check** against the stored expiry timestamp in the `sessions` table. The current session validity period is an observed implementation detail; the session TTL and rotation policy are `[UNKNOWN / VALIDATION REQUIRED]` (see DD-19).
- **Session storage** in PostgreSQL `sessions` table.
- **Multi-credential input:** Bearer token header, `X-API-Key` header, or `waynah_session` cookie.
- **System API Key** for ingestion service authentication (separate from user sessions).

**Assessment:** The database-backed session-token approach is appropriate for the current stage. Phase 1 closed this design direction. It must not be reopened.

### 18.2 Authorization Architecture `[ARCHITECTURE FACT]`

Current authorization uses:
- **Permission strings** (`domain.action` pattern, e.g., `place.create`, `admin.verification.review`).
- **Wildcard permissions** (`admin.*` grants all admin-scoped permissions).
- **Role-based Actor typing** (`ANONYMOUS | SYSTEM | SERVICE | USER | BUSINESS_MEMBER | ADMIN`).
- **Middleware enforcement** via `requirePermission()`, `requireRole()`, `requireActorType()` on routes.

**Assessment:** Correct pattern. The permission string model is extensible. New modules must define their permissions in `@waynah/shared/constants/permissions.ts` before use.

### 18.3 API Trust Boundaries `[ARCHITECTURE DECISION]`

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  PUBLIC BOUNDARY (No authentication required)                            │
│  GET /v1/geography/*                                                     │
│  GET /v1/search/*                                                        │
│  GET /v1/businesses/public/:id                                           │
│  GET /health                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  AUTHENTICATED USER BOUNDARY (USER | BUSINESS_MEMBER | ADMIN)            │
│  GET/POST/PATCH /v1/user/*                                               │
│  GET/POST/PATCH /v1/businesses/*                                         │
│  POST /v1/auth/logout                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  SYSTEM BOUNDARY (SYSTEM / Ingestion API Key)                            │
│  POST /v1/discovery/ingest                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ADMIN BOUNDARY (ADMIN role only)                                        │
│  GET/POST /v1/admin/*                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 18.4 Security Concerns for Phase 6 `[ARCHITECTURE DECISION]`

| Concern | Current State | Phase 6 Requirement |
|---|---|---|
| Rate limiting (single instance) | ✅ In-memory rate limiter | Multi-instance: shared rate limit state |
| HTTPS enforcement | Not visible in codebase | Enforced at load balancer / reverse proxy |
| Secret management | `.env` files | Secrets management service in production |
| Evidence access signed URLs | Not implemented | Object storage signed URL generation |
| Audit log persistence | Console output only | Persistent audit table or external log store |
| Session rotation | Not implemented | Consider session rotation on privilege change |
| CORS policy | Configurable via `CORS_ORIGIN` env | Tighten in production |
| Error message leakage | Phase 1 addressed (F-02, F-06) | Maintain zero-leak policy |
| Input sanitization | Zod validation on routes | Maintain; extend to all new routes |
| IDOR protection | Per-membership check in business routes | Must be applied to all resource-scoped routes |

---

## 19. RESILIENCE & YEMEN OPERATING CONDITIONS

### 19.1 Operating Context `[ARCHITECTURE FACT]`

WAYNAH operates primarily in Yemen, with specific infrastructure realities:
- Mobile-first user base (smartphone via mobile data).
- Variable 3G/4G connectivity; significant intermittency in rural Hajjah districts.
- High request latency common (200ms+ round-trip from rural areas).
- Low bandwidth constrains payload size.
- Users may lose connectivity mid-session.

### 19.2 Read Resilience `[ARCHITECTURE DECISION]`

| Read Scenario | Strategy |
|---|---|
| Public discovery reads | Design API responses to be complete in a single call (avoid pagination-heavy interaction patterns for primary discovery). |
| Geographic reference data | Cache governorates/districts in-process; serve from cache on database unavailability. |
| Search results | Short TTL query cache acceptable; stale-by-seconds is tolerable for discovery. |
| Verification state | Must be fresh — no stale-read tolerance. |
| Map tiles | Served by external tile provider (Leaflet); fallback tile strategy is a UX/frontend concern. |

### 19.3 Write Synchronization `[ARCHITECTURE DECISION]`

| Write Scenario | Strategy |
|---|---|
| Claim submission | Must be synchronous and confirmed. Do not offer optimistic local persistence. |
| User contribution (crowd edit) | Synchronous confirmation. Return success only when persisted. |
| Review submission | Synchronous confirmation. |
| Authentication (login/register) | Synchronous — session token only returned when session record persisted. |
| Discovery ingestion | Synchronous — orchestrator returns result to ingestion source. |

**No offline-first write sync is planned.** WAYNAH's Trust model requires server-authoritative confirmation. Offline write queuing with later sync introduces complex conflict resolution that is architecturally unsuitable for the Claims model.

### 19.4 Graceful Degradation `[ARCHITECTURE DECISION]`

- If PostGIS spatial resolution fails, the system must throw an explicit domain error — not silently fall back to a random district.
- If the database is unavailable, the API returns a `503 Service Unavailable` with no internal details leaked.
- If the post-ingestion confidence evaluation fails, the pipeline must still commit the ingested observation in a non-evaluated state and make it available for retry or deferred scoring. The observation must not be silently discarded. The exact retry mechanism and the representation of "non-evaluated" state in the persistence layer are `[IMPLEMENTATION DETAIL — PHASE 6]`.

### 19.5 Payload Size & Bandwidth Efficiency `[ARCHITECTURE DECISION]`

- API responses must be compact. Avoid deeply nested object inclusion by default; use query parameters to control inclusion depth.
- Map tile loading strategy (e.g., lazy tile loading, lower-resolution tiles for slow connections) is a UX/frontend concern — deferred to Phase 5.
- Pagination defaults must be conservative (max 20-50 results per page, not 500).

---

## 20. OBSERVABILITY

### 20.1 Essential Now `[ARCHITECTURE DECISION]`

| Concern | Current State | Sufficiency |
|---|---|---|
| Request logging | ✅ `requestLoggerMiddleware` — method, path, status, duration | Acceptable |
| Auth audit events | ✅ `AuditLogger` — success, failure, actor, IP | Acceptable |
| Verification audit events | ✅ `AuditLogger.logVerificationReviewed` | Partial — needs more coverage |
| Error logging | ✅ `console.error` in global error handler | Acceptable for development |
| Health check endpoint | ✅ `GET /health` with PostGIS connectivity check | ✅ Good |

### 20.2 Phase 6 Observability Requirements `[ARCHITECTURE DECISION]`

The following are observability requirements for Phase 6. Tool selection within each category is `[UNKNOWN / VALIDATION REQUIRED]` (see DD-13) and must not be treated as committed technology choices:

| Concern | Phase 6 Requirement | Tool Selection |
|---|---|---|
| Structured JSON logging | Replace `console.log/error` with a structured JSON logger | `[UNKNOWN / VALIDATION REQUIRED]` |
| Audit log persistence | Persist audit events to a durable store (database table or external log stream) | `[UNKNOWN / VALIDATION REQUIRED]` (see DD-14) |
| Error tracking | Integrate an error tracking service in production | `[UNKNOWN / VALIDATION REQUIRED]` |
| Metrics | Expose application metrics (request count, latency, error rates) | `[UNKNOWN / VALIDATION REQUIRED]` |
| Distributed tracing | `[ARCHITECTURE HYPOTHESIS]` — Only relevant if multi-service topology is adopted | `[UNKNOWN / VALIDATION REQUIRED]` |
| Health check depth | Add individual module health checks (database, spatial extension, auth store) | `[IMPLEMENTATION DETAIL — PHASE 6]` |
| Business metrics | Domain-specific metrics (observations ingested, verifications completed, etc.) | `[IMPLEMENTATION DETAIL — PHASE 6]` |

### 20.3 Operational Monitoring `[UNKNOWN / VALIDATION REQUIRED]`

Production monitoring infrastructure (e.g., Grafana, Datadog, Uptime Robot) is not yet selected. Provider selection is deferred to Phase 6 / deployment planning.

---

## 21. DEPLOYMENT ARCHITECTURE

### 21.1 Current Deployment State `[ARCHITECTURE FACT]`

```text
Development:
  PostgreSQL 16 + PostGIS 3.4 ─► Docker container (docker-compose.yml)
  WAYNAH API ─────────────────► tsx watch (Node.js dev server, port 3000)
  WAYNAH Web ─────────────────► next dev (Next.js dev server, port 3001/3002)
```

### 21.2 Deployment Boundary Architecture (Target Shape) `[ARCHITECTURE DECISION]`

```text
╔═══════════════════════════════════════════════════════════════╗
║                    PRODUCTION DEPLOYMENT                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  Client (Browser / Mobile Browser)                      │  ║
║  │  • Progressive Web App (mobile-first design)            │  ║
║  └──────────────────────────┬──────────────────────────────┘  ║
║                             │ HTTPS                           ║
║  ┌──────────────────────────▼──────────────────────────────┐  ║
║  │  Web Frontend Deployment                                 │  ║
║  │  (Next.js 16 — static + server rendering)               │  ║
║  │  [ARCHITECTURE HYPOTHESIS: Vercel / VPS / Docker]       │  ║
║  └──────────────────────────┬──────────────────────────────┘  ║
║                             │ HTTPS REST API Calls            ║
║  ┌──────────────────────────▼──────────────────────────────┐  ║
║  │  API Application Server                                  │  ║
║  │  (Hono Node.js — Docker container or VPS process)       │  ║
║  │  [ARCHITECTURE HYPOTHESIS: VPS / Docker + Nginx]        │  ║
║  └──────────────────────────┬──────────────────────────────┘  ║
║                             │ PostgreSQL Protocol             ║
║  ┌──────────────────────────▼──────────────────────────────┐  ║
║  │  PostgreSQL 16 + PostGIS 3.4                             │  ║
║  │  (Managed or Self-Hosted)                                │  ║
║  │  [ARCHITECTURE HYPOTHESIS: DigitalOcean Managed DB /    │  ║
║  │   Self-hosted on VPS / Supabase for managed PostGIS]    │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  Object Storage (Future — Evidence Artifacts)            │  ║
║  │  [UNKNOWN / VALIDATION REQUIRED]                        │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

### 21.3 Deployment Environments `[ARCHITECTURE DECISION]`

Three deployment environments are required. Hosting provider and infrastructure specifics for each environment are `[UNKNOWN / VALIDATION REQUIRED]` (see DD-06, DD-07):

| Environment | Purpose | Database Requirement | Notes |
|---|---|---|---|
| Development | Local development | Docker Compose PostgreSQL with PostGIS and pg_trgm extensions | `NODE_ENV=development` |
| Staging | Pre-production testing | Dedicated PostgreSQL instance with PostGIS and pg_trgm | Must mirror production extensions |
| Production | Live service | PostgreSQL instance with PostGIS and pg_trgm | Durability and backup requirements `[UNKNOWN / VALIDATION REQUIRED]` |

### 21.4 Migration Strategy `[ARCHITECTURE DECISION]`

- Database migrations are managed via **Prisma Migrate**.
- Migrations must be **forward-only** in production (no rollback migrations).
- All migrations must be reviewed for safety before production deployment.
- Migration execution is a distinct deployment step, separate from application deployment.

### 21.5 Secrets Management `[ARCHITECTURE DECISION]`

Current approach: `.env` files. Production requirement: secrets must be managed via a secrets management service (platform-provided environment variables, HashiCorp Vault, or equivalent). `.env` files must never be committed to version control.

### 21.6 Backup & Recovery `[ARCHITECTURE DECISION]`

- PostgreSQL backups are the primary data recovery mechanism.
- Backup frequency and retention policy are `[UNKNOWN / VALIDATION REQUIRED]` — deferred to infrastructure planning.
- Object storage (future) requires its own backup/replication policy.

---

## 22. FAILURE & CONSISTENCY MODEL

| Operation | Transaction Required | Consistency Model | Idempotency/Retry | Failure Strategy |
|---|---|---|---|---|
| Create Place | YES (Place + PlaceLocation) | Strongly consistent | Idempotency mechanism `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Create Business | YES | Strongly consistent | Idempotency mechanism `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Open Branch | YES (Branch + Business link + Place link) | Strongly consistent | Idempotency mechanism `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Move Branch (relocate) | YES (Branch Place link update + history preservation) | Strongly consistent | Must not silently create duplicate location links; exact mechanism `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Submit Claim | YES (Claim + DataSource link) | Strongly consistent | Duplicate claim detection mechanism `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Attach Evidence | YES (Evidence + Claim link) | Strongly consistent | Exact idempotency strategy `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Issue Verification | YES (VerificationRecord + Claim state update) | Strongly consistent | Each verification decision is a new record; no overwrite of prior records | Return error; reviewer retries |
| Detect Conflict | YES (DataConflict record) | Strongly consistent | Exact idempotency strategy `[IMPLEMENTATION DETAIL — PHASE 6]` | If detection fails, observation remains in prior state |
| Merge Duplicate Entities | YES (complex multi-entity transaction) | Strongly consistent | NOT safe to retry without manual review — merge must be explicitly re-submitted | Rollback; admin must review before re-attempting |
| Split Merged Entities | YES (multi-entity transaction) | Strongly consistent | NOT safe to retry without manual review | Rollback; admin must review before re-attempting |
| Discovery Ingestion (new entity) | YES (Observation + Place + PlaceLocation + link) | Strongly consistent | Entity resolution provides deduplication signal; exact idempotency contract `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; ingestion source retries |
| Discovery Ingestion (conflict) | YES (Observation + DataConflict) | Strongly consistent | Exact idempotency strategy `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; ingestion source retries |
| Confidence Score Update | NO | Eventually consistent | Recalculation is deterministic from current state — safe to retry | Deferred retry; non-blocking |
| Search indexing | N/A (PostgreSQL-native) | Immediately consistent post-write | N/A | N/A |
| Notifications | NO | Eventually consistent | Retry with backoff — non-critical, at-least-once delivery | Retry with backoff; non-critical |
| Review Submission | YES | Strongly consistent | Exact idempotency strategy `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| User Contribution | YES | Strongly consistent | Exact idempotency strategy `[IMPLEMENTATION DETAIL — PHASE 6]` | Return error; client retries |
| Session creation | YES | Strongly consistent | Each login produces a distinct session token | Return error; client retries |

---

## 23. ARCHITECTURE DECISION RECORDS

### ADR-001: Modular Monolith as Architecture Style

| Field | Value |
|---|---|
| **Decision** | WAYNAH is a Modular Monolith. |
| **Context** | Small team, early project stage, complex cross-module transactions required by Trust & Provenance model, Yemen network constraints. |
| **Alternatives** | Microservices (rejected — premature), Hybrid extraction (deferred — no demonstrated need yet). |
| **Consequences** | Module isolation must be enforced by code discipline. Future extraction is possible if module interfaces are kept clean. |
| **Status** | `[ARCHITECTURE DECISION]` |
| **Classification** | Core architectural direction |

---

### ADR-002: PostgreSQL/PostGIS as the Single Persistent Data Store

| Field | Value |
|---|---|
| **Decision** | All durable state lives in PostgreSQL 16 + PostGIS 3.4. No supplementary persistent store without demonstrated need. |
| **Context** | PostGIS provides spatial capabilities required for discovery and trust. ACID transactions across domain boundaries are essential. |
| **Alternatives** | Multiple databases per context (rejected — distributed transactions), NoSQL for some entities (rejected — no demonstrated benefit). |
| **Consequences** | All spatial, text, and relational queries execute against one database. Scaling the database is the primary future scaling concern. |
| **Status** | `[ARCHITECTURE DECISION]` |
| **Classification** | Data architecture |

---

### ADR-003: Prisma is Infrastructure, Not Domain Model

| Field | Value |
|---|---|
| **Decision** | Prisma models are persistence representations. Domain entities and business rules are defined in domain service code, not derived from Prisma. |
| **Context** | Phase 3 established 18 canonical domain entities. Prisma schema currently covers a subset. Adding domain entities must not conflate the ORM representation with the domain concept. |
| **Alternatives** | Prisma-as-domain (rejected — violates DDD principles and creates architectural coupling). |
| **Consequences** | Phase 6 must introduce Repository abstractions so domain services do not directly depend on Prisma types. |
| **Status** | `[ARCHITECTURE DECISION]` |
| **Classification** | Domain / infrastructure boundary |

---

### ADR-004: PostgreSQL-Native Search (pg_trgm + PostGIS) — No Dedicated Search Engine

| Field | Value |
|---|---|
| **Decision** | Search remains PostgreSQL-native. No dedicated search engine (Elasticsearch, Meilisearch) at this stage. |
| **Context** | Current `pg_trgm` + `ST_DWithin` implementation is functional and covers primary search intents. External search engine adds infrastructure complexity and sync maintenance. |
| **Alternatives** | Dedicated Arabic search engine (deferred — no measured need). |
| **Consequences** | Arabic morphology limitations and vernacular name matching must be addressed via EntityAlias table in Phase 6. Phone-number search requires contact model schema changes. |
| **Status** | `[ARCHITECTURE DECISION]` |
| **Classification** | Search architecture |

---

### ADR-005: No External Message Queue at This Stage

| Field | Value |
|---|---|
| **Decision** | No external message queue is introduced at this stage. |
| **Context** | Async workloads are not yet implemented. No demonstrated operational need for a queue exists. |
| **Alternatives** | External brokers (deferred — premature); PostgreSQL-backed job queue is a candidate if async needs emerge. Technology selection is `[UNKNOWN / VALIDATION REQUIRED]` (see DD-11). |
| **Consequences** | Background processing, if needed, runs in-process. Multi-instance async coordination will require a shared job store. |
| **Status** | `[ARCHITECTURE DECISION]` |
| **Classification** | Async processing |

---

### ADR-006: No External Cache Layer at This Stage

| Field | Value |
|---|---|
| **Decision** | No Redis or external cache introduced at this stage. |
| **Context** | PostgreSQL performance is adequate at current scale. Geographic reference data can be cached in-process. |
| **Alternatives** | Redis (deferred — conditional on multi-instance deployment and measured latency bottleneck). |
| **Consequences** | Rate limiting is in-process only. If multi-instance deployment is adopted, rate limiting must be redesigned. |
| **Status** | `[ARCHITECTURE DECISION]` |
| **Classification** | Caching |

---

### ADR-007: Session-Token Authentication (Phase 1 Closed)

| Field | Value |
|---|---|
| **Decision** | Authentication uses database-backed session tokens. JWT is NOT used. |
| **Context** | Phase 1 closed this decision. Tokens are cryptographically random (256-bit); sessions are stored in PostgreSQL for immediate revocability. |
| **Alternatives** | JWT (rejected in Phase 1 — revocation complexity). |
| **Consequences** | Every authenticated request hits the database for session validation. Acceptable at current scale. |
| **Status** | `[ARCHITECTURE DECISION]` (Phase 1 closed) |
| **Classification** | Security |

---

### ADR-008: Explicit Evidence Binary / Metadata Separation

| Field | Value |
|---|---|
| **Decision** | Evidence binary artifacts are stored in Object Storage; metadata is stored in PostgreSQL. |
| **Context** | Phase 3 Trust & Provenance model requires immutable evidence records. Binary storage in the database is impractical at scale. |
| **Alternatives** | Store binary artifacts in database as `bytea` (rejected — performance, cost). |
| **Consequences** | Object storage provider must be selected in Phase 6. Evidence access requires signed URL generation. |
| **Status** | `[ARCHITECTURE DECISION]` (Object storage provider is `[UNKNOWN / VALIDATION REQUIRED]`) |
| **Classification** | Evidence / storage |

---

## 24. ARCHITECTURE DIAGRAMS

### Diagram 1: System Context (See Section 6.1)

### Diagram 2: High-Level Container Architecture

```text
╔══════════════════════════════════════════════════════════════════════════╗
║                   CONTAINER ARCHITECTURE                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │  @waynah/web (Container: Next.js 16)                             │   ║
║  │  • Server-side rendering (SSR) + Static Generation (SSG)        │   ║
║  │  • Client-side Leaflet map rendering                            │   ║
║  │  • Calls @waynah/api via HTTPS REST                             │   ║
║  │  • Uses @waynah/shared types + @waynah/ui components            │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │  @waynah/api (Container: Hono Node.js HTTP Server)               │   ║
║  │  • Authentication + Authorization middleware                    │   ║
║  │  • Route handlers (v1/*)                                        │   ║
║  │  • Domain service orchestration                                 │   ║
║  │  • Uses @waynah/database, @waynah/shared                        │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │  @waynah/database (Package — not a separate process)             │   ║
║  │  • Prisma Client + schema                                        │   ║
║  │  • Spatial utility functions (PostGIS wrappers)                 │   ║
║  │  • Type exports                                                  │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │  PostgreSQL 16 + PostGIS 3.4 (Container: database server)        │   ║
║  │  • Primary data store                                            │   ║
║  │  • Spatial queries (PostGIS)                                     │   ║
║  │  • Text similarity (pg_trgm)                                     │   ║
║  │  • Schema managed by Prisma Migrate                              │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║  Shared Packages (consumed, not deployed separately):                    ║
║  @waynah/shared | @waynah/ui | @waynah/config | @waynah/maps (stub)     ║
║  @waynah/search (stub)                                                   ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Diagram 3: Modular Monolith — Module Boundaries

```text
apps/api/src/domain/

┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────────────┐
│   geographic    │  │ place-registry  │  │    operating-presence        │
│                 │  │                 │  │                              │
│ Governorate     │  │ Place           │  │ Business  Branch  Provider   │
│ District        │◄─┤ PlaceLocation   │◄─┤ BusinessMember              │
│ Uzlah/Village   │  │                 │  │ BusinessVerification         │
│ Landmark        │  └────────┬────────┘  └──────────────────────────────┘
└────────┬────────┘           │                           │
         │ DistrictRef        │ PlaceRef                  │ BusinessRef/BranchRef
         │                    │                           │
         ▼                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          trust                                          │
│         Claim  Evidence  VerificationRecord  DataSource                 │
│         ← Owns all provenance; receives references from all modules     │
└─────────────────────────────────────────────────────────────────────────┘
                    │ TrustContext (read)
                    ▼
┌────────────────────────────────────────────────────────┐
│                      search                            │
│  Cross-cutting: consumes Place, Operating Presence,    │
│  Trust context, Geographic to assemble discovery results│
└────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────────────────────┐
│   community     │  │    identity-resolution          │
│                 │  │                                 │
│ Review          │  │ DuplicateCandidate EntityAlias  │
│ UserContribution│  │ Merge/Split operations          │
└─────────────────┘  └─────────────────────────────────┘
```

### Diagram 4: Domain → Application → Infrastructure Dependency Direction

```text
Direction of dependency (→ means "depends on"):

  ┌──────────────────────────────────────────────────┐
  │          PRESENTATION LAYER                       │
  │  (Hono Routes, Next.js Pages, Zod Validators)    │
  └──────────────────────┬───────────────────────────┘
                         │ depends on
  ┌──────────────────────▼───────────────────────────┐
  │          APPLICATION LAYER                        │
  │  (Service Orchestrators, Use Case Coordinators)  │
  └──────────────────────┬───────────────────────────┘
                         │ depends on
  ┌──────────────────────▼───────────────────────────┐
  │             DOMAIN LAYER                          │
  │  (Entities, Domain Rules, Domain Events,         │
  │   Repository Interfaces — no external deps)      │
  └───────────────────────────────────────────────▲──┘
                                                  │ implements
  ┌───────────────────────────────────────────────┴──┐
  │         INFRASTRUCTURE LAYER                      │
  │  (Prisma, PostgreSQL, PostGIS, Object Storage,   │
  │   External APIs — implements domain interfaces)  │
  └──────────────────────────────────────────────────┘
```

### Diagram 5: Data & Provenance Flow `[ARCHITECTURE ILLUSTRATION]`

> This diagram illustrates the conceptual provenance flow from ingestion source through to a Verification Record. Internal field names such as `PlaceObservation`, `status`, and `confidence_score` are implementation-layer identifiers (`[IMPLEMENTATION DETAIL — PHASE 6]`) used to make the illustration concrete; they do not define new Phase 3 domain entities.

```text
┌─────────────┐     ┌───────────────────────────────────────────────────────┐
│  Data Source │──►  │  Raw Ingestion Record [ARCHITECTURE ILLUSTRATION]     │
│  (Gov/Agent/ │     │  • lifecycle state: pending → approved / conflicted  │
│  Owner/User) │     │  • confidence evaluation: deferred or computed        │
└─────────────┘     └──────────────────────┬────────────────────────────────┘
                                           │ Entity Resolution
                                           ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  Canonical Entity (Place / Business / Branch)        │
                    │  ← created or matched via spatial + text resolution  │
                    └──────────────────────┬───────────────────────────────┘
                                           │ Claim submitted for attribute
                                           ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  Claim (Phase 3 Domain Entity)                       │
                    │  • target entity ref                                 │
                    │  • attribute scope (coordinates / phone / name...)  │
                    │  • asserted value                                    │
                    │  • source ref + timestamp                            │
                    └──────────────────────┬───────────────────────────────┘
                                           │ Evidence attached (0..*)
                                           ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  Evidence (Phase 3 Domain Entity)                    │
                    │  • binary artifact locator (object storage)         │
                    │  • collection method + collector + timestamp        │
                    └──────────────────────┬───────────────────────────────┘
                                           │ Reviewer issues decision
                                           ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  Verification Record (Phase 3 Domain Entity)         │
                    │  • attribute scope verified                          │
                    │  • effective date + expiry date                      │
                    │  • reviewer identity                                 │
                    │  • may be superseded by future records over time     │
                    └──────────────────────────────────────────────────────┘
```

### Diagram 6: Geospatial Query Flow `[ARCHITECTURE ILLUSTRATION]`

> Internal service and query names are `[ARCHITECTURE ILLUSTRATION]` — they reflect the current codebase structure and should not be read as locked API contracts.
> Ranking blend formula weights are `[UNKNOWN / VALIDATION REQUIRED]` (see DD-08) and are illustrated here conceptually only.

```text
User Request: "Pharmacies near me" (lat, lng, user-supplied radius)
                              │
                              ▼
       ┌──────────────────────────────────────────────────────┐
       │  Search Application Service [ARCHITECTURE ILLUST.]  │
       │  • Build PostGIS filter:                             │
       │    ST_DWithin(location.geom,                         │
       │      ST_SetSRID(ST_MakePoint(lng, lat), 4326)        │
       │      ::geography, <radius_meters>)                   │
       │  • Apply category filter: WHERE category_id = ...   │
       │  • Compute distance: ST_Distance(location.geom, pt) │
       │  • Compute text relevance: pg_trgm similarity        │
       │  • Blend scores: text_relevance * w1 + proximity * w2│
       │    [weights: UNKNOWN / VALIDATION REQUIRED — DD-08] │
       └──────────────────────┬───────────────────────────────┘
                              │ SQL via database client
                              ▼
       ┌──────────────────────────────────────────────────────┐
       │  PostgreSQL 16 + PostGIS 3.4                         │
       │  places JOIN place_locations ON place_id             │
       │  GiST index scan on place_locations geometry column  │
       │  → returns rows ordered by blended relevance score  │
       └──────────────────────────────────────────────────────┘
```

### Diagram 7: Search Flow (Full Discovery Intent)

```text
                    User Discovery Intent
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
     Name Intent    Proximity Intent    Category Intent
          │                │                    │
          ▼                ▼                    ▼
    pg_trgm           ST_DWithin           category_id
  similarity         radius filter          FK filter
    scoring                │
          │                │
          └────────────────┘
                   │
                   ▼
          Blended Relevance Score
          (text * w1 + proximity * w2)
          [weights are [UNKNOWN / VALIDATION REQUIRED]]
                   │
                   ▼
          ┌─────────────────────────┐
          │  Results Enriched with: │
          │  • Category name (AR)   │
          │  • District name (AR)   │
          │  • Distance in meters   │
          │  • Verification status  │
          └─────────────────────────┘

Future extensions (Phase 6):
  + Phone Intent → contact table lookup
  + Vernacular Intent → entity_aliases lookup
  + Service Intent → service_offerings table
  + Operational state → schedule + status filters
```

### Diagram 8: Async Processing Flow (Current + Future) `[ARCHITECTURE ILLUSTRATION]`

> Service names are `[ARCHITECTURE ILLUSTRATION]`. The future async candidate queue technology is `[UNKNOWN / VALIDATION REQUIRED]` (see DD-11) — a PostgreSQL-backed job store is one candidate.

```text
CURRENT (Synchronous Pipeline) [ARCHITECTURE ILLUSTRATION]:
  Ingestion Request ──► Ingestion Pipeline Orchestrator ──► DB Transaction
      └──► Ingest ──► EntityResolution ──► ChangeDetection ──► ConfidenceEvaluation
                                                               └──► Response to caller

FUTURE (Async Candidates — [ARCHITECTURE HYPOTHESIS]):
  Ingestion Request ──► Core Pipeline (sync) ──► Response
                              │
                              ▼ enqueue deferred work
                     ┌──────────────────────────────────────────────┐
                     │  Job Store [UNKNOWN / VALIDATION REQUIRED]   │
                     │  • confidence re-evaluation job              │
                     │  • duplicate detection job                   │
                     │  • notification dispatch job                 │
                     │  • evidence scan job                         │
                     └──────────────────────────────────────────────┘
                              │
                              ▼ background processing (mechanism TBD)
                     Process job → update DB → emit structured log
```

### Diagram 9: Deployment Boundary

```text
DEVELOPMENT BOUNDARY:
  [Developer Workstation]
  ├── Docker: postgres + postgis (port 5432)
  ├── tsx watch: api server (port 3000)
  └── next dev: web server (port 3001)

PRODUCTION BOUNDARY (Candidate — [ARCHITECTURE HYPOTHESIS]):
  [CDN / Edge]
  └── Static assets (web)

  [Application Host]
  ├── Next.js server (web)
  └── Hono API server (api)
      └── Connected to ──► [Managed PostgreSQL / VPS PostgreSQL]
                           └── With PostGIS extension enabled
                           └── With pg_trgm extension enabled

  [Object Storage — Future]
  └── Evidence binary artifacts (signed URL access only)

  [Secrets Store]
  └── DATABASE_URL, INGESTION_API_KEY, CORS_ORIGIN
      (platform env vars, NOT .env files in production)
```

---

## 25. DEFERRED ARCHITECTURE DECISIONS

The following decisions are explicitly NOT resolved in Phase 4. They require Phase 6 validation, empirical evidence, or governance input:

| # | Deferred Decision | Reason |
|---|---|---|
| DD-01 | Exact Prisma schema for Branch, Provider, ServiceOffering | Phase 6 engineering; requires domain design review |
| DD-02 | Exact Prisma schema for Claim, Evidence, VerificationRecord | Phase 6 engineering; requires trust model design session |
| DD-03 | Exact Prisma schema for Review, UserContribution | Phase 6 engineering |
| DD-04 | Exact Prisma schema for DuplicateCandidate, EntityAlias | Phase 6 engineering |
| DD-05 | Object storage provider selection (R2 / S3 / MinIO) | Cost, connectivity, durability analysis required |
| DD-06 | Production deployment host (Vercel / VPS / DigitalOcean) | Business decision; Yemen connectivity analysis required |
| DD-07 | PostgreSQL hosting (managed vs. self-hosted) | Cost, operational burden, PostGIS support analysis |
| DD-08 | Search ranking formula weights (text vs. proximity vs. recency) | Product empirical tuning; requires user testing |
| DD-09 | Duplicate spatial detection radius thresholds (meters) | Field testing in Hajjah required |
| DD-10 | Arabic morphology / diacritic normalization approach | Requires Arabic NLP evaluation; deferred to search refinement |
| DD-11 | Async job queue technology (pg-boss vs. others) | Deferred until async workloads are implemented |
| DD-12 | External cache provider (Redis / in-process) | Conditional on multi-instance deployment |
| DD-13 | Production monitoring / observability vendor | Infrastructure planning phase |
| DD-14 | Audit log persistence strategy (PostgreSQL table / log service) | Phase 6 operational design |
| DD-15 | Evidence retention / legal deletion policy | Legal/governance input required |
| DD-16 | Map tile provider selection (OpenStreetMap / commercial) | UX/infrastructure decision |
| DD-17 | Claim status dimensional model (exact state machine) | Phase 6 trust engine design |
| DD-18 | Verification expiry periods per attribute type | Policy decision; governance input |
| DD-19 | Session TTL and rotation policy | Phase 6 security review |
| DD-20 | Repository abstraction pattern (DI framework choice) | Phase 6 engineering decision |

---

## 26. RISKS & TRADE-OFFS

### 26.1 High-Risk Architecture Items

| Risk | Classification | Likelihood | Mitigation |
|---|---|---|---|
| `Place.businessId` FK bypasses Branch-as-mediator principle (AI-001) | `[ARCHITECTURE FACT]` — known schema deviation | High (if Branch is added without resolving) | Flag in Phase 6 schema design; evaluate before migration |
| In-memory rate limiter not shareable across instances (AI-004) | `[ARCHITECTURE FACT]` — known single-instance limitation | Medium (only if multi-instance) | Deferred to deployment planning (see DD-12) |
| `VerificationStatus` enum is a simplified proxy for full Trust model (AI-002) | `[ARCHITECTURE FACT]` — known scope limitation | Certain (must be addressed in Phase 6) | Full Claim/Evidence/VerificationRecord model in Phase 6 schema design |
| Domain services directly coupled to Prisma types (AI-005) | `[ARCHITECTURE FACT]` — known structural gap | Medium (testability risk) | Persistence abstraction deferred to Phase 6 (see DD-20) |
| `pg_trgm` has Arabic search limitations (diacritics, morphology) | `[ARCHITECTURE FACT]` — known search constraint | Medium | EntityAlias table for vernacular; normalization for diacritics — deferred to Phase 6 (see DD-10) |
| Session validation requires a database round-trip per request | `[ARCHITECTURE FACT]` — current design trade-off | Low (at current scale) | Acceptable; revisit if per-request latency becomes critical |

### 26.2 Architecture Trade-offs Accepted

| Trade-off | What Is Gained | What Is Sacrificed |
|---|---|---|
| Modular Monolith over Microservices | Simplicity, ACID transactions, lower ops cost | Independent scaling of individual modules |
| PostgreSQL-native search over dedicated engine | Zero infrastructure complexity | Advanced Arabic morphology, faceted search |
| Database-backed sessions over JWT | Immediate revocability, auditability | Statelessness (per-request DB hit) |
| No external async queue | Zero additional infrastructure | Bounded async job sophistication |
| Direct Prisma in domain services (current) | Development velocity | Domain-layer testability in isolation |

---

## 27. VALIDATION PLAN

Before Phase 4 can be declared architecturally validated, the following must be independently verified:

### 27.1 Architecture Review Checklist

- [ ] The Modular Monolith direction has been reviewed and agreed by the project team.
- [ ] The 7 Module Boundaries have been reviewed against the Phase 3 Bounded Context definitions for consistency.
- [ ] Architecture Issues [AI-001] through [AI-005] have been reviewed and accepted as deferred.
- [ ] The `Place.businessId` FK (AI-001) has a confirmed mitigation plan for Phase 6.
- [ ] The PostgreSQL-native search decision has been validated as sufficient for Hajjah-scale launch.
- [ ] The Deployment Architecture candidate has been evaluated against Yemen connectivity requirements.
- [ ] Object storage provider options have been shortlisted for Phase 6 selection.
- [ ] All 20 Deferred Architecture Decisions have been acknowledged by the project team.

### 27.2 Technical Validation Items

- [ ] Verify `pg_trgm` extension is properly enabled in the migration history.
- [ ] Verify `pg_trgm` GIN index exists or is planned for `places.name_ar` and `places.name_en`.
- [ ] Verify PostGIS `ST_DWithin` with `geography` type produces meter-unit distances (not degree-unit).
- [ ] Verify `District.boundary` geometry column is populated with real polygon data before spatial containment queries are used in production.
- [ ] Verify session token entropy is sufficient (256-bit is acceptable).
- [ ] Verify INGESTION_API_KEY is not the default dev value in any staging/production environment.

---

## 28. PHASE 4 EXIT CRITERIA

Phase 4 documentation is prepared and ready for independent architecture review based on the following verified criteria:

- [x] Phase 3 Domain Model V1.2 was fully read before writing any architecture decision.
- [x] Existing codebase was physically inspected (package.json, turbo.json, workspace config, all apps, packages, Prisma schema, routes, middleware, domain services, tests, docker config, env).
- [x] No source code was modified.
- [x] No schema was modified.
- [x] No database was modified.
- [x] No migration was created.
- [x] No dependency was changed.
- [x] No API implementation was changed.
- [x] No UI was changed.
- [x] No Auth/RBAC implementation was changed.
- [x] No Phase 5 work was started.
- [x] No Phase 3 decisions were silently changed.
- [x] Architecture issues detected were recorded as validation issues, not silently resolved.
- [x] Architecture decisions are clearly separated from hypotheses.
- [x] Deferred decisions are explicitly listed (20 items).
- [x] Architecture remains realistic for the current project stage.
- [x] All 25 Phase 4 Core Questions (from the study mandate) are addressed across the document sections.
- [x] All 29 required document sections are present.
- [x] All 9 required conceptual diagrams are present.
- [x] One-Pass Architecture Review & Remediation completed (V1.0-R1).
- [x] Taxonomy updated to `[ARCHITECTURE FACT]` / `[ARCHITECTURE DECISION]` / `[ARCHITECTURE HYPOTHESIS]` / `[UNKNOWN / VALIDATION REQUIRED]` / `[IMPLEMENTATION DETAIL — PHASE 6]` / `[ARCHITECTURE ILLUSTRATION]`.
- [x] Hardcoded ranking weights removed — replaced with `[UNKNOWN / VALIDATION REQUIRED]`.
- [x] Idempotency overclaims corrected — idempotency mechanisms deferred to Phase 6 where unspecified.
- [x] pg-boss commitment removed — replaced with candidate classification.
- [x] TTL values removed from caching table — replaced with `[IMPLEMENTATION DETAIL — PHASE 6]`.
- [x] confidence_score = 0.0 domain leakage corrected — replaced with domain-neutral language.
- [x] Repository Pattern downgraded from Architecture Decision to Architecture Hypothesis.
- [x] Claim → VerificationRecord 1:1 arity corrected — supersession semantics preserved.
- [x] Session TTL (7-day) clarified as observed implementation detail; DD-19 retained.
- [x] Observability tool names downgraded from commitments to `[UNKNOWN / VALIDATION REQUIRED]`.
- [x] Risk table classification corrected — `[ARCHITECTURE FACT]` replacing incorrect `[CONSTRAINT]` / `[ARCHITECTURE DECISION]` labels.
- [x] Diagram 5 and Diagram 6 annotated as `[ARCHITECTURE ILLUSTRATION]`; weight formula removed from Diagram 6.

---

## 29. PHASE 4 STATUS

`PHASE 4 — ONE-PASS REVIEW & REMEDIATION COMPLETE (V1.0-R1)`

> This document has been produced as a single atomic review + remediation pass.
> All architectural overclaims, premature implementation decisions, incorrect taxonomy labels, hardcoded thresholds, and Phase 3 boundary violations found during the review have been corrected directly in this document.
> No source code, schema, migration, dependency, API, authentication, RBAC, UI, Phase 3 document, or Phase 5 work was modified.
> The document is ready for project team review.
