# WAYNAH — PRODUCTION OPERATIONAL & ROLLBACK RUNBOOK

> **Platform Identity**: WAYNAH / وَيْنَه؟  
> **Lead Architecture**: M.GH.AL  
> **Document Status**: Production Operational Runbook (Phase 12 Hardening)  
> **Target Release**: WAYNAH v0.12.0 Production  

---

## 1. Production Topology & Architecture

WAYNAH operates on an N-tier decoupled serverless architecture:

```
[ Browser Client ]
       │
       ├─────────────────────────────────────────┐
       ▼ (HTTPS)                                 ▼ (HTTPS)
[ Web Frontend: Next.js 16 ]               [ API Serverless: Hono ]
https://waynah.vercel.app                  https://waynah-api.vercel.app
(Vercel Edge Platform)                     (Vercel Serverless Node)
       │                                         │
       │ API Requests (NEXT_PUBLIC_API_URL)      │ Prisma ORM + PostGIS
       └────────────────────────────────────────►│
                                                 ▼
                                        [ Supabase PostgreSQL ]
                                        (PgBouncer Pooler :6543)
```

### Component Summary:
- **Web Frontend (`@waynah/web`)**: Next.js 16 App Router hosted on Vercel (`https://waynah.vercel.app`).
- **Production API (`@waynah/api`)**: Hono Node.js serverless app hosted on Vercel (`https://waynah-api.vercel.app`).
- **Database Subsystem**: PostgreSQL 16 with PostGIS 3.4 extensions hosted on Supabase (`aws-0-ap-south-1.pooler.supabase.com`), accessed via PgBouncer pooled port `:6543`.

---

## 2. Environment Variables Matrix

### A. Web Frontend (`apps/web/.env.production`)
| Variable Name | Production Value | Scope | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://waynah-api.vercel.app` | Build-time (Client) | Base URL for API client fetches in browser. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jtltakhmgsptnjxymdmm.supabase.co` | Build-time (Client) | Supabase project endpoint for OAuth. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Public Anon Key)* | Build-time (Client) | Supabase anonymous client key. |

### B. Production API (`apps/api`)
| Variable Name | Production Value / Pattern | Scope | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | `postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true` | Runtime (Server) | Transaction-pooled connection string. |
| `DIRECT_URL` | `postgresql://...@...pooler.supabase.com:5432/postgres` | Runtime (Migration) | Direct database connection string. |
| `INGESTION_API_KEY` | *(High-Entropy Secret)* | Runtime (Server) | System-to-system ingestion key. |
| `CORS_ORIGIN` | `https://waynah.vercel.app` | Runtime (Server) | Restricts allowed browser cross-origin calls. |

*Note: `sb_secret_` or `service_role` keys are strictly prohibited in browser-accessible client bundles.*

---

## 3. Standard Deployment Procedure

1. **Pre-Deployment Local Verification**:
   ```bash
   # Run full typecheck across monorepo
   pnpm typecheck

   # Run API integration test suites
   pnpm --filter @waynah/api test

   # Build web application locally to verify client bundle static compilation
   pnpm --filter @waynah/web build
   ```

2. **Git Deployment Trigger**:
   - Deployments to Vercel production are automatically triggered upon pushing commits to the `main` branch:
   ```bash
   git add .
   git commit -m "feat/fix: <description>"
   git push origin main
   ```

3. **Post-Deployment Live Verification Probes**:
   - Probe API Health:
     ```bash
     curl -i https://waynah-api.vercel.app/health
     ```
     *Expected Response*: `{"success":true,"data":{"status":"ok","database":{"connected":true...}}}` (HTTP 200).
   - Probe Web Origin:
     ```bash
     curl -i https://waynah.vercel.app
     ```
     *Expected Response*: HTTP 200 HTML response.

---

## 4. Emergency Production Rollback Runbook

If a critical failure occurs post-deployment (e.g., HTTP 5xx errors, regression in auth flows, or broken API bundle), execute one of the following rollback mechanisms immediately:

### Option A: Instant Vercel Platform Rollback (Recommended - Sub-Minute Recovery)
1. Log into Vercel Dashboard at `https://vercel.com/mghalaosimi-web/waynah`.
2. Navigate to **Deployments**.
3. Locate the last known good deployment (e.g., Commit `7f69580`).
4. Click the `...` menu icon on the target deployment card and select **Promote to Production**.
5. Alternatively, via Vercel CLI:
   ```bash
   npx vercel rollback <deployment-id-or-url>
   ```

### Option B: Git Revert Rollback
If source code changes must be reverted in git:
1. Revert the problematic commit:
   ```bash
   git revert <bad-commit-hash>
   ```
2. Push the revert commit to trigger an automated production build:
   ```bash
   git push origin main
   ```

---

## 5. Interactive Google OAuth Human QA Protocol

Because automated E2E testing cannot simulate interactive multi-factor Google credentials without violating Google security policies, human QA testing must execute the following protocol:

### Step-by-Step QA Protocol:
1. Open an incognito browser window and navigate to `https://waynah.vercel.app/login`.
2. Open Browser Developer Tools (`F12`) -> **Console** and **Network** tabs.
3. Click the **"تسجيل الدخول بواسطة Google"** button.
4. Verify browser redirects to `https://accounts.google.com/v3/signin/...`.
5. Enter valid Google account credentials and grant access.
6. Verify OAuth redirect returns to `https://waynah.vercel.app/callback?code=<auth_code>`.
7. Verify page executes PKCE code exchange via Supabase JS SDK.
8. Verify client sends access token to `POST https://waynah-api.vercel.app/v1/auth/google`.
9. Verify API responds with HTTP 200 and establishes `waynah_session` cookie.
10. Confirm automatic navigation to `/dashboard` with valid user profile data.
11. Inspect browser console: Confirm ZERO `Forbidden use of secret API key` or `sb_secret_` warnings appear.

---

## 6. Safety Invariants & Non-Negotiables

- **No Database Resets in Production**: `prisma migrate reset` or `prisma db push --force-reset` are strictly prohibited in production.
- **Additive Migrations Only**: Schema changes must be strictly non-destructive and backward compatible.
- **Sanitized Error Logging**: Stack traces and infrastructure file paths must never be exposed to clients.
- **Closed Slice Protection**: Auth/RBAC, Geography, Business/Catalog, Transactions, Fulfillment, Trust/Verification, Data Ops, Moderation, and Exceptions subsystems remain locked and protected from unapproved refactoring.

---

<div align="center">
<b>WAYNAH Production Operational Runbook · Phase 12 Hardened</b>
</div>
