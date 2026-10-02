# WAYNAH — TECHNICAL ARCHITECTURE DECISION RECORDS (ADR REGISTRY)

> **عنوان الوثيقة:** سجل القرارات الفنية والهندسية لمشروع WAYNAH (`Architecture Decision Records - ADR Registry`).  
> **تاريخ الإصدار:** 1 أكتوبر 2026  
> **حالة السجل:** **`STATUS: ACTIVE ADR REGISTRY`**  
> **المحافظة النظرية المرجعية:** محافظة حجة – الجمهورية اليمنية.

---

## 1. Summary of Architectural Decisions (ملخص القرارات المعمارية)

| ADR ID | Decision Title | Status | Impact / Scope | Reversibility |
|---|---|---|---|---|
| **`ADR-001`** | Monorepo Architecture & Evolution Strategy | **`LOCKED`** | Turborepo + pnpm Workspaces integration | Moderate |
| **`ADR-002`** | PostGIS Spatial Architecture & nearest-Place Heuristic | **`LOCKED`** | WGS84 SRID 4326 + GiST Indexes | Low |
| **`ADR-003`** | Prisma ORM Additive Migration Strategy | **`LOCKED`** | Non-destructive schema extensions | Low |
| **`ADR-004`** | Next.js App Router & Service Decoupling | **`LOCKED`** | Presentation layer isolated from DB logic | Moderate |
| **`ADR-005`** | Decoupled Payment & Financial Position Strategy | **`LOCKED`** | Direct merchant payments / No gateway locks | High |
| **`ADR-006`** | Multi-Role RBAC & Resource Ownership Engine | **`LOCKED`** | Enforcement of Business/User ownership | Moderate |
| **`ADR-007`** | Quad-Concept Isolation Architecture | **`LOCKED`** | Separation of Verification, Trust, Observation, Review | Moderate |
| **`ADR-008`** | Non-destructive Stale Data Decay & Audit Trail | **`LOCKED`** | Confidence decay without physical deletions | Moderate |

---

## 2. Detailed Architecture Decision Records (سجل التفاصيل)

### ADR-001: Monorepo Architecture & Evolution Strategy
* **Context:** المشروع يحتوي على هيكلية Turborepo و pnpm workspaces قائمة بالفعل (`apps/web`, `apps/api`, `packages/*`).
* **Decision:** الاعتماد التام على بنية التطور التكاملي (`Evolutionary Monorepo Architecture`) وتوسيع الحزم البرمجية الحالية وتجنب إعادة البناء من الصفر.
* **Alternatives Considered:** تفكيك المنظومة إلى Microservices مستقلة (مستبعد لمنع التعقيد المبكر).
* **Consequences:** سرعة في التطوير، مشاركة الأنواع بصارمة TypeScript، وإدارة موحدة لبناء الحزم.

---

### ADR-002: PostGIS Spatial Architecture & nearest-Place Active Heuristic
* **Context:** متطلبات الجغرافيا اليمنية تفرض التعامل مع الاحداثيات النقطية ومحدودية البيانات الحدودية المضلعة حالياً.
* **Decision:** الاعتماد على PostGIS بمرجعية SRID 4326 وتفعيل استعلام **`nearest-Place`** كـ المرجع الجغرافي الفعال حالياً، وتأجيل دالة **`ST_Covers`** حتى استيراد الحدود الرسمية من OCHA COD-AB.
* **Alternatives Considered:** استخدام الحسابات الهندسية البسيطة بالـ Flat Coordinates (مستبعد لقلة الدقة).
* **Consequences:** دقة عالية في الاستعلامات الجغرافية وتوافق تام مع عقد الجغرافيا `GEOGRAPHIC_DATA_CONTRACT.md`.

---

