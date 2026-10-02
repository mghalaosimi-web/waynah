# WAYNAH — TECHNICAL OPEN QUESTIONS REGISTRY (TOQ REGISTRY)

> **عنوان الوثيقة:** سجل الأسئلة الفنية والهندسية المفتوحة لمشروع WAYNAH (`Technical Open Questions - TOQ Registry`).  
> **تاريخ الإصدار:** 1 أكتوبر 2026  
> **حالة السجل:** **`STATUS: ACTIVE TECHNICAL OPEN QUESTIONS`**  
> **المحافظة النظرية المرجعية:** محافظة حجة – الجمهورية اليمنية.

---

## 1. Summary of Technical Open Questions (ملخص الأسئلة الفنية المفتوحة)

| TOQ ID | Question Topic | Technical Impact | Recommendation / Candidate | Status |
|---|---|---|---|---|
| **`TOQ-01`** | Async Job Queue Driver Selection | High | PostgreSQL-backed Queue (e.g. Graphile Worker / Pg-Boss) for zero extra infra | **`DEFER TO IMPL`** |
| **`TOQ-02`** | Storage Engine for Verification Proofs | Medium | S3-Compatible API Abstraction (MinIO / R2 / Local FS) | **`DEFER TO IMPL`** |
| **`TOQ-03`** | Real-time Delivery & Notification Transport | Medium | Server-Sent Events (SSE) with HTTP Fallback | **`DEFER TO IMPL`** |
| **`TOQ-04`** | Full-Text Search Engine Strategy | High | PostgreSQL Native `tsvector` with Arabic Dictionary first | **`TECHNICAL DESIGN`** |
| **`TOQ-05`** | PWA Offline Sync & Transaction Staging | High | IndexedDB Staging Queue with Service Worker Sync | **`DEFER TO IMPL`** |

---

## 2. Detailed Technical Open Questions (تفاصيل الأسئلة الفنية)

### TOQ-01: Async Job Queue Driver Selection
* **السؤال:** ما هو محرك طوابير العمليات غير التزامنية (`Async Job Queue Driver`) الأنسب لمعالجة التنبيهات وإرسال الإشعارات وهدم الثقة الزمني؟
* **الخيارات المتاحة:**
  * **الخيار أ (موصى به):** استخدام طابور قائم على PostgreSQL (مثل Graphile Worker أو Pg-Boss) لتقليل التعقيد التكتيكي وعدم تشغيل سيرفر Redis مستقل في البداية.
  * **الخيار ب:** تشغيل خادم Redis + BullMQ.
* **التصنيف:** **`DEFER TO IMPLEMENTATION`**

---

### TOQ-02: Storage Engine for Verification Proofs & Media
* **السؤال:** ما هي البنية التحتية لتخزين صور إثبات الملكية (`Verification Documents`) وصور المنتجات واليافطات؟
* **الخيارات المتاحة:**
  * **الخيار أ (موصى به):** بناء حزمة تجريدية (`Storage Abstraction Provider`) تدعم التخزين المحلي (`Local Disk`) في التطوير و S3-Compatible (مثل MinIO أو Cloudflare R2) في الإنتاج.
* **التصنيف:** **`DEFER TO IMPLEMENTATION`**

---

### TOQ-03: Real-time Delivery & Notification Transport
* **السؤال:** ما هي تقنية البث المباشر لتتبع حالة الوفاء والتسليم في الرحلة G في بيئة شبكات اليمن المحدودة؟
* **الخيارات المتاحة:**
  * **الخيار أ (موصى به):** استخدام **Server-Sent Events (SSE)** لخفتها وسهولتها عبر HTTP/2 مقارنة بـ WebSockets المعقدة في الاتصالات الضعيفة، مع توفير التحديث بالاستعلام المتقطع (`Polling Fallback`).
* **التصنيف:** **`DEFER TO IMPLEMENTATION`**

---

### TOQ-04: Full-Text Search Engine Strategy
* **السؤال:** ما هي تقنية محرك البحث المعرفي واللغوي المطلوب للبحث عن الأنشطة والمنتجات باللغة العربية؟
* **الخيارات المتاحة:**
  * **الخيار أ (موصى به):** تفعيل محرك البحث النصي الداخلي في PostgreSQL (`tsvector` / `pg_trgm`) مع دعم القواميس العربية لضمان البساطة وعدم إضافة محركات مثل MeiliSearch أو Elasticsearch مبكراً.
* **التصنيف:** **`TECHNICAL DESIGN`**

---

### TOQ-05: PWA Offline Sync & Transaction Staging
* **السؤال:** كيف تتم معالجة انقطاع الاتصال أثناء إدخال البيانات أو إنشاء الطلبات في التطبيق؟
* **الخيارات المتاحة:**
  * **الخيار أ (موصى به):** تخزين المعاملات المحلية في متصفح المستخدم عبر IndexedDB وإعادة المحاولة التلقائية بواسطة Service Worker عند عودة الاتصال الشبكي.
* **التصنيف:** **`DEFER TO IMPLEMENTATION`**

---

```text
================================================================================
STATUS: TOQ REGISTRY COMPLETED (READY FOR IMPLEMENTATION PHASES)
================================================================================
```
