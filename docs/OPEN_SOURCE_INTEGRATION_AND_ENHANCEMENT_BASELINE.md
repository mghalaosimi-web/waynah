# WAYNAH — Open-Source Integration & Product Enhancement Baseline

**Date:** 2026-11-04  
**Status:** Engineering evaluation; no third-party runtime has been added by this document.  
**Product identity:** WAYNAH / وَيْنَه؟ — Calm Local Atlas  
**Pilot geography:** Hajjah Governorate, Yemen  
**Brand token:** `#0F766E`

## 1. Decision

WAYNAH should remain the product, domain model, source of truth, and user experience. Do not replace it with a generic directory, map template, or another project's frontend.

The repository already contains a substantial purpose-built platform: Next.js web application, Hono API, PostgreSQL/PostGIS data model, Arabic-aware search package, place/business/trust/verification domains, user and business flows, administration, and a low-bandwidth list mode. A wholesale replacement would discard product-specific work and increase operational risk.

Adopt a **capability integration** model:
- Keep WAYNAH's existing domain services, API contracts, database, RBAC, trust model, and UI identity authoritative.
- Evaluate external projects as isolated infrastructure/adapters behind WAYNAH-owned interfaces.
- Do not expose an external provider directly to the browser where it bypasses WAYNAH's verification, provenance, moderation, or rate limits.
- Keep imports reviewable and provenance-aware; external observations must never become VERIFIED merely because an upstream source returned them.
- No production database changes, environment changes, deployment, or provider cutover are authorized by this study.

## 2. Candidate projects

