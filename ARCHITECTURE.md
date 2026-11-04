# 📐 WAYNAH System Architecture & Engineering Specification

> **Document Status**: Architecture Reference — operational readiness is tracked separately  
> **Release Baseline**: v0.12.0  
> **Platform Name**: WAYNAH / وَيْنَه؟  
> **Lead Architecture**: M.GH.AL  
> **Audit Status**: Architecture reference retained; production operational verification OPEN (Issue #5)  

---

## 1. Executive Summary & Stack Verification

**WAYNAH / وَيْنَه؟** is an enterprise location discovery, spatial directory, and trust verification platform for Yemen.

The system is structured as a monorepo managed by **Turborepo v2.4.4** and **pnpm v12.8.1 workspaces**.

### Empirically Verified Technology Stack:
- **Monorepo Manager**: Turborepo `v2.4.4` + pnpm Workspaces `v12.8.1`
- **Frontend App (`apps/web`)**: Next.js `v16.3.6` (App Router), React `v19.3.0`, Tailwind CSS `v4.3.3`, Leaflet `v1.9.4`
- **API Gateway (`apps/api`)**: Hono Core `v4.13.10`; the production entry exports the Hono app for Vercel's native Node.js request handling
- **Database ORM (`packages/database`)**: Prisma ORM `v6.4.1` with `@prisma/client` `v6.4.1`
- **Database Engine (Production)**: Supabase Managed PostgreSQL `17.x` + PostGIS `3.3.7` + `pg_trgm` `1.6`
- **Database Engine (Local Docker)**: PostgreSQL `16` (`postgis/postgis:16-3.4-alpine`)
- **Runtime Language**: TypeScript `v5.8.2`
- **Test Framework**: Vitest `v5.0.2`; PR #6 was independently verified at 628 tests (609 API + 19 Search), not a production-readiness signal

---

## 2. Monorepo Workspace Topology

The repository contains 7 packages total across `apps/*` and `packages/*`. Workspace boundaries are explicitly defined by `package.json` manifests:

```text
waynah (Monorepo Root)
 │
 ├── apps/ (Executable Applications)
 │   ├── api/                    # Workspace Package: @waynah/api (Hono REST Gateway)
 │   └── web/                    # Workspace Package: @waynah/web (Next.js 16 App Router)
 │
 ├── packages/ (Workspace Packages)
 │   ├── database/               # Workspace Package: @waynah/database (Prisma ORM & Migrations)
 │   ├── search/                 # Workspace Package: @waynah/search (Arabic Normalization & Fuzzy Search)
 │   ├── shared/                 # Workspace Package: @waynah/shared (Types, Schemas, RBAC Permissions)
 │   ├── ui/                     # Workspace Package: @waynah/ui (Primitive UI Component System)
 │   ├── config/                 # Workspace Package: @waynah/config (Shared TSConfig / ESLint Rules)
 │   └── maps/                   # Source Directory (Leaflet Markers & Cluster Helpers; no package.json manifest)
 │
 └── docs/                       # Formal Specification Studies & Architectural Specs
```

> **Topology Note**: `packages/maps` is a shared source directory containing Leaflet map markers and clustering utilities consumed directly by `apps/web`. It does not contain an independent `package.json` manifest and is therefore not an isolated pnpm workspace package.

---

## 3. Database Architecture & Migrations

- **Database Engine**: PostgreSQL 17 (Production Supabase) / PostgreSQL 16 (Local Docker Container).
- **Spatial Extension**: PostGIS (`geography` type extension).
- **Fuzzy Search Extension**: `pg_trgm` (PostgreSQL Trigram Matching).
- **Repository Migration Inventory**: 17 migration directories are present under `packages/database/prisma/migrations`. The currently applied production migration state is **unverified** while the production database connection is failing (Issue #5).

### Schema Migration Files Present (17; production application state unverified):
1. `0_init_baseline`
2. `0_init_extensions`
3. `20260929233000_client_favorites_and_requests`
4. `20260929235000_business_domain_foundation`
5. `20260930000000_business_verification_foundation`
6. `20260930010000_administrative_boundaries_postgis`
7. `20260930_geographic_data_foundation`
8. `20261002000000_branch_claiming_persistence`
9. `20261002230000_slice_5b_account_tokens_and_email_verification`
10. `20261003000000_slice_6b_business_invitations`
11. `20261005000000_add_description_to_place_observation`
12. `20261005003000_catalog_and_transaction_subsystem`
13. `20261005010000_phase8_slice9_trust_verification_reviews`
14. `20261005020000_phase9_unit_a_duplicate_candidates`
15. `20261005030000_phase10_unit_b_notifications`
16. `20261005040000_phase10_persistent_audit_trail`
17. `20261007000000_phase11_search_indexes`

---

## 4. Spatial Model & Boundary Validation

Spatial relationships in WAYNAH leverage PostGIS native geography types:

1. **District Boundary (`District.boundary`)**: Stored as `geography(MultiPolygon, 4326)` with a GiST spatial index.
2. **Place Coordinates (`PlaceLocation.geom`)**: Stored as `geography(Point, 4326)` with a GiST spatial index.

### Spatial Resolution & Integrity Enforcement:
Spatial resolution is implemented in `GeographySpatialResolutionService` (`apps/api/src/domain/geography/geography-spatial-resolution.service.ts`):

- **Primary Path**: Executes raw PostGIS query using `ST_Covers(d.boundary, ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))` to determine the authoritative District covering the point.
- **Fallback Path**: Executes `ST_DWithin` on `place_locations.geom` to find the nearest place within radius.
- **Validation Policy**: If caller supplies a `callerDistrictId` that conflicts with PostGIS polygon resolution, the service raises a `GeographicContextMismatchError` returning error code `GEOGRAPHIC_CONTEXT_MISMATCH` (HTTP 400).

---

## 5. Trust, Ingestion & Status Architecture

WAYNAH does not collapse status attributes into a single hypothetical enum. Instead, statuses are strictly scoped per domain model in `schema.prisma`:

### Domain Status Enums:
- **`Place.verificationStatus` (`VerificationStatus`)**:
  - `UNVERIFIED`: Unverified location candidate discovered via ingestion or observation.
  - `VERIFIED`: Administrative location verified by system operators.
  - `CLAIMED`: Verified branch linked to a verified business profile.
  - `REPORTED`: Flagged for data conflict or inaccuracy.
  - `CLOSED`: Place confirmed permanently closed.
- **`BusinessVerification.status` (`BusinessVerificationStatus`)**:
  - `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`.
- **`BranchClaim.status` (`BranchClaimStatus`)**:
  - `PENDING_REVIEW`, `PENDING_DISPUTE`, `APPROVED`, `REJECTED`, `CANCELLED`.
- **`DuplicateCandidate.status` (`DuplicateCandidateStatus`)**:
  - `PENDING`, `MERGED`, `IGNORED`.

### Ingestion & Deduplication Pipeline:
1. **Raw Ingestion (`PlaceObservation`)**: Stores location data points from raw data sources (`DataSource`) with confidence score (`confidenceScore`) and source weight (`reliabilityWeight`).
2. **Duplicate Candidate Detection (`DuplicateCandidate`)**: Records potential duplicates with score `candidateScore` and match reasons (`matchReasons` JSON payload).
3. **Data Conflict Engine (`DataConflict`)**: Stores conflicts between base observations and conflicting data points for admin resolution (`GET /v1/admin/conflicts`, `POST /v1/admin/conflicts/:id/resolve`).

---

## 6. Arabic Search & Ranking Architecture (`@waynah/search`)

The search engine consists of three modular subsystems:

1. **Orthographic Normalization (`@waynah/search/normalization`)**:
   - Tashkeel / diacritic removal.
   - Alef normalization (`أ`, `إ`, `آ` ➔ `ا`).
   - Teh Marbuta normalization (`ة` ➔ `ه`).
   - Alef Maksura normalization (`ى` ➔ `ي`).
   - Extraction of administrative geographic stopwords (`محافظة`, `مديرية`, `عزلة`, `شارع`).
2. **Spatial & Trigram Query Engine**:
   - `pg_trgm` trigram similarity matching on place and category names.
   - PostGIS distance calculation (`ST_Distance`) when user coordinates are provided.
3. **Multi-Factor Ranking (`@waynah/search/ranking`)**:
   - Computes weighted score combining trigram text match score, distance penalty, and verification status boost (`VERIFIED` and `CLAIMED` places receive priority in ranking).

---

## 7. Authentication & RBAC Policy

### Authentication Mechanism:
- **Session Tokens**: Authenticated user sessions are stored in the PostgreSQL database in the `Session` model (`Session.token`, `Session.expiresAt`, `Session.userId`).
- **Credential Transports**: Handled via `Authorization: Bearer <token>`, `X-API-Key` header, or `waynah_session` HTTP cookie.
- **System Ingestion Key**: Authenticates automated ingestion services via `ingestionApiKey` matching.

### Role-Based Access Control (RBAC):
- **User Identity Roles**: `SUPER_ADMIN`, `ADMIN`, `USER`, `BUSINESS_OWNER`, `BUSINESS_MANAGER`, `SYSTEM_SERVICE`.
- **Business Member Roles (`BusinessRole`)**: `OWNER`, `MANAGER`, `MEMBER`.
- **Fine-Grained Permissions**: Evaluated via permission keys defined in `@waynah/shared/src/constants/permissions.ts` (e.g. `place.read`, `place.create`, `admin.audit.read`, `admin.branch_claims.review`, `admin.duplicates.manage`).

---

## 8. Persistent Audit Trail (`AuditLog`)

Every administrative moderation event, authentication lifecycle change, and branch linking operation is persisted to the `AuditLog` table via `AuditLogger` (`apps/api/src/utils/audit-logger.ts`):

- **Logged Fields**: `eventType`, `action`, `method`, `path`, `ip`, `actorId`, `actorType`, `actorRole`, `resourceType`, `resourceId`, `businessId`, `placeId`, `metadata` (JSON).
- **Sanitization Policy**: Password hashes, session secrets, and authorization tokens are explicitly sanitized prior to audit storage.
- **Audit REST Endpoint**: Accessible to administrators with `admin.audit.read` permission via `GET /v1/admin/audit-logs`.

---

## 9. Production & Verification Status

**Operational snapshot: 4 November 2026.** This architecture document describes the intended system design. It does not certify current production readiness.

### Production Infrastructure:
- **Web App (`waynah`)**: Vercel production deployment READY on commit `f7076553162d135bed3dfeed350e2d2d45e3e468`. The homepage and login route rendered in the latest browser smoke test, but the homepage showed a search-failure fallback.
- **API Server (`waynah-api`)**: Vercel production deployment READY on main commit `8bf75bba8d9c13f00d722bcb217aa851d2d58835`. `/health` returned HTTP 200 while `database.connected=false`; `/v1/search` and `/v1/search/categories` returned HTTP 500 due to Prisma datasource validation failure.
- **Database**: The intended architecture is Supabase PostgreSQL + PostGIS. Current production connectivity is unavailable because Prisma rejects the effective datasource URL. Production schema/migration application state and PostGIS query health cannot currently be verified.
- **Public Launch Status**: **BLOCKED (P0)** until Issue #5 is resolved and live database-backed smoke tests pass.

### Verification Benchmark Metrics:
- **PR #6 isolated checks**: Frozen install passed; TypeScript 10/10 tasks; API tests 609/609 (49 files); Search tests 19/19 (3 files); workspace build 6/6 tasks and 28/28 Next.js pages.
- **Lint**: Not verified; package lint scripts are `echo` placeholders and are not real lint checks.
- **Preview verification**: API preview is READY but its live route is protected by Vercel SSO; live HTTP verification remains incomplete. PR #6 remains Draft and unmerged.
- **Production verification**: Search/categories are failing; a successful build or READY deployment must not be interpreted as a successful end-to-end release.
- **Migration verification**: 17 migration directories are present in source; current production application state remains unverified until the approved database connection is restored.

---

## 10. Future Vision & Deferred Systems

To ensure absolute factual integrity, deferred components are explicitly marked:

- **Current (Implemented)**: Next.js 16 Web App, Hono REST API, Supabase PostgreSQL 17 + PostGIS, Prisma 6.4.1, Arabic Fuzzy Search Engine, PostGIS Boundary Resolution, Branch Claiming, Duplicate Moderation, RBAC, Persistent Audit Trail.
- **Validated / Provisioning Ready (Deferred)**: Redis Queue System (`docker-compose.prod.yml` topology), BullMQ background workers, WhatsApp/SMS API notification dispatchers.
- **Exploratory / Future Vision (Unimplemented)**: Offline PWA Tile Caching, Expo React Native Mobile Applications, pgvector AI Semantic Location Assistant, Merchant Payment Gateway Integrations.

---

<div align="center">
<b>WAYNAH ARCHITECTURE SPECIFICATION — DESIGN REFERENCE; PRODUCTION VERIFICATION OPEN</b>  
<i>Engineered by M.GH.AL</i>
</div>
