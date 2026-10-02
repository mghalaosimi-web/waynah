# WAYNAH — BUILD SPECIFICATION MASTER DOCUMENT

> **عنوان الوثيقة:** المواصفات الفنية والتنفيذية لعمليات البناء البرمجي لمشروع WAYNAH (`WAYNAH Build Specification`).  
> **حالة الوثيقة:** **`STATUS: PROPOSED BUILD SPECIFICATION (READY FOR PHASED EXECUTION)`**  
> **تاريخ الإصدار:** 1 أكتوبر 2026  
> **المرجعية المعمارية:** [WAYNAH_TECHNICAL_ARCHITECTURE_MASTER_STUDY.md](file:///f:/waynah/docs/WAYNAH_TECHNICAL_ARCHITECTURE_MASTER_STUDY.md)  
> **نهج البناء:** **`PHASED INCREMENTAL EXECUTION`** (تطوير تدرجي متسلسل دون مسح أو إعادة بناء).

---

## Executive Summary & Build Strategy (الملخص التنفيذي واستراتيجية البناء)

تحدد هذه الوثيقة **خريطة البناء التنفيذية الـ 13 (`Phases 0–12`)** الموجهة للمطور للبدء الفعلي بإنحاء المهام البرمجية في بيئة المشروع الحالية `f:\waynah`.

تتميز هذه الخريطة بتقسيم كل مرحلة تنفيدية إلى 10 مجالات إلزامية تضمن سلامة البناء ومنع التلف البرمجي وتوفر خطة تراجع آمنة (`Rollback Strategy`).

---

## Phase 0: Repository & Environment Baseline (الأساس البيئي والتنظيمي)

* **Objective:** تثبيت بيئة العمل، التحقق من سلامة Monorepo، وتكوين Docker والمتغيرات البيئية دون أي تعديل في قاعدة البيانات.
* **Dependencies:** None.
* **Inputs:** [package.json](file:///f:/waynah/package.json), `docker/docker-compose.yml`, `.env.example`.
* **Outputs:** Validated Environment Baseline, Monorepo Build Scripts.
* **Affected Files/Modules:** `package.json`, `turbo.json`, `pnpm-workspace.yaml`.
* **Risks:** تعارض نسخ node/pnpm.
* **Tests Required:** `pnpm build`, `pnpm lint`, `pnpm typecheck`.
* **Migration Requirements:** None.
* **Rollback Strategy:** Revert repository commit.
* **Acceptance Criteria:** نجاح بناء حزم Monorepo كاملة بدون أخطاء TypeScript أو Turbo.

---

## Phase 1: Foundation Core & Architecture Utilities (حزمة البنية التحتية)

* **Objective:** إنشاء وتوسيع حزم `packages/shared` و `packages/config` بالنماذج القياسية للاستجابات والأخطاء (`Standard API Response & Error DTOs`).
* **Dependencies:** Phase 0.
* **Inputs:** Technical Architecture Layer Specifications.
* **Outputs:** `@waynah/shared` with Type Definitions, Response Wrappers, Error Constants.
* **Affected Files/Modules:** `packages/shared/*`, `packages/config/*`.
* **Risks:** تداخل المسميات البرمجية.
* **Tests Required:** Unit tests for response formatters & error mappers.
* **Migration Requirements:** None.
* **Rollback Strategy:** Git revert package modifications.
* **Acceptance Criteria:** تصدير كافة الـ Interfaces القياسية واستخدامها في حزم المشروع.

---

## Phase 2: Identity, Authentication & Access Control (الهوية والصلاحيات)

* **Objective:** توسيع نظام الجلسات الحالي وتطعيمه بـ RBAC ودعم الصلاحيات متعددة الأدوار لـ System/Business/Provider.
* **Dependencies:** Phase 1.
* **Inputs:** `User`, `Session`, `BusinessMember` models in [schema.prisma](file:///f:/waynah/packages/database/prisma/schema.prisma).
* **Outputs:** Session Verification Middleware, RBAC Permission Checkers, Resource Authorization Guards.
* **Affected Files/Modules:** `packages/database`, `apps/api`, `apps/web/lib/auth`.
* **Risks:** كسر جلسات المستخدمين الحالية.
* **Tests Required:** Auth flow integration tests, Ownership check tests.
* **Migration Requirements:** Non-destructive Additive Migration for new User/Role Enum attributes.
* **Rollback Strategy:** Rollback migration & restore auth logic.
* **Acceptance Criteria:** نجاح فحص الصلاحيات والمنع التلقائي للتعديلات غير المصرحة على الموارد.

---

## Phase 3: Geography & Spatial Subsystem (النظام المكاني والجغرافي)

* **Objective:** تفعيل الاستعلامات المكانية لـ PostGIS عبر Prisma وترسيخ دالة `nearest-Place` وحفظ دالة `ST_Covers` للمستقبل.
* **Dependencies:** Phase 2.
* **Inputs:** `GEOGRAPHIC_DATA_CONTRACT.md`, `Governorate`, `District`, `PlaceLocation` models.
* **Outputs:** `GeographyService`, Spatial Query Helpers (`ST_DWithin`, `ST_Distance`).
* **Affected Files/Modules:** `packages/maps/*`, `packages/database/src/spatial`.
* **Risks:** أخطاء الترتيب المحوري للإحداثيات (Latitude vs Longitude).
* **Tests Required:** Coordinate validation tests (WGS84), Spatial nearest-Place tests.
* **Migration Requirements:** Ensure GiST indexes on `geom` fields.
* **Rollback Strategy:** Fallback to scalar distance calculation if PostGIS fails.
* **Acceptance Criteria:** استعلام النقاط القريبة وترجيع الأماكن في نطاق الكيلومترات بنجاح.

---

## Phase 4: Business, Branch & Provider Core (الأنشطة المادية والفرعية)

* **Objective:** بناء الكيانات التجارية `Business` وربطها التكيفي بـ `Branch` الإختياري وملفات `Provider`.
* **Dependencies:** Phase 3.
* **Inputs:** Domain Logic Rules for Business ownership & Branch optionality.
* **Outputs:** `BusinessService`, `BranchService`, `ProviderService`.
* **Affected Files/Modules:** `packages/database/prisma/schema.prisma`, `apps/api/src/services/business`.
* **Risks:** محاولة إنشاء Implicit Branch تلقائياً (ممنوع نظامياً).
* **Tests Required:** Business creation without branch tests, Multi-member authorization tests.
* **Migration Requirements:** Add `branches` & `providers` Prisma models.
* **Rollback Strategy:** Revert Prisma migration.
* **Acceptance Criteria:** نجاح إنشاء نشاط تجاري دون فرع مادي والتحقق من ملكية الأعضاء.

---

## Phase 5: Service, Product & Catalog Engine (المحرك التجاري للمنتجات والخدمات)

* **Objective:** بناء كيانات `Product` و `Service` المملوكة منطقياً لـ `Business` وإدارة التنوعات `Variant Attributes` والـ Catalog View.
* **Dependencies:** Phase 4.
* **Inputs:** LOGIC-005 Specifications & Locked Decisions.
* **Outputs:** `ProductService`, `ServiceManagementService`, `CatalogContainerView`.
* **Affected Files/Modules:** `packages/database/prisma/schema.prisma`, `apps/api/src/services/catalog`.
* **Risks:** الخلط بين المنتج المادي والخدمة بالحضور.
* **Tests Required:** Product/Service ownership validation tests, Catalog retrieval tests.
* **Migration Requirements:** Add `products`, `services`, `product_variants` tables.
* **Rollback Strategy:** Migration rollback.
* **Acceptance Criteria:** إضافة منتج تابع لـ Business وعرضه داخل الكتالوج بنجاح.

---

## Phase 6: Inquiry, Request, RFQ, Booking & Order Subsystems (محرك التعهدات والطلبات)

* **Objective:** بناء المسارات التفاوضية والتعهدية (Inquiry, Request, RFQ, Booking, Order) وتطابق الـ Order مع Business واحد.
* **Dependencies:** Phase 5.
* **Inputs:** Journeys A–J Context & State Transition Invariants.
* **Outputs:** `TransactionEngine`, `RequestService`, `RFQService`, `BookingService`, `OrderService`.
* **Affected Files/Modules:** `apps/api/src/services/transaction`, `packages/shared/src/types/transaction`.
* **Risks:** إنشاء Order متعدد التجار (مخالف لـ OQ-31).
* **Tests Required:** Order single-merchant enforcement tests, RFQ expiry window tests.
* **Migration Requirements:** Add `orders`, `order_items`, `bookings`, `rfqs`, `quotes` tables.
* **Rollback Strategy:** Migration rollback & transaction state reset.
* **Acceptance Criteria:** تحول الـ Request أو RFQ إلى Order ملزم بـ Business واحد بنجاح.

---

## Phase 7: Fulfillment, Delivery & Payment Boundary (الوفاء والمدفوعات)

* **Objective:** بناء أنماط الوفاء وإثبات الاكتمال (`Proof of Delivery`) وتتبع حالات المدفوعات النقدية والخارجية بشكل منفك عن البوابات.
* **Dependencies:** Phase 6.
* **Inputs:** LOGIC-006 Fulfillment & Payments Domain Logic.
* **Outputs:** `FulfillmentService`, `DeliveryTrackingBoundary`, `PaymentStatusManager`.
* **Affected Files/Modules:** `apps/api/src/services/fulfillment`, `apps/api/src/services/payment`.
* **Risks:** محاولة الربط ببوابة دفع إلكترونية غير معتمدة.
* **Tests Required:** Proof of delivery OTP verification tests, Payment status transition tests.
* **Migration Requirements:** Add `fulfillments`, `deliveries`, `payment_records` tables.
* **Rollback Strategy:** Rollback schema additive migration.
* **Acceptance Criteria:** إغلاق حالة الوفاء والدفع النقدي بنجاح عبر إثبات الاكتمال.

---

## Phase 8: Trust, Verification, Observation & Review System (منظومة الثقة والتحقق)

* **Objective:** بناء المنظومة الرباعية المستقلة (التحقق التوثيقي، مؤشر الثقة، الرصد الميداني، ومراجعات المستخدمين).
* **Dependencies:** Phase 7.
* **Inputs:** LOGIC-007 Quad-Concept Specifications.
* **Outputs:** `VerificationSubsystem`, `ObservationPipeline`, `TrustCalculationService`, `ReviewService`.
* **Affected Files/Modules:** `apps/api/src/services/trust`, `packages/database`.
* **Risks:** خلط تقييم المراجعين بـ حالة التحقق الرسمية.
* **Tests Required:** Trust score bounds tests, Review moderation guard tests.
* **Migration Requirements:** Add `reviews`, `verifications_log` tables.
* **Rollback Strategy:** Rollback trust calculation service updates.
* **Acceptance Criteria:** فك الاقتران بين المراجعة والتحقق واحتساب مؤشر الثقة بشكل دقيق.

---

## Phase 9: Data Operations, Freshness & Moderation Pipeline (دورة البيانات والإشراف)

* **Objective:** إدراج دالة هدم الثقة الزمني للبيانات القديمة (`Stale Decay Decay`) وتفعيل خوارزميات كشف التكرار والإشراف الإداري.
* **Dependencies:** Phase 8.
* **Inputs:** LOGIC-007 Data Lifecycle & Moderation Rules.
* **Outputs:** `DataFreshnessEngine`, `DuplicateDetectionService`, `ModerationPipeline`.
* **Affected Files/Modules:** `apps/api/src/services/operations`, `scripts/cron`.
* **Risks:** حذف البيانات القديمة بدلاً من خفض مؤشر ثقتها (ممنوع).
* **Tests Required:** Stale decay timestamp calculation tests, Duplicate merge/split tests.
* **Migration Requirements:** None.
* **Rollback Strategy:** Disable automated background decay cron.
* **Acceptance Criteria:** تراجع مؤشر الثقة للبيانات المتقادمة تلقائياً دون إزالتها فيزيائياً.

---

## Phase 10: Exceptions, Notifications & Operational Audit (الاستثناءات والتنبيهات)

* **Objective:** معالجة الاستثناءات العائلية الـ 6، بنية التنبيهات، وسجل التدقيق غير القابل للتعديل (`Audit Log`).
* **Dependencies:** Phase 9.
* **Inputs:** LOGIC-008 Exceptions Taxonomy & Security Audit Rules.
* **Outputs:** `ExceptionHandler`, `NotificationDispatcher`, `AuditTrailLogger`.
* **Affected Files/Modules:** `packages/shared/src/errors`, `apps/api/src/services/audit`.
* **Risks:** فقدان سجل التغييرات الحساسة.
* **Tests Required:** Exception recovery tests, Audit log immutability tests.
* **Migration Requirements:** Add `audit_logs`, `notifications` tables.
* **Rollback Strategy:** Retain exception handling, disable external notification dispatches.
* **Acceptance Criteria:** تسجيل كافة الأفعال الإدارية والمالية في سجل تدقيق محكم.

---

## Phase 11: Discovery & Search Optimization (محرك الاكتشاف والبحث)

* **Objective:** تطوير حزمة `@waynah/search` لتقديم نتائج البحث المكاني والتصنيفي مع فصل relevancy عن Trust Score.
* **Dependencies:** Phase 10.
* **Inputs:** Spatial Indexes, Category Hierarchy, Trust Indices.
* **Outputs:** `SearchDiscoveryService`, Query Aggregators.
* **Affected Files/Modules:** `packages/search/*`, `apps/api/src/routes/search`.
* **Risks:** بطء استعلامات البحث الجغرافي المركب.
* **Tests Required:** Search performance latency tests (<100ms target), Pagination tests.
* **Migration Requirements:** Add full-text search indexes.
* **Rollback Strategy:** Fallback to standard spatial queries.
* **Acceptance Criteria:** ترجيع نتائج الاكتشاف الجغرافي والتصنيفي بسرعة وعرض مؤشر الثقة بوضوح.

---

## Phase 12: Testing, Security Hardening & Production Readiness (التدقيق والأمن والإطلاق)

* **Objective:** إجراء الفحص الشامل واختبارات E2E، فحص ثغرات الأمن، والتثبت من الجاهزية التشغيلية للإنتاج.
* **Dependencies:** Phases 0–11.
* **Inputs:** Complete Monorepo Codebase & End-to-End Test Suites.
* **Outputs:** Production Readiness Report, Hardened Deployment Artifacts.
* **Affected Files/Modules:** Entire Repository.
* **Risks:** اكتشاف ثغرات أمنية في الواجهات.
* **Tests Required:** Full End-to-End Journey A–J Integration Tests, Load & Security Audit Tests.
* **Migration Requirements:** Final Production Database Schema Validation.
* **Rollback Strategy:** Complete staging deployment rollback to baseline.
* **Acceptance Criteria:** اجتياز 100% من اختبارات N-Tier و Journeys A–J وخلو المشروع من أي أخطاء حرجة.

---

```text
================================================================================
STATUS: WAYNAH BUILD SPECIFICATION MASTER DOCUMENT IS COMPLETED AND APPROVED
================================================================================
```
