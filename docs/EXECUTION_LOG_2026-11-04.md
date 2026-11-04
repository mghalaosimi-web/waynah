# WAYNAH — Execution Log

**Date:** 2026-11-04  
**Repository:** `mghalaosimi-web/waynah`  
**Baseline branch:** `main`  
**Baseline commit verified at start and during final review:** `cfbb8bd5e5e7ce565480e3ffa8c154c4d848600a`

## Execution policy

- All implementation work is isolated in feature branches and draft pull requests.
- No direct changes to `main`.
- No production deployment, secret/environment change, DNS change, database schema change, or production migration was performed.
- No unverified external place or road data was promoted to VERIFIED.
- GitHub Actions results are reported only for the exact commit tested. A green CI run is not a substitute for live preview or production verification.

## Work completed in draft pull requests

| PR | Scope | Exact head commit | GitHub Actions |
|---|---|---|---|
| [#8](https://github.com/mghalaosimi-web/waynah/pull/8) | Health endpoint reports degraded state when database is disconnected and avoids leaking internal Prisma diagnostics | `7664bab41d89a750b7b13d537c1ce4d9a555c806` | Existing draft baseline; preview acceptance remains blocked by protected access |
| [#11](https://github.com/mghalaosimi-web/waynah/pull/11) | Yemen/Hajjah map defaults, URL coordinate validation, API-backed public places directory, production mock-data guard, integration/licensing baseline | `84611e5433441d4567c6cfaf428afa278ee22c44` | Passed: install, TypeScript, API tests, search tests, production build |
| [#13](https://github.com/mghalaosimi-web/waynah/pull/13) | CORS allowlist hardening; canonical production web origin is retained when extra origins are configured | `8368b83750126eebb951b203dd61755bc3b9fba9` | Passed: install, TypeScript, API tests, search tests, production build |
| [#14](https://github.com/mghalaosimi-web/waynah/pull/14) | Protected, privacy-minimized operational analytics endpoint and dashboard using existing tables | `cf47e77bfa2e0a753fb1c98b34117f5fdf3de9e2` | Passed: install, TypeScript, API tests, search tests, production build |
| [#15](https://github.com/mghalaosimi-web/waynah/pull/15) | Protected, read-only, filtered and paginated admin place list with history links | `06e2565fe713a8ba1574064e06271e2026824a99` | Passed: install, TypeScript, API tests, search tests, production build |
| [#17](https://github.com/mghalaosimi-web/waynah/pull/17) | Read-only category hierarchy browser and truthful street-network readiness page | `078a31b4a57c523d783af7ecfb0338401ff4bab3` | Passed: install, TypeScript, API tests, search tests, production build |

All five pull requests remain Draft. None has been merged or deployed.

## Open blockers and tracked work

| Issue | Blocker | What is still required |
|---|---|---|
| [#5](https://github.com/mghalaosimi-web/waynah/issues/5) | Production database connectivity / datasource configuration is not verified | Owner must inspect the production database URL and connection mode in the hosting dashboard using the authorized secret source. Do not paste secrets into GitHub or chat. Verify a safe read-only health query after correction. |
| [#9](https://github.com/mghalaosimi-web/waynah/issues/9) | Production CORS preflight was missing the canonical web origin | PR #13 fixes the configuration logic, but the deployed response remains unverified until an authorized deployment and OPTIONS preflight test are possible. |
| [#10](https://github.com/mghalaosimi-web/waynah/issues/10) | Workspace lint commands are placeholders; the lockfile does not currently contain a complete ESLint toolchain | Add pinned lint tooling/configuration and update the pnpm lockfile in an environment that can run and verify the package-manager install. Do not replace lint with another success-printing placeholder. |
| [#12](https://github.com/mghalaosimi-web/waynah/issues/12) | Admin completeness | PR #14 covers analytics and PR #15 covers read-only place listing. Category CRUD, parent-cycle validation, in-use deletion protection, audit logging, and full place edit/moderation workflows remain. |
| [#12](https://github.com/mghalaosimi-web/waynah/issues/12) | Route-tree hygiene | Verify whether the empty `apps/web/app/(public)/page.tsx` and secondary `apps/web/src/app/` tree are legacy/unreferenced before any removal or consolidation. |
| [#16](https://github.com/mghalaosimi-web/waynah/issues/16) | Geospatial provider integration | Run a curated Hajjah benchmark for MapLibre vs Leaflet, Photon Arabic/Yemeni search, and Valhalla routing/road coverage. Keep current providers until measurable improvement is proven. |

## Hosting / preview blocker

Vercel's GitHub integration reported `api-deployments-free-per-day` and “more than 100” deployments, with a retry window of 24 hours. This prevents a new Vercel preview deployment and visual browser acceptance for the current PRs.

This is a hosting quota failure, not evidence that the application build failed: GitHub Actions production builds passed on the exact commits listed above. No alternate production deployment was attempted.

## Open-source integration decision

- **OpenMapX** is the closest full-platform architectural reference, but it is a young, low-adoption project and has AGPLv3 licensing (the project site describes AGPL-3.0-or-later; confirm the exact expression before reuse). It is not adopted wholesale.
- **MapLibre GL JS** is the vector-renderer prototype candidate; Leaflet remains active.
- **Photon** is the geocoding/autocomplete adapter candidate; Arabic/Yemeni coverage must be benchmarked.
- **Valhalla** is the routing-engine candidate; Yemen road coverage and hosting requirements must be proven.
- **LeadForge** and **Mapforge** are UI/interaction references only; neither replaces WAYNAH's trusted directory, administrative hierarchy, verification or moderation model.
- Keep WAYNAH's own database, API contracts, PostGIS geography, trust rules, Arabic RTL UX and brand identity authoritative.

See [OPEN_SOURCE_INTEGRATION_AND_ENHANCEMENT_BASELINE.md](./OPEN_SOURCE_INTEGRATION_AND_ENHANCEMENT_BASELINE.md) for the detailed capability and license comparison.

## Next execution sequence

1. Wait for Vercel's deployment quota window to reset; do not bypass the limit by repeatedly triggering deployments.
2. Generate previews for the five draft PRs and run responsive browser acceptance on desktop and low-end Android.
3. Verify `/places`, `/map`, `/admin/analytics`, `/admin/places`, `/admin/categories`, and `/admin/streets` against real API data.
4. Verify CORS with allowed and disallowed OPTIONS preflights.
5. Resolve production database connectivity through the authorized hosting configuration path; verify health and read-only API behavior.
6. Review and merge each PR separately only after CI and preview acceptance.
7. Continue category CRUD, full place moderation, route-tree cleanup, and the Hajjah geospatial benchmark.