| Capability | Candidate | License reported by upstream | Fit | Decision |
|---|---|---|---|---|
| Vector map renderer | [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | BSD-3-Clause | Modern WebGL vector rendering, rich styling and extensibility | **Prototype only.** Keep Leaflet as current renderer until a measured mobile/low-bandwidth comparison and tile/style source are available. |
| Geocoding and autocomplete | [Photon](https://github.com/komoot/photon) | Apache-2.0 | OSM-based search-as-you-type, multilingual support, typo tolerance, location bias, reverse geocoding and tag filters | **Best search-adapter candidate.** Test Arabic/Yemeni names, aliases, transliteration and Hajjah coverage before adoption. Do not depend on the public demo for production traffic. |
| Routing and navigation | [Valhalla](https://github.com/valhalla/valhalla) | MIT | OSM routing, pedestrian/vehicle costing, matrices, isochrones, map matching and offline/regional data options | **Best routing candidate.** Keep as a separately deployable service; assess Yemen road graph completeness and operating cost. |
| Selective OSM data queries | [Overpass API](https://github.com/drolbr/Overpass-API) | AGPL-3.0 | Read-only extraction of selected OSM objects by tags, area and proximity | **Research/import tool only.** Do not make public shared instances a production dependency; review AGPL obligations before self-hosting or modifying. |

These projects are complementary engines, not a complete place-discovery product. None supplies WAYNAH's Yemen-specific administrative hierarchy, local trust, verification workflows, business ownership, moderation, Arabic UX, or product-specific domain model.

## 3. Integration boundaries

### Map rendering
- Preserve the existing map abstraction in `apps/web/lib/maps`.
- Build a separate MapLibre proof-of-concept without removing Leaflet.
- Compare first-load bytes, time-to-interactive, pan/zoom responsiveness, memory, low-end Android behavior, accessibility, and offline/list fallback.
- Require an approved vector-tile source and explicit attribution before any production switch.

### Search and geocoding
- Keep `@waynah/search` and WAYNAH API search as the authoritative query path.
- Add an optional server-side geocoder adapter only after contract tests establish normalization, ranking, language, bounds, and failure behavior.
- Treat Photon/OSM results as external observations with source ID, source URL, retrieval timestamp, license/attribution metadata, and confidence; send them through WAYNAH's ingestion and conflict-resolution pipeline.
- Never silently overwrite curated or VERIFIED records.

### Routing
- Define a WAYNAH-owned route-provider interface first.
- Valhalla must be isolated behind the API; do not leak provider credentials or provider response formats into the client.
- Validate routing coverage, access restrictions, road class, ferry/seasonal routes, and safe handling of missing or uncertain Yemeni road data.
- Keep a non-routing directions fallback and list-first UX when route service is unavailable.

### OSM data and legal provenance
- Preserve required OpenStreetMap attribution.
- Review ODbL obligations for imported/derived databases and maintain source-level provenance.
- Verify each upstream repository's current LICENSE file and version at the exact commit before vendoring or redistributing code.
- Keep upstream notices and license texts; document modifications and pinned revisions.
- Avoid bulk use of public demo endpoints for production workloads; assess self-hosting and capacity separately.

## 4. Current repository findings confirmed from `main`

1. Main branch baseline at audit time: `cfbb8bd5e5e7ce565480e3ffa8c154c4d848600a`.
2. Workspace includes `apps/web`, `apps/api`, and packages for database, search, shared contracts, UI and configuration; `packages/maps` is a shared source directory rather than a declared workspace package.
3. The map uses Leaflet and CARTO Voyager raster tiles; attribution is rendered in the map component.
4. The map's previous default center was Riyadh (24.7136, 46.6753), inconsistent with WAYNAH's Yemen scope and Hajjah pilot. This branch changes the default focus to Hajjah city (15.69425, 43.60582) and uses a closer zoom only when valid coordinates are explicitly supplied in the URL.
5. The places page described the platform as a guide in "the Kingdom"; this branch corrects the scope to Yemen.
6. Several package lint scripts are placeholders that print success rather than execute lint analysis. A green lint command therefore cannot be treated as proof of lint compliance.
7. The public production API has two recorded blockers: database connectivity/datasource validation (Issue #5) and missing allowed-origin response for the real web origin on CORS preflight (Issue #9).
8. Draft PR #8 improves the public health payload so disconnected database state is reported as `degraded` and internal Prisma diagnostics are not exposed. Its CI is reported green, but production database connectivity remains unresolved and preview verification is blocked by Vercel SSO.
9. Production migration application state is explicitly unverified while the database connection is failing. Repository migration files are not proof that production migrations were applied.

## 5. Ordered execution plan

| Order | Workstream | Exit condition |
|---|---|---|
| 0 | Preserve baseline and isolate work | All changes remain on feature branches; no direct main writes. |
| 1 | Production truth and API recovery | Owner verifies the intended database connection in the hosting dashboard; database health and safe read-only endpoint are confirmed; CORS preflight allows only approved origins. |
| 2 | Workspace quality gate | Replace placeholder lint scripts with real linting; CI runs typecheck, tests, lint and build. |
| 3 | Product UI audit and identity system | Route inventory, responsive review, RTL, keyboard/accessibility, loading/error/empty states and brand tokens are checked page by page. |
| 4 | MapLibre visual prototype | Side-by-side comparison against Leaflet using the same WAYNAH data and brand; no production cutover without measured win. |
| 5 | Photon geocoding adapter spike | Arabic/Yemeni search benchmark on curated test cases; provenance and confidence flow into WAYNAH. |
| 6 | Valhalla routing spike | Hajjah route coverage and realistic pedestrian/vehicle route validation; infrastructure and data refresh plan documented. |
| 7 | Controlled rollout | Reviewed PRs, passing CI, owner-approved production configuration and post-deployment smoke tests. |

## 6. Blocker register

| ID | Blocker | Evidence / owner action | Work that can continue |
|---|---|---|---|
| WAYNAH-BLK-01 | Production database connection unavailable | GitHub Issue #5; owner must validate production DATABASE_URL/DIRECT_URL in Vercel using the approved credential source. Never paste secrets into chat or GitHub. | UI, code, tests, docs, local isolated DB work. |
| WAYNAH-BLK-02 | Production CORS allowlist does not emit allow-origin for the web origin | GitHub Issue #9; verify exact production CORS_ORIGIN in Vercel and confirm trusted and untrusted preflight behavior. | CORS unit tests, documentation, non-production review. |
| WAYNAH-BLK-03 | Lint commands are placeholders | GitHub Issue #10; add real ESLint/TypeScript lint configuration and required CI step in a dedicated PR. | Typecheck, tests, build, static review. |
| WAYNAH-BLK-04 | Vercel SSO blocks unauthenticated preview verification | PR #8 preview cannot be treated as publicly verified until owner-authorized access is available. | CI verification and code review; defer live browser acceptance. |
| WAYNAH-BLK-05 | Third-party map/search/routing data quality and hosting not yet proven for Yemen | Requires a controlled Hajjah benchmark and hosting/cost review. | Build adapters and isolated prototypes without changing production providers. |

## 7. Non-negotiable safety rules

- No direct commits to `main`; use feature branches and reviewed pull requests.
- No force pushes, destructive resets, schema changes, production migrations, secret changes, DNS changes, or production deployments without explicit owner approval.
- No fabricated places, boundaries, roads, ratings, operating hours, or verification states.
- No third-party result may bypass WAYNAH provenance, moderation, trust, or audit logic.
- Do not claim a build, browser test, production health, or deployment succeeded unless its exact result is observed.
- Keep the public experience Arabic-first, RTL-correct, mobile-first, accessible, and usable in low-bandwidth mode.
