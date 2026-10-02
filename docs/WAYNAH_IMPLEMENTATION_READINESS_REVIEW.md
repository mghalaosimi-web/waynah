# WAYNAH — IMPLEMENTATION READINESS & BUILD CONTRACT REVIEW

> **نوع الوثيقة:** تقرير المراجعة والتدقيق الشامل لجاهزية البناء الفني وعقد التنفيذ لمشروع WAYNAH (`Implementation Readiness & Build Contract Review`).  
> **تاريخ الإصدار:** 1 أكتوبر 2026  
> **حالة الوثيقة:** **`STATUS: READY WITH CONDITIONS`** *(خاضع لبروتوكول البناء التدرجي المحكوم)*  
> **المرجعية المعمارية:** [WAYNAH_TECHNICAL_ARCHITECTURE_MASTER_STUDY.md](file:///f:/waynah/docs/WAYNAH_TECHNICAL_ARCHITECTURE_MASTER_STUDY.md)  
> **سجل القرارات الفنية:** [WAYNAH_TECHNICAL_ADR_REGISTRY.md](file:///f:/waynah/docs/WAYNAH_TECHNICAL_ADR_REGISTRY.md)  
> **العلامة البرمجية للمشروع:** `M.GH.AL` | **النطاق التجريبي المرجعي:** محافظة حجة – الجمهورية اليمنية.

---

## 1. Executive Summary (الملخص التنفيذي)

قامت لجنة التدقيق الهندسية المستقلة ومراجع العقود الفنية بضمان النزاهة الشاملة للانتقال المنهجي لمشروع **وَيْنَه؟ WAYNAH** من مرحلة **الدومين المقفل والهندسة المعمارية المعتمدة** إلى مرحلة **التنفيذ البرمجي المتدرج والآمن (Phased Implementation)**.

تُثبت هذه المراجعة الميدانية أن جميع الكيانات الخمسة الكبرى (`Place`, `Business`, `Provider`, `Service`, `Product`) والرحلات العشر للمستخدمين (`Journeys A–J`) محصنة بالكامل ضد التداخل، وأن البنية القائمة في مستودع المشروع (`f:\waynah`) محفوفة بحماية صارمة تمنع إعادة البناء الكلي (`No Rewrite`) وتمنع مسح قاعدة البيانات (`No DB Reset`).

تخلص هذه المراجعة إلى أن المشروع **جاهز للدخول في البناء البرمجي بشروط محددة (`BUILD READY WITH CONDITIONS`)**، مع وجود حوكمة كاملة للخيارات التنفيذية المؤجلة (`Deferred Design Options`) دون إلزام المطور باختراع أي قرارات جوهرية في الدومين أو المعمارية أو الأمن.

---

## 2. Actual Repository Baseline & Project State (الواقع الفعلي للمستودع)

تم فحص البنية الفهرسية والبرمجية القائمة في مستودع المشروع `f:\waynah` للتثبت من المطابقة بين الواقع والوثائق:

| Area | Actual Repository Reality | Architecture Expectation | Status |
| --- | --- | --- | --- |
| **Monorepo** | Turborepo v2.4.4 + pnpm workspace v12.8.1 | Turborepo + pnpm workspace | **`MATCHED / EXISTING`** |
| **Web Presentation** | Next.js v16.3.6 (App Router) + React 19 + Tailwind CSS | Next.js App Router | **`MATCHED / EXISTING`** |
| **API Backend** | Hono Framework v4.13 (`apps/api/src/server.ts`) + Node HTTP | Hono / REST Services decoupled from UI | **`MATCHED / EXISTING`** |
| **Database Engine** | PostgreSQL v15+ (via Docker Compose) | PostgreSQL Database | **`MATCHED / EXISTING`** |
| **Spatial Engine** | PostGIS Extension (`geography Point & MultiPolygon, SRID 4326`) | PostGIS WGS84 Spatial Subsystem | **`MATCHED / EXISTING`** |
| **Prisma ORM** | Prisma v6.x (16 Active Models in `schema.prisma`) | Prisma ORM with Additive Migrations | **`MATCHED / EXISTING`** |
| **Active DB Models** | `HealthCheck`, `Governorate`, `District`, `Category`, `Place`, `PlaceLocation`, `DataSource`, `PlaceObservation`, `DataConflict`, `User`, `Session`, `Favorite`, `ServiceRequest`, `Business`, `BusinessMember`, `BusinessVerification` | Core Baseline Entities | **`MATCHED / EXISTING`** |
| **Identity & Sessions** | DB-backed Session model (`sessions` table) | Session Authentication | **`MATCHED / EXISTING`** |
| **RBAC Authority** | `User.role` + `BusinessMember.role` (OWNER, MANAGER, MEMBER) | Multi-Role RBAC Baseline | **`MATCHED / EXISTING`** |
| **Testing Harness** | Vitest (`apps/api`), Playwright/E2E structure baseline (`tests/`) | Unit, Integration & E2E Tests | **`MATCHED / EXISTING`** |
| **Deployment / Infra** | Docker Compose (`docker/docker-compose.yml`) | Containerized Local Dev Baseline | **`MATCHED / EXISTING`** |

---

## 3. Domain → Technical Contract Audit (مطابقة الدومين مع الهندسة التقنية)

تم التثبت من تغطية القرارات المقفلة في الدراسات `LOGIC-001` إلى `LOGIC-008` داخل الوحدات البرمجية الـ 28 ومراحل البناء الـ 13:

```text
DOMAIN DECISION
      ↓
TECHNICAL MODULE
      ↓
DATA RESPONSIBILITY
      ↓
APPLICATION RESPONSIBILITY
      ↓
API BOUNDARY
      ↓
AUTHORIZATION
      ↓
AUDIT REQUIREMENT
      ↓
TEST REQUIREMENT
      ↓
BUILD PHASE
```

### ملخص نتائج التتبع المقفل:
1. **استقلالية الكيانات الخمسة (`LOGIC-004`):** تم التأكد من عدم وجود أي جدول أو نموذج يخلط بين `Place` و `Business` و `Provider` و `Service` و `Product`.
2. **الفرع الاختياري (`Branch Conditional`):** لا يوجد إنشاء تلقائي لفرع ضمني (`No Implicit Branch`). العمل التجاري المستقل بدونه صالح للأنشطة الميدانية والمتنقلة والرقمية.
3. **المالك التجاري للكتالوج (`LOGIC-005`):** الكتالوج هو container/view منطقي مملوك لـ `Business` وليس جدولاً متصلباً يعطل المرونة.
4. **التفكيك الرباعي (`LOGIC-007`):** تم التثبت من استقلالية الوحدات الأربع: التحقق التوثيقي (`Verification`)، مؤشر الثقة (`Trust`)، الرصد الميداني (`Observation`)، والمراجعات (`Review`).

---

## 4. Architecture → Build Specification Mapping (مطابقة المعمارية مع مواصفات البناء)

تربط خريطة البناء الـ 13 مرحلة (`Phase 0` إلى `Phase 12`) بين الوحدات الفنية والواجهات البرمجية:

* **Phase 0:** إرساء بيئة Monorepo وتدقيق السكريبتات دون المساس بقاعدة البيانات.
* **Phase 1:** بناء حزم الخدمات المشتركة النمطية `@waynah/shared` ونماذج الأخطاء القياسية.
* **Phase 2:** تطوير محرك الجلسات وربطه بصلاحيات الموارد والـ RBAC.
* **Phase 3:** تفعيل خدمات PostGIS وتطبيق استعلام `nearest-Place` النقطي مع حفظ `ST_Covers` للمستقبل.
* **Phase 4:** إدخال نماذج `branches` و `providers` بنهج Additive Migration الإضافي.
* **Phases 5–7:** محرك الكتالوج، مسارات التعهد والطلبات، والوفاء الشامل المترابط بحالات الدفع النقدية والخارجية.
* **Phases 8–10:** المنظومة الرباعية، دورة هدم الثقة الزمني (`Stale Decay`)، وسجل التدقيق المحكم (`Audit Log`).
* **Phases 11–12:** محرك البحث والاكتشاف، واختبارات القبول الشامل لرحلات Journeys A–J.

---

## 5. Database Contract Audit (تدقيق عقد قاعدة البيانات)

فحص النزاهة الهيكلية لنموذج Prisma الفعلي (`schema.prisma`):

| Rule / Field | Current Schema Reality | Domain Rule Requirement | Evaluation & Gap Status |
| --- | --- | --- | --- |
| **`Place ↔ Business`** | `Place.businessId` (Optional `String?`) | Business operates across multiple Places; Place can exist without Business. | **`VALID CONTRACT`** |
| **`Branch Existence`** | Model missing in current schema. | Branch is conditional/optional. `Main Branch` is a property, not a separate entity. | **`VALID CONTRACT`** (To be added in Phase 4 as optional relation). |
| **`Place ↔ Location`** | `PlaceLocation` (1-to-1 optional `Place.location PlaceLocation?`) | Place optionally owns 1 physical coordinate set. | **`VALID CONTRACT`** |
| **`Category Foreign Key`** | `Place.categoryId` is non-nullable (`String`). | Place discovery/import might ingest raw places before classification. | **`DESIGN GAP (DB-01)`** — Candidate for optionality or fallback handler. |
| **`Business Verification`** | `BusinessVerification` (1-to-1 static status). | LOGIC-007 requires historical verification event trail. | **`DESIGN GAP (DB-02)`** — Requires additive `verifications_log` in Phase 8. |
| **`Audit Columns`** | `createdAt`, `updatedAt` present on primary models. | All persistent domain records must maintain timestamp integrity. | **`VALID CONTRACT`** |

---

## 6. API & Security Contract Audit (تدقيق الواجهات والأمن)

1. **الواجهات الاسترشادية:** جميع مسارات Endpoints المذكورة في الوثائق الفنية (مثل `GET /v1/places/search`) هي أمثلة توضيحية (`Candidate Endpoints`) وليست عقوداً جامدة، وتتم صياغة العقود النهائية أثناء تنفيذ كل مرحلة.
2. **حدود الهوية والصلاحيات:** تفصل الطبقات الأواهلية بين حساب المستخدم (`User`), الهوية التجارية (`BusinessMember`), وملف الموفر (`Provider`). فحص الملكية (`Resource Ownership Check`) ملزم قبل تنفيذ التعديلات.
3. **نموذج الاستجابة الموحد:** تلتزم جميع الواجهات ببطاقة الاستجابة القياسية `ApiResponse.success` و `ApiResponse.error` المنفذة بالفعل في `apps/api/src/utils/api-response.ts`.

---

## 7. Mandatory 30 Special Checks Summary (ملخص الفحوصات الـ 30 الإلزامية)

1. **Business ↔ Place Cardinality:** ✅ مطابق (Business -> multiple Places; Place -> optional Business).
2. **Branch Optionality:** ✅ مطابق (عدم إجبار النشاط على الفرع).
3. **Main Branch Semantics:** ✅ مطابق (Main Branch خاصية علم داخل الفرع القائم وليس Entity مستقل).
4. **Provider Multi-Business Capability:** ✅ مطابق (عدم تقييد الموفر بشركة واحدة).
5. **Activity vs Category:** ✅ مطابق (الفصل بين الوصف الدلالي وفئة التصفية).
6. **Service Coverage Area:** ✅ مطابق (نطاق جغرافي تشغيلي لا يغير مديرية المكان).
7. **nearest-Place vs District Authority:** ✅ مطابق (`nearest-Place` مرجع فعال حالياً، ولا يلغي الحدود الرسمية).
8. **ST_Covers Deferred Status:** ✅ مطابق (مؤجل لحين استيراد الحدود الرسمية OCHA COD-AB).
9. **Verification Lifecycle vs Log:** ⚠️ فجوة تصميمية مجدولة (DB-02) لإضافة سجل التدقيق التوثيقي.
10. **Observation Optionality:** ✅ مطابق (الرصد الميداني مصدر إشارة إضافي اختياري).
11. **Category Optionality/Cardinality:** ⚠️ فجوة تصميمية مجدولة (DB-01) لمرونة الاستيراد الأولية.
12. **PlaceLocation Cardinality:** ✅ مطابق (1-to-1 optional).
13. **Audit Mechanism vs Requirement:** ✅ مطابق (المطلب المقفل هو قابلية التدقيق، والآلية `DEFER TO IMPL`).
14. **Stale Decay Concept vs Algorithm:** ✅ مطابق (المفهوم مقفل، والخوارزمية الدقيقة `DEFER TO IMPL`).
15. **TOQ-04 Classification:** ✅ مطابق (مصنف كـ `TECHNICAL DESIGN / DESIGN CANDIDATE`).
16. **API Examples vs Contracts:** ✅ مطابق (الأمثلة استرشادية والعقد يتبلور في مرحلته).
17. **OTP / POD Hidden Decision:** ✅ مطابق (إثبات التسليم OTP خيار تنفيذي مرن وليس قيد دومين).
18. **Payment / Settlement Boundary:** ✅ مطابق (تتبع منطقي لحالات الدفع النقدي والخارجي دون بوابة محددة).
19. **Search `<100ms` Claim:** ✅ مطابق (هدف هندسي للأداء خاضع للقياس، وليس شرط قبول قسري).
20. **Technical Module vs Core Entity vs Table:** ✅ مطابق (28 وحدة برمجية ≠ 28 جدول في قاعدة البيانات).
21. **Existing Repo Reality vs Proposed Paths:** ✅ مطابق (الاعتماد الكامل على Hono API و Next.js و Prisma القائمة).
22. **Migration Safety:** ✅ مطابق (التزام صارم بـ Additive Migrations وحظر `db reset`).
23. **Journey A–J Coverage:** ✅ مطابق (تغطية كاملة للرحلات العشر دون اختراع رحلات رئيسية جديدة).
24. **Multi-merchant Order Rule:** ✅ مطابق (السلة متعددة التجار تترجم لعدة طلبات فرعية لكل Business).
25. **Offline Transaction Assumptions:** ✅ مطابق (تخزين مؤقت في IndexedDB ومعالجة الشبكات الضعيفة).
26. **Notification Transport Assumptions:** ✅ مطابق (SSE كخيار تنفيذي موصى به مع Polling Fallback).
27. **Queue Technology Assumptions:** ✅ مطابق (Pg-Boss / Graphile Worker كخيار تنفيذي موصى به).
28. **Storage Technology Assumptions:** ✅ مطابق (Storage Abstraction Provider يدعم التخزين المحلي و S3).
29. **Trust Formula Assumptions:** ✅ مطابق (الوزن والمعادلة التفصيلية `DEFER TO IMPL`).
30. **Performance Assumptions:** ✅ مطابق (جميع أرقام السعة والأداء هي أهداف هندسية خاضعة للقياس القياسي).

---

## 8. Build Readiness Verdict (الحكم النهائي للجاهزية)

```text
================================================================================
FINAL BUILD READINESS VERDICT:
--------------------------------------------------------------------------------
VERDICT: BUILD READY WITH CONDITIONS (CONDITION B)
================================================================================
```

### الشروط الحاكمة للبدء بالتنفيذ:
1. **بدء البناء من Phase 0 حتكامياً:** تنفيذ مراحل البناء بالتسلسل دون قفز.
2. **الالتزام بالهجرات غير المدمرة:** يُحظر تشغيل `prisma migrate reset` أو مسح جداول قائمة.
3. **إبقاء الخيارات التنفيذية مرنة:** عدم قفل تقنيات الطوابير أو التخزين إلا في مرحلتها المحددة.

---

```text
================================================================================
END OF IMPLEMENTATION READINESS & BUILD CONTRACT REVIEW
DOCUMENT STATUS: READY WITH CONDITIONS
================================================================================
```