### ADR-003: Prisma ORM Additive Migration Strategy
* **Context:** قاعدة البيانات تحتوي على 16 نموذجاً قيد العمل ونشاطات تجارية مأهولة.
* **Decision:** جميع الهجرات المستقبلية لقاعدة البيانات يجب أن تكون **هجرات إضافية غير مدمرة (`Non-destructive Additive Migrations`)** مع حظر تام لأوامر `db reset` في بيئات التطوير الحساسة والإنتاج.
* **Alternatives Considered:** إعادة تصميم Schema كلياً وتوليد Migration مدمر (ممنوع نظامياً).
* **Consequences:** حماية البيانات الحالية وتطوير المخطط البياناتي بشكل آمن وتدريجي.

---

### ADR-004: Next.js App Router & Service Decoupling
* **Context:** واجهات المستخدم تُبنى عبر Next.js App Router.
* **Decision:** فصل طبقة العرض (`UI`) عن طبقة الخدمات (`Application Services`). يُحظر إجراء استعلامات Prisma مباشرة داخل مكونات الواجهة (`React Server Components / Client Components`).
* **Alternatives Considered:** كتابة استعلامات قاعدة البيانات مباشرة داخل المكونات (مستبعد لمنع Coupling).
* **Consequences:** سهولة الاختبار، أمان عالي، وقابلية إعادة استخدام الخدمات البرمجية.

---

### ADR-005: Decoupled Payment & Financial Position Strategy
* **Context:** المعاملات المالية في اليمن تعتمد على الدفع النقدي COD أو المحافظ المحلية الخارجية.
* **Decision:** منصة WAYNAH منصة تمكين ودليل وتنسيق، ولا تُعامل كطرف مالي مباشر أو محفظة افتراضية. يتم تتبع حالات الدفع منطقياً دون ربط ثابت ببوابة دفع معينة.
* **Alternatives Considered:** دمج بوابة دفع إلكترونية دولية اجبارية (مستبعد لعدم ملاءمتها للسوق المحلي حالياً).
* **Consequences:** مرونة تشغيلية تامة ومطابقة مقفلة لـ `LOGIC-006`.

---

### ADR-006: Multi-Role RBAC & Resource Ownership Engine
* **Context:** تنوع المستخدمين (زائر، زبون، صاحب عمل، موفر ميداني، مشرف نظام).
* **Decision:** تطبيق نظام RBAC محكم يعتمد على فحص الصلاحيات وربطه بملكية الموارد (`Resource Ownership Check`). لا يحق لأي عضو تعديل كيانات لا تنتمي صراحة لـ `BusinessId` المرتبط بحسابه.
* **Alternatives Considered:** الاعتماد على الصلاحيات البسيطة (User vs Admin) فقط (مستبعد لعدم تلبيته متطلبات التجّار).
* **Consequences:** أمان عالي وحماية بيانات التجّار والموفرين.

---

### ADR-007: Quad-Concept Isolation Architecture
* **Context:** التمييز بين التحقق، الثقة، الرصد الميداني، ومراجعات المستخدمين في `LOGIC-007`.
* **Decision:** الفصل البرمجي التام بين المكونات الأربعة في أربع وحدات مستقلة (M19, M20, M21, M22) لضمان عدم تأثير رأي المستخدم الشخصي على حالة التحقق الرسمية.
* **Alternatives Considered:** دمج النقاط في مؤشر واحد متصلب (مستبعد لمخالفته المنطق المقفل).
* **Consequences:** شفافية موثوقة ونزاهة بيانات عالية.

---

### ADR-008: Non-destructive Stale Data Decay & Audit Trail
* **Context:** التعامل مع البيانات المتقادمة في بيئة اليمن وتغيرات المحلات.
* **Decision:** البيانات القديمة لا تُحذف فيزيائياً، بل تخضع لـ خوارزمية هدم مؤشر الثقة الزمني (`Confidence Decay`)، مع تسجيل كافة التعديلات في `Audit Log` غير قابل للتعديل.
* **Alternatives Considered:** الحذف التلقائي للبيانات القديمة بعد مرور زمن محدد (مستبعد لمنع فقدان الأصول التاريخية).
* **Consequences:** المحافظة على الأصول التاريخية ونقاء نتايج الاكتشاف.

---

```text
================================================================================
STATUS: TECHNICAL ADR REGISTRY COMPLETED AND LOCKED FOR IMPLEMENTATION
================================================================================
```
