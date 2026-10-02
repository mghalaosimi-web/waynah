# WAYNAH — PHASE READINESS MATRIX (PHASES 0–12)

> **نوع الوثيقة:** مصفوفة الجاهزية التنفيذية للمراحل الـ 13 لمشروع WAYNAH (`Phase Readiness Matrix`).  
> **تاريخ الإصدار:** 1 أكتوبر 2026  
> **حالة الوثيقة:** **`STATUS: READY WITH CONDITIONS`**  
> **المرجع الرئيسي:** [WAYNAH_BUILD_SPECIFICATION.md](file:///f:/waynah/docs/WAYNAH_BUILD_SPECIFICATION.md)  
> **العلامة البرمجية للمشروع:** `M.GH.AL` | **النطاق التجريبي المرجعي:** محافظة حجة – الجمهورية اليمنية.

---

## 1. Executive Matrix Summary (ملخص مصفوفة الجاهزية للمراحل)

تستعرض هذه المصفوفة التقييم التفصيلي لمدى جاهزية كل مرحلة تنفيدية من **Phase 0 إلى Phase 12** للدخول الفعلي في التنفيذ البرمجي. 

تُصنف كل مرحلة إلى واحدة من الحالات الثلاث:
* **`IMPLEMENTATION-READY`**: مكتملة التحديد والقرارات ويمكن البدء فيها فوراً دون أي تخمين.
* **`READY WITH DEFERRED DESIGN`**: جاهزة للتنفيذ مع وجود خيارات تفصيلية مؤجلة لا تعطل البدء بالمرحلة.
* **`BLOCKED BY GAP`**: محظورة لوجود فجوة أو تعارض يمنع التنفيذ الآمن (عدد المراحل المحظورة: **0**).

---

## 2. Phase Readiness Detailed Matrix (المصفوفة التفصيلية)

### Phase 0: Repository & Environment Baseline
* **Objective:** تثبيت بيئة Monorepo والتحقق من التبعيات والـ Docker والـ Turbo scripts.
* **Inputs:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker/docker-compose.yml`.
* **Required Decisions:** None (Fully Locked).
* **Existing Files:** [package.json](file:///f:/waynah/package.json), [turbo.json](file:///f:/waynah/turbo.json), [pnpm-workspace.yaml](file:///f:/waynah/pnpm-workspace.yaml).
* **New Components:** Validated dev build workflow.
* **DB Changes:** None.
* **API Impact:** None.
* **Security:** Clean environment credentials check (`.env.example`).
* **Tests Required:** `pnpm build`, `pnpm lint`, `pnpm typecheck`.
* **Rollback & Risks:** Git revert commit. Risk: Node/pnpm version mismatch.
* **Status:** **`IMPLEMENTATION-READY`**

---

### Phase 1: Foundation Core & Architecture Utilities
* **Objective:** توسيع حزمتي `@waynah/shared` و `@waynah/config` بالنماذج القياسية للاستجابات والأخطاء.
* **Inputs:** Architecture Layer Specifications, `ApiResponse` baseline in `apps/api`.
* **Required Decisions:** None (Standard DTOs locked).
* **Existing Files:** `packages/shared`, `packages/config`, `apps/api/src/utils/api-response.ts`.
* **New Components:** `@waynah/shared/src/types`, `@waynah/shared/src/errors`.
* **DB Changes:** None.
* **API Impact:** Standard response contract exported across Monorepo.
* **Security:** Input validation DTO schemas (Zod).
* **Tests Required:** Unit tests for response wrappers and error codes.
* **Rollback & Risks:** Git revert package changes.
* **Status:** **`IMPLEMENTATION-READY`**

---

### Phase 2: Identity, Authentication & Access Control
* **Objective:** دعم محرك الجلسات القائم بـ Multi-Role RBAC وفحص الملكية للموارد.
* **Inputs:** `User`, `Session`, `BusinessMember` in `schema.prisma`.
* **Required Decisions:** Session expiry window configuration.
* **Existing Files:** [schema.prisma](file:///f:/waynah/packages/database/prisma/schema.prisma#L173-L198), `apps/api/src/middleware/auth.middleware.ts`.
* **New Components:** Role Policy Guard Middleware, Resource Ownership Evaluator.
* **DB Changes:** Non-destructive Additive Migration for role Enums if needed.
* **API Impact:** Authorization guards on protected `/v1/*` endpoints.
* **Security:** Session token verification, RBAC boundary protection.
* **Tests Required:** Auth flow integration tests, Ownership permission check tests.
* **Rollback & Risks:** Revert middleware and auth logic. Risk: Session invalidation.
* **Status:** **`IMPLEMENTATION-READY`**

---

### Phase 3: Geography & Spatial Subsystem
* **Objective:** تفعيل استعلامات PostGIS النقطية (`nearest-Place`) وتوثيق المرجع الجغرافي.
* **Inputs:** `GEOGRAPHIC_DATA_CONTRACT.md`, `Governorate`, `District`, `PlaceLocation` in schema.
* **Required Decisions:** Decide optionality of `Place.categoryId` (GAP-DB-01 resolution).
* **Existing Files:** [schema.prisma](file:///f:/waynah/packages/database/prisma/schema.prisma#L28-L65), `packages/maps`.
* **New Components:** Spatial Query Service, PostGIS DWithin/Distance Wrappers.
* **DB Changes:** Additive GiST indexes verification on `geom` fields.
* **API Impact:** `GET /v1/geography/*`, Spatial proximity search API.
* **Security:** Administrative boundary write protection.
* **Tests Required:** Spatial nearest-Place tests, WGS84 coordinate validation tests.
* **Rollback & Risks:** Fallback to scalar distance calculation. Risk: Longitude/Latitude inversion.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 4: Business, Branch & Provider Core
* **Objective:** بناء الكيانات التجارية `Business` والربط الاختياري بـ `Branch` وملفات `Provider`.
* **Inputs:** Domain Logic Rules for Business ownership and optional Branch.
* **Required Decisions:** Finalize Prisma schema models for `branches` and `providers` (GAP-DB-03).
* **Existing Files:** [schema.prisma](file:///f:/waynah/packages/database/prisma/schema.prisma#L256-L301), `apps/api/src/routes/v1/business.routes.ts`.
* **New Components:** `BranchService`, `ProviderService`, Business Ownership Context.
* **DB Changes:** Additive migration for `branches` and `providers` tables.
* **API Impact:** `POST /v1/businesses`, `POST /v1/branches`, `POST /v1/providers`.
* **Security:** Multi-member Business ownership enforcement.
* **Tests Required:** Business creation without branch tests, Provider multi-business linkage tests.
* **Rollback & Risks:** Migration rollback. Risk: Creating implicit branch (prevented by design).
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 5: Service, Product & Catalog Engine
* **Objective:** بناء الكيانات التجارية للمنتجات والخدمات والتنوعات وكتالوج العرض.
* **Inputs:** LOGIC-005 Specifications.
* **Required Decisions:** Catalog view caching strategy (`DEFER TO IMPL`).
* **Existing Files:** `apps/api/src/routes/v1/business.routes.ts`.
* **New Components:** `ProductService`, `ServiceManagementService`, Catalog Container View.
* **DB Changes:** Additive migration for `products`, `services`, `product_variants`.
* **API Impact:** `POST /v1/products`, `GET /v1/businesses/:id/catalog`.
* **Security:** Merchant ownership check for product/service updates.
* **Tests Required:** Product/Service ownership tests, Catalog aggregation tests.
* **Rollback & Risks:** Additive migration rollback.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 6: Inquiry, Request, RFQ, Booking & Order Subsystems
* **Objective:** بناء المسارات التفاوضية والتعهدية (Inquiry, Request, RFQ, Booking, Order).
* **Inputs:** Journeys A–J Context & Transaction Invariants.
* **Required Decisions:** RFQ expiry window defaults (`DEFER TO IMPL`).
* **Existing Files:** `apps/api/src/routes/v1/user.routes.ts`.
* **New Components:** `TransactionEngine`, `RequestService`, `RFQService`, `OrderService`.
* **DB Changes:** Additive migration for `orders`, `order_items`, `rfqs`, `quotes`, `bookings`.
* **API Impact:** `POST /v1/requests`, `POST /v1/rfqs`, `POST /v1/orders`.
* **Security:** Customer/Merchant authorization, Single-merchant Order enforcement.
* **Tests Required:** Order single-merchant rule tests, RFQ state transition tests.
* **Rollback & Risks:** State transition rollback and migration revert.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 7: Fulfillment, Delivery & Payment Boundary
* **Objective:** بناء أنماط الوفاء والتسليم وتتبع حالات المدفوعات النقدية والخارجية.
* **Inputs:** LOGIC-006 Fulfillment & Payment Domain Rules.
* **Required Decisions:** Proof of Delivery mechanism selection (OTP / QR / Pin - GAP-HID-01).
* **Existing Files:** `apps/api/src/services`.
* **New Components:** `FulfillmentService`, `DeliveryTrackingBoundary`, `PaymentStatusManager`.
* **DB Changes:** Additive migration for `fulfillments`, `deliveries`, `payment_records`.
* **API Impact:** `PUT /v1/fulfillments/:id/status`, `POST /v1/deliveries/proof`.
* **Security:** Delivery provider and merchant status update authorization.
* **Tests Required:** Proof of delivery verification tests, Payment status transition tests.
* **Rollback & Risks:** Migration rollback. Risk: Hardcoding payment gateway (prevented).
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 8: Trust, Verification, Observation & Review System
* **Objective:** تنفيذ المنظومة الرباعية المستقلة (التحقق، الثقة، الرصد، المراجعة).
* **Inputs:** LOGIC-007 Quad-Concept Specifications.
* **Required Decisions:** Additive `verifications_log` schema detail (GAP-DB-02).
* **Existing Files:** [schema.prisma](file:///f:/waynah/packages/database/prisma/schema.prisma#L136-L171).
* **New Components:** `VerificationSubsystem`, `ObservationPipeline`, `TrustCalculationService`, `ReviewService`.
* **DB Changes:** Additive migration for `reviews`, `verifications_log`.
* **API Impact:** `POST /v1/reviews`, `POST /v1/admin/verifications/review`.
* **Security:** Moderation guards, Separation of User reviews from Official verification.
* **Tests Required:** Trust score bounds tests, Review rating integrity tests.
* **Rollback & Risks:** Rollback trust calculation updates and review routes.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 9: Data Operations, Freshness & Moderation Pipeline
* **Objective:** إدراج دالة هدم الثقة الزمني (`Stale Decay`) وتصفية البيانات المكررة والإشراف.
* **Inputs:** LOGIC-007 Data Lifecycle & Moderation Rules.
* **Required Decisions:** Async queue worker technology (Pg-Boss / Graphile - TOQ-01 / GAP-HID-02).
* **Existing Files:** `apps/api/src/routes/v1/admin.routes.ts`.
* **New Components:** `DataFreshnessEngine`, `DuplicateDetectionService`, `ModerationPipeline`.
* **DB Changes:** None (Uses existing `PlaceObservation` and trust fields).
* **API Impact:** `POST /v1/admin/moderation/action`.
* **Security:** Admin-only moderation execution.
* **Tests Required:** Stale decay timestamp calculation tests, Duplicate detection tests.
* **Rollback & Risks:** Disable background decay cron/queue job.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 10: Exceptions, Notifications & Operational Audit
* **Objective:** معالجة الاستثناءات الـ 6، التنبيهات، وسجل التدقيق غير القابل للتعديل.
* **Inputs:** LOGIC-008 Exceptions Taxonomy & Security Audit Rules.
* **Required Decisions:** Notification transport mechanism (SSE / Polling - TOQ-03).
* **Existing Files:** `apps/api/src/middleware/logging.middleware.ts`.
* **New Components:** `ExceptionHandler`, `NotificationDispatcher`, `AuditTrailLogger`.
* **DB Changes:** Additive migration for `audit_logs`, `notifications`.
* **API Impact:** Real-time event streams, System audit logs.
* **Security:** Immutable audit record enforcement.
* **Tests Required:** Exception recovery tests, Audit log append-only immutability tests.
* **Rollback & Risks:** Disable notification transport layer.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 11: Discovery & Search Optimization
* **Objective:** تطوير محرك البحث المكاني والتصنيفي وتعديل قواميس اللغة العربية.
* **Inputs:** TOQ-04 (`tsvector` + `pg_trgm`), Category hierarchy, Trust indices.
* **Required Decisions:** Arabic stemming & dictionary tuning parameters (GAP-HID-03).
* **Existing Files:** `packages/search`, `apps/api/src/routes/v1/search.routes.ts`.
* **New Components:** `SearchDiscoveryService`, FTS Query Aggregators.
* **DB Changes:** Additive full-text search indexes (`tsvector`).
* **API Impact:** `GET /v1/search`, `GET /v1/discovery`.
* **Security:** Search rate limiting, Public data filtering.
* **Tests Required:** Spatial & category search tests, Relevancy vs Trust score isolation tests.
* **Rollback & Risks:** Fallback to standard spatial queries.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

### Phase 12: Testing, Security Hardening & Production Readiness
* **Objective:** التدقيق الشامل واختبارات E2E لرحلات Journeys A–J والتحقق من الأمن والإطلاق.
* **Inputs:** Monorepo codebase, Complete test suites.
* **Required Decisions:** Production staging deployment parameters.
* **Existing Files:** `tests/e2e`, `tests/integration`.
* **New Components:** Final Production Release Artifacts.
* **DB Changes:** Final Schema Integrity Validation.
* **API Impact:** Complete v1 API Surface lock.
* **Security:** Full penetration testing & vulnerability audit.
* **Tests Required:** 100% N-Tier Integration Tests & Journeys A–J End-to-End Tests.
* **Rollback & Risks:** Staging deployment rollback.
* **Status:** **`READY WITH DEFERRED DESIGN`**

---

## 3. Master Phase Readiness Summary Table (جدول الخلاصة الموحد)

| Phase | Phase Name | Category | Status | Blocking Gaps | Primary Action Before Execution |
| --- | --- | --- | --- | --- | --- |
| **0** | Repository & Environment Baseline | Baseline | **`IMPLEMENTATION-READY`** | None | Run baseline environment scripts. |
| **1** | Foundation Core & Architecture Utilities | Baseline | **`IMPLEMENTATION-READY`** | None | Export standard `@waynah/shared` wrappers. |
| **2** | Identity, Auth & Access Control | Baseline | **`IMPLEMENTATION-READY`** | None | Activate RBAC ownership guards. |
| **3** | Geography & Spatial Subsystem | Spatial | **`READY WITH DEFERRED DESIGN`** | None | Resolve DB-01 Category FK optionality. |
| **4** | Business, Branch & Provider Core | Entities | **`READY WITH DEFERRED DESIGN`** | None | Design additive schema for branch/provider. |
| **5** | Service, Product & Catalog Engine | Commerce | **`READY WITH DEFERRED DESIGN`** | None | Build catalog view aggregators. |
| **6** | Transaction & Request Subsystems | Workflow | **`READY WITH DEFERRED DESIGN`** | None | Enforce single-merchant order rule. |
| **7** | Fulfillment & Payment Boundary | Operations | **`READY WITH DEFERRED DESIGN`** | None | Implement payment status tracker & flex POD. |
| **8** | Trust & Verification Systems | Intelligence | **`READY WITH DEFERRED DESIGN`** | None | Add additive `verifications_log` schema. |
| **9** | Data Operations & Moderation | Operations | **`READY WITH DEFERRED DESIGN`** | None | Configure background queue worker. |
| **10** | Exceptions, Audit & Notifications | Security | **`READY WITH DEFERRED DESIGN`** | None | Activate immutable audit logger. |
| **11** | Discovery & Search Engine | Search | **`READY WITH DEFERRED DESIGN`** | None | Configure PostgreSQL FTS tsvector. |
| **12** | E2E Testing & Hardening | Acceptance | **`READY WITH DEFERRED DESIGN`** | None | Run full Journeys A–J test suites. |

---

```text
================================================================================
END OF PHASE READINESS MATRIX
DOCUMENT STATUS: READY WITH CONDITIONS
================================================================================
```
