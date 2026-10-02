# WAYNAH-LOGIC-003

## USERS & JOURNEYS STUDY — REVISED VERSION FOR REVIEW

> **نوع الوثيقة:** وثيقة دراسة مجال وتأطير منطقي لسلوك المستخدمين ورحلات التفاعل في منتج WAYNAH (وينه؟) — النسخة المنقحة (Revised Version).
> **STATUS:** **`LOCKED`** (Locked Date: **1 October 2026**).
> **المرجعية والمداخلات المستقرة (Locked Inputs):**
> - `WAYNAH-LOGIC-001 — SYSTEM LOGIC MASTER STUDY` (**LOCKED**)
> - `WAYNAH-LOGIC-002 — REAL-WORLD ACTIVITIES & OPERATING MODELS STUDY` (**LOCKED**)
> - `GEOGRAPHIC_DATA_CONTRACT` (`GEO-001` → `GEO-005`) (**LOCKED**)
> **العلامة البرمجية للمشروع:** `M.GH.AL` | **النطاق التجريبي الأول:** محافظة حجة – الجمهورية اليمنية.
> **قاعدة حاكمة ممتدة:** لا تتضمن هذه الوثيقة أي كود برمجي، أو مخطط قاعدة بيانات (Prisma Schema)، أو إنشاء Migrations، أو تصاميم واجهة مستخدم (UI Components)، أو محركات تنفيذ تقنية (Engines). أي عنصر تنفيذي يوسم صراحة بـ `DEFER TO IMPLEMENTATION`.

---

## 1. Executive Summary (الملخص التنفيذي)

تأتي هذه الدراسة المنقحة (**WAYNAH-LOGIC-003: USERS & JOURNEYS STUDY**) كخطوة رسمية في خارطة طريق مشروع **WAYNAH** لبناء فهم عميق وشامل للفاعل الإنساني والتشغيلي (Users & Operational Actors) والنوايا السلوكية (Intents) والرحلات الواقعية (Real-World Journeys) المستخلصة من النماذج التشغيلية الـ 41 المقفلة في `LOGIC-002`.

تؤكد هذه الدراسة أن مستخدم **WAYNAH** ليس مجرد "عميل متجر إلكتروني" يتبع مساراً خطياً واحداً (بحث ← إضافة للسلة ← دفع ← توصيل)، بل هو فاعل يتراوح بين المستكشف المكاني الباحث عن معلومة أو معلم عام، والباحث عن رقم تواصل، والزائر الميداني للموقع، وطالب الخدمة الميدانية في منزله، والمتفاوض على أثاث أو مقاولة، والمشتري لسلسلة منتجات تجزئة، وصاحب العمل المستقل، ومشغّل الفيلد الميداني، ومراجع التحقق.

### أهم النتائج المنطقية لدراسة المستخدم والرحلات:

1. **تعددية أدوار المستخدمين وتجريد الكيانات التشغيلية [DESIGN CANDIDATE]:**
   المستخدم في WAYNAH يتم تحليله عبر أبعاد مركبة (User Type, Persona, Operational Actor, Business Actor, System Actor). الفاعل البشري قد يمارس دور مستكشف في رحلة، ودور صاحب نشاط تجاري في رحلة أخرى، أو دور مزود خدمة متنقل. لا يجوز تحويل هذا التعدد مباشرة إلى أدوار تقنية صلبة (Static Roles) أو Database Models في هذه المرحلة.

2. **التصنيف المتكامل لنوايا المستخدم (User Intent Taxonomy) [DESIGN CANDIDATE]:**
   نوايا المستخدم تتنوع بين 12 نية أساسية (Discovery, Location, Contact, Availability, Price, Service, Booking, Request, RFQ, Product, Trust, Navigation). تختلف الرحلة الناتجة جذرياً باختلاف النية وطبيعة النشاط الجغرافي.

3. **التصنيف المقترح للرحلات الرئيسية العشر (Primary Journey Taxonomy A–J) [DESIGN CANDIDATE]:**
   تعتمد الوثيقة تصنيفاً ينحصر في **10 رحلات رئيسية فقط (Journeys A through J)** تغطي كافة احتمالات التفاعل من الاكتشاف الخالص (Discovery Only)، التواصل، الزيارة الميدانية، الطلب، عروض الأسعار (RFQ)، الشراء، والتنفيذ الميداني أو عن بُعد، وحتى المعاملات الخارجية. أما تدفقات الحجز (Booking) والالتزام بالشراء (Order) فهي تدفقات تعهد وتفاعل (Commitment / Interaction Sub-Flows) تنشأ داخل الرحلات الرئيسية المناسبة ولا تشكل رحلات رئيسية إضافية خارج A–J.

4. **الرحلة المكتملة داخل وخارج المنصة (Internal vs External Completion) [WORKING HYPOTHESIS | MEDIUM]:**
   تؤكد الدراسة أن **WAYNAH** يثبت القيمة بدءاً من مرحلة الاكتشاف المكاني وإتاحة التواصل المباشر. بالتالي، فإن المعاملة التي تبدأ باكتشاف مكان أو خدمة في المنصة وتكتمل عبر اتصال هاتفي أو زيارة ميدانية تعتبر رحلة مكتملة ناجحة من منظور القيمة المستخدمة (WAYNAH External Completion)، وتظل هذه المسألة مسجلة كفرضية عمل ترتبط بالكامل بالـ Open Question #10 الموروث من `LOGIC-002`.

5. **استقلالية رحلات الفاعلين الداعمة (Supporting Operational Workflows) [DESIGN CANDIDATE]:**
   تم تصنيف رحلات مالك النشاط (Business Owner)، والمزود (Provider)، وماسح البيانات الميداني (Field Operator)، ومراجع التحقق (Verification Operator) كـ **مسارات تشغيلية داعمة للفاعلين (Supporting Operational Workflows)**. هذه التدفقات ليست جزءاً من Primary Journey Taxonomy A–J، ولا تضيف Journey Codes جديدة.

6. **استيعاب قيود البيئة المحلية اليمنية (Yemeni Real-World Context) [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]:**
   تم صياغة جميع الرحلات والنقاط الاستشارية مع الأخذ بالاعتبار طبيعة الاتصال المتقطع بالإنترنت، الهواتف الذكية منخفضة المواصفات، الاعتماد الهائل على المكالمات الهاتفية وWhatsApp، الملاحة المعتمدة على المعالم (Landmarks) بدلاً من العناوين البريدية، وتجربة الاستخدام باللغة العربية واعتياد واجهات RTL.

---

## 2. Study Objective (أهداف الدراسة)

تهدف دراسة **WAYNAH-LOGIC-003** إلى الإجابة المنهجية عن الأسئلة الحاكمة لسلوك ورحلات المستخدمين قبل الانتقال إلى صياغة علاقات الكيانات (Entity Relationships) أو تصميم التنفيذ التقني:

* **من هم مستخدمو WAYNAH؟** ما تصنيفاتهم وأهدافهم ومشاكلهم ومستويات الثقة والمعلومات التي يحتاجونها؟
* **كيف تبدأ الرحلة وتتطور؟** كيف يكتشف المستخدم المكان أو النشاط أو الخدمة؟ ومتى يتحول من الاكتشاف إلى الاتصال، الزيارة الميدانية، الطلب، الحجز، طلب عرض السعر (RFQ)، الشراء، أو الانتقال للتنفيذ (Fulfillment)؟
* **أين تنتهي الرحلة؟** متى تعتبر الرحلة مكتملة داخل المنصة؟ ومتى تنتقل وتكتمل خارج المنصة؟
* **ما هي نقاط القرار والفشل والانسحاب؟** ما الأسباب التي تؤدي إلى تعثر الرحلة أو انسحاب المستخدم، وكيف ترتبط بالثقة والجغرافيا ونوع النشاط؟
* **كيف تختلف الرحلات بحسب نموذج النشاط؟** كيف تتمايز رحلة اكتشاف معلم، عن رحلة زيارة ميدانية لمحل أثاث، عن طلب سباك متنقل، عن شراء منتج، عن حجز كشف طبي؟

---

## 3. Methodology (المنهجية المتبعة)

تعتمد هذه الدراسة على تحليل المجال التشغيلي والسلوكي (Domain & Behavioral Modeling) والتفاعل الإنساني-الرقمي (HCI / UX Domain Analysis) القائم على البيئة الواقعية لليمن ومحافظة حجة:

1. **الاعتماد الصارم على الدراسات المقفلة:** التعامل مع `LOGIC-001` و `LOGIC-002` و عقود الجغرافيا `GEO-001..005` كـ **Inputs صلبة ومستقرة**.
2. **التحليل الوظيفي والسلوكي للمستخدمين:** تفكيك الفاعلين إلى أدوار تشغيلية وسلوكية ورؤية أهداف كل فاعل ومشاكله دون تحويل ذلك مباشرة إلى Schema أو DB Models.
3. **نمذجة الرحلات عبر سيناريوهات مستقلة:** بناء رحلات مرجعية من النية إلى النتيجة وتحديد حالات الرحلة (Journey States) ونقاط القرار (Decision Points).
4. **اختبار الرحلات مقابل الأنشطة الـ 41:** التأكد من أن النموذج السلوكي يستوعب تنوع المجموعات الـ 10 من الأنشطة في `LOGIC-002`.
5. **الامتثال لمراميز الأدلة (Evidence Discipline):** وسم كل نتيجة وتوصية بالرمز المناسب لبيان درجة إثباتها، وتجنب منح صفة `FACT` للملاحظات والفرضيات السلوكية والتصميمية.

---

## 4. Evidence Discipline (انضباط مراميز الأدلة)

تلتزم هذه الوثيقة بنفس مراميز الأدلة المعتمدة رسمياً في `LOGIC-002` لضمان الشفافية والموضوعية:

* **`FACT`**: حقيقة هيكلية أو جغرافية أو إدارية مثبتة ومستقرة في قرار مقفل سابق بالمشروع.
* **`SOURCE-BACKED`**: معلومة مدعومة بمصادر رسمية أو أدلة تشغيلية موثوقة.
* **`OBSERVED`**: ممارسة تشغيلية تم ملاحظتها ميدانياً في حجة واليمن.
* **`OBSERVATION — NOT STATISTICALLY VALIDATED`**: ملاحظة سلوكية أو تشغيلية نوعية غير مدعومة بإحصاء كمي مسحي.
* **`WORKING HYPOTHESIS`**: فرضية عمل توجيهية للتحليل ولا تشكل قاعدة تقنية.
* **`DESIGN CANDIDATE`**: مقترح للمفهوم المنطقي ينتظر الحسم في دراسات العلاقات والتنفيذ.
* **`CONCEPTUAL IMPLICATION`**: استنتاج معماري مفاهيمي توجيهي غير ملزم تقنياً.
* **`SPECIALIST REQUIRED`**: مسألة تتطلب دراسة قانونية، تنظيمية، لوجستية، أو UX من متخصص.
* **`DEFER TO IMPLEMENTATION`**: مسألة تقنية تنفيذية تأجلت صراحة لمرحلة التنفيذ.
* **`OPEN QUESTION`**: مسألة سلوكية أو تشغيلية حاسمة تتطلب تحليلاً أو اختباراً لاحقاً.

مستويات الثقة المرافقة: **`HIGH`** / **`MEDIUM`** / **`LOW`**.

---

## 5. User Ecosystem (منظومة المستخدمين والفاعلين)

تتألف منظومة مستخدمي **WAYNAH** من شبكة تفاعلية تضم أطراف الطلب (Demand Side)، وأطراف العرض والتشغيل (Supply & Operational Side)، وأطراف بيانات المجتمع والمسح الميداني (Data & Field Side)، وأطراف الحوكمة والتحقق (Governance & Verification Side).

```
                      ┌─────────────────────────────────────────┐
                      │          WAYNAH User Ecosystem          │
                      └────────────────────┬────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴──────────────┬──────────────────┐
         ▼                  ▼                             ▼                  ▼
┌──────────────────┐ ┌─────────────┐             ┌──────────────────┐ ┌─────────────┐
│   Demand Side    │ │ Supply Side │             │ Data & Field Side│ │ Governance  │
└────────┬─────────┘ └──────┬──────┘             └────────┬─────────┘ └──────┬──────┘
         │                  │                             │                  │
 • Explorer/Visitor  • Business Owner              • Field Operator    • System Admin
 • Registered User   • Business Manager           • Community Contrib • Verification
 • Service Requester • Branch Operator            • Local Guide         Operator
 • Product Buyer     • Provider (Independent/Staff)
```

تتميز هذه المنظومة بأن العضو الواحد قد ينتقل بين الأدوار بحسب السياق التشغيلي والنية الحالية. [DESIGN CANDIDATE]

---

## 6. User Types (تصنيف أنواع المستخدمين)

لتحليل مستخدمي **WAYNAH** بواقعية، تم تفكيك الفئات المختلفة إلى أبعادها الوظيفية والسلوكية والتنفيذية دون دمج تعسفي: [DESIGN CANDIDATE]

| الفئة / الاسم | User Type | Persona | Operational Actor | System Actor | Business-side Actor | الوصف والهدف الرئيسي |
|---|---|---|---|---|---|---|
| **الباحث / المستكشف** | Visitor / User | Explorer | Discoverer | Anonymous/Auth | No | يبحث عن أماكن، معالم، أو أنشطة قريبة بلا حساب أو بنية معاملة. |
| **العميل المحترس** | Registered User | Trust Seeker | Evaluator | Authenticated | No | يبحث عن جهة موثوقة ذات بيانات مؤكدة ورقم تلفون يعمل. |
| **طالب الخدمة** | Service Customer | Requester | Client | Authenticated | No | يحتاج تنفيذ خدمة (منزلية، صيانة، كشف طبي) ويريد مزوداً مناسباً. |
| **المشتري** | Product Buyer | Buyer | Orderer | Authenticated | No | يبحث عن سلعة محددة، يتأكد من التوفر والسعر، ويريد الشراء والاستلام. |
| **مالك النشاط** | Business Owner | Enterprise Owner | Decision Maker | Authenticated | Yes | يهدف لإشهار نشاطه، توثيق البيانات، إدارة العروض، واستقبال العملاء. |
| **مدير النشاط** | Business Manager | Operator | Controller | Authenticated | Yes | يدير العمليات اليومية، تحديث الساعات، واستقبال الاستفسارات والطلبات. |
| **مشغّل الفرع** | Branch Operator | Site Operator | Local Dispatcher | Authenticated | Yes | يدير التوفر والخدمات الميدانية الخاطفة بفرع تشغيلي محدد. |
| **المزود المستقل** | Independent Provider| Freelancer | Field Executor | Authenticated | Yes | حرفي/مهني متنقل يعمل بدون مكان ثابت ويغطي نطاقاً جغرافياً. |
| **المزود التابع** | Staff Provider | Employee | Specialist | Authenticated | Yes | طبيب بعيادة أو فني بشركة ينفذ الخدمة المسندة إليه من المنشأة. |
| **جامع البيانات الميداني**| Field Operator | Surveyor | Data Collector | Authenticated | Internal | يمسح الأماكن ميدانياً، يوثق الصور والإحداثيات، ويرفع الأدلة. |
| **المساهم المجتمعي** | Community Contributor| Local Guide | Reporter | Authenticated | No | يقترح أماكن جديدة، يبلغ عن إغلاق، ويصحح أرقام التواصل. |
| **مشغّل التحقق** | Verification Operator| Auditor | Claim Reviewer | Authenticated | Governance | يفحص أدلة الملكية والوجود والمستندات ويصدر قرارات التحقق النطاقية. |
| **مسؤول النظام** | Administrator | Admin | Governance Manager | Authenticated | Governance | يدير التصنيفات، السياسات، الصلاحيات، وطوابير النزاعات. |

---

## 7. Operational Actors (الأطراف والفاعلون التشغيليون)

يجب الفصل المفاهيمي الدقيق بين **الحساب التقني (User Account)** والـ **الفاعل التشغيلي (Operational Actor)**: [CONCEPTUAL IMPLICATION / DESIGN CANDIDATE]

1. **Demand-Side Actors:**
   * **Anonymous Visitor:** يمتلك حق الاستكشاف المباشر والاستعلام دون التسجيل.
   * **Authenticated Customer:** يمتلك القدرة على حفظ الأماكن، إرسال الاستفسارات، تقديم الطلبات، والحجز.

2. **Supply-Side Actors:**
   * **Business Representative (Owner/Manager):** يمثل الهوية التجارية القانونية أو التشغيلية للنشاط.
   * **Operating Presence Actor (Branch/Shop Operator):** يمثل المظهر التشغيلي المحلي المباشر في موقعه المادي.
   * **Execution Provider (Independent or Stationed):** الفرد الذي يقدم الخدمة الفعلية للعميل (مثل السباك، الكهربائي، الطبيب).

3. **Platform & Governance Actors:**
   * **Field Data Collector:** الفاعل الذي يجمع إثباتات الوجود الميداني (Existence Evidence).
   * **Verification Reviewer:** الفاعل المخول بفحص المطالبات وإصدار التوثيق النطاقي (Scoped Verification).

---

## 8. User Intent Taxonomy (تصنيف نوايا المستخدمين)

تتنوع النية التي يدخل بها المستخدم إلى منصة **WAYNAH**، وتعتبر النية هي الموجه الأساسي للرحلة التي سيسلكها: [DESIGN CANDIDATE]

```
                               ┌──────────────────────────┐
                               │   User Intent Taxonomy   │
                               └────────────┬─────────────┘
                                            │
   ┌─────────────────┬──────────────────────┼──────────────────────┬─────────────────┐
   ▼                 ▼                      ▼                      ▼                 ▼
┌──────────────┐ ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Discovery    │ │ Location /   │    │ Availability │    │ Pricing /    │    │ Service /    │
│ Intent       │ │ Navigation   │    │ / Contact    │    │ RFQ Intent   │    │ Booking      │
└──────────────┘ └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
"ماذا يوجد حولي؟" "أين المكان وكيف"  "هل هو مفتوح وهاتفه"  "كم السعر وهل يوجد"  "من ينفذ الخدمة"
                  أصل إليه؟"          يعمل؟"               عرض خاص؟"           ومتى يحجز؟"
```

### التفصيل المباشر للنوايا الـ 12:

1. **Discovery Intent (نية الاستكشاف):** "أريد معرفة ماذا يوجد حولي في هذه المنطقة/الحي من خدمات أو أنشطة".
2. **Location Intent (نية الموقع):** "أعرف اسم المكان أو الفئة، وأريد معرفة موقعه الدقيق ومعالمه القريبة".
3. **Contact Intent (نية التواصل):** "أريد رقم هاتف، WhatsApp، أو وسيلة تواصل مباشرة للحديث مع المسؤول".
4. **Availability Intent (نية التوفر والدوام):** "هل المحل مفتوح الآن؟ هل الطبيب موجود في العيادة اليوم؟".
5. **Price Intent (نية السعر):** "كم سعر هذه السلعة أو الخدمة المعلن، وهل السعر ثابت أم يتطلب تفاوضاً؟".
6. **Service Intent (نية الخدمة):** "أبحث عن فني/مزود متخصص يستطيع المجيء إلى منزلي أو تنفيذ هذه المهارة".
7. **Booking Intent (نية الحجز):** "أريد حجز موعد محدد أو دور في طابور عيادة/صالون/مركز".
8. **Request Intent (نية الطلب):** "أريد تقديم طلب احتياج للخدمة أو فحص ميداني ليقوم المزود بتقييمه".
9. **RFQ Intent (نية طلب عرض سعر):** "أريد مواصفات أثاث/مقاولة/تجهيز شمسية وأحتاج عرض سعر مخصص (Quote)".
10. **Product Intent (نية السلعة):** "أبحث عن منتج محدد (قطع غيار/دواء/جهاز) في المحلات القريبة".
11. **Trust Intent (نية الثقة والتوثيق):** "أريد التأكد من أن هذه المنشأة حقيقية وتملك ترخيصاً وموثوقة قبل التعامل".
12. **Navigation Intent (نية الملاحة والوصول):** "أريد خطة السير والاتجاهات الميدانية للوصول إلى المكان بنفسي".

---

## 9. Discovery Journeys (Journey A — Discovery Only)

### مسار الرحلة:
**`Need` → `Search / Browse` → `Results` → `Evaluate Place Info` → `Completion (Internal Value Achieved)`**

```
┌────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌───────────────────┐    ┌──────────┐
│  Need  │───>│ Search / Browse │───>│ Display Results │───>│ Evaluate Place    │───>│ Journey  │
│        │    │ Category / Area │    │ Map / List View │    │ Info & Trust      │    │ Complete │
└────────┘    └─────────────────┘    └─────────────────┘    └───────────────────┘    └──────────┘
```

* **الهدف:** العثور على مكان، معلم، صيدلية طوارئ، أو جهة حكومية واكتفاء المستخدم بالمعلومة. [DESIGN CANDIDATE]
* **نوع المستخدم:** Explorer / Visitor / Local Resident.
* **المعلومات المطلوبة:** الاسم، الفئة، الحي/المعلم الوصفي، الإحداثيات، ساعات العمل المعلنة، ومصدر البيانات.
* **مستوى الثقة المطلوب:** Existence Verified أو Observation Confidence مقبولة.
* **نقطة انتهاء الرحلة:** حفظ المكان، قراءة البيانات، أو إغلاق الشاشة. لا توجد أي معاملة أو اتصال. تعتبر رحلة **ناجحة ومكتملة كلياً داخل WAYNAH**. [DESIGN CANDIDATE]

---

## 10. Contact Journeys (Journey B — Discovery → Contact)

### مسار الرحلة:
**`Need` → `Search` → `Evaluate` → `Contact Action (Call / WhatsApp)` → `External Interaction`**

* **الهدف:** العثور على النشاط والتواصل المباشر هاتفياً أو عبر WhatsApp للاستفسار أو الشراء الشفهي. [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]
* **نوع المستخدم:** Customer / Trust Seeker.
* **المعلومات المطلوبة:** رقم هاتف فعال وموثق (Contact Verified)، اسم الشخص المسؤول، والدوام.
* **نقاط القرار:** هل الرقم موثق؟ هل توجد استجابة؟ هل يفضل العميل المكالمة المباشرة؟
* **انتقال الرحلة:** **تنتقل الرحلة من داخل WAYNAH إلى خارجها بمجرد النقر على زر الاتصال/الواتساب.**
* **حالة الاكتمال:** تعتبر رحلة **مكتملة من منظور القيمة في WAYNAH (WAYNAH External Completion)**. لا يمتلك النظام رؤية لما يحدث بعد الاتصال الهاتفي الخارجي. [WORKING HYPOTHESIS | MEDIUM]

---

## 11. Visit Journeys (Journey C — Discovery → Visit)

### مسار الرحلة:
**`Need` → `Search / Browse` → `Evaluate Place` → `Navigate / Directions` → `Physical Arrival` → `On-site Visit / Completion`**

```
┌────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌──────────┐
│  Need  │───>│ Search / Browse │───>│ Evaluate Place  │───>│ Navigate /      │───>│ Physical Arrival │───>│ Journey  │
│        │    │ Category / Area │    │ Location/Status │    │ Landmark Direct │    │ & On-site Visit  │    │ Complete │
└────────┘    └─────────────────┘    └─────────────────┘    └──────────────────┘    └──────────────────┘    └──────────┘
```

* **الهدف (Purpose):** تمكين المستخدم من الانتقال الميداني الفعلي من موقعه الحالي إلى موقع المكان (Place) للتسوق الشفهي، تلقي خدمة في المقر، أو المراجعة الحكومية/الطبية. [DESIGN CANDIDATE]
* **المستخدم/الممثلون (Actors):** Explorer / Local Visitor ↔ Place / Branch Operator.
* **Need / Intent:** نية وصول مكاني وملاحة ميدانية لمشاهدة المعرض، الشراء المباشر، أو مراجعة المعلم/العيادة.
* **شرط البدء (Entry Condition):** اختيار مكان محدد ذي موضع مادي صريح (`Physical Location`).
* **Search / Browse & Place Evaluation:** تصفح الفهارس الجغرافية، فحص الدوام، التأكد من المعلم المرجعي (مثل "بجانب جامع الصالح" أو "شارع المستشفى")، وتدقيق حالة الوجود الجغرافي (`Existence Verified`).
* **Navigate & Physical Visit:** التوجيه الجغرافي الخارجي عبر الإحداثيات المرجعية والمعلم الوصفي الميداني للوصول إلى الموضع المادي.
* **Completion (الإنهاء):** تعتبر هذه الرحلة رحلة مكتملة من منظور WAYNAH بمجرد التوجيه الجغرافي والوصول الميداني الخارجي. [WORKING HYPOTHESIS | MEDIUM]
* **نقاط القرار (Decision Points):** هل الإحداثيات دقيقة؟ هل المعلم الوصفي واضح؟ هل الدوام نشط الآن؟ هل توجد مواقف أو مدخل إلكتروني؟
* **متطلبات الثقة (Trust Requirements):** `Location Verified`, `Existence Verified` ورقم هاتف متاح للاستدلال عند الضياع.
* **السياق الجغرافي (Geographic Context):** الـ `PlaceLocation` والسياق الإداري (`Administrative Context`) ونقاط الملاحة لا تختلط كلياً مع نطاق الخدمة المتنقلة (`Service Coverage`) أو نطاق عمل النشاط المظلي (`Business Scope`).
* **حالات الفشل والانسحاب (Failure / Abandonment Cases):** خطأ في الإحداثيات الميدانية، المكان مغلق عند الوصول، تغير موقع المحل دون تحديث، أو صعوبة الوصول بسبب التضاريس الجبلية. [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]
* **العلاقة مع Place و Business و Branch:** المكان (`Place`) هو الموضع المادي المزار جغرافياً؛ النشاط (`Business`) هو الهوية المظلية؛ والفرع (`Branch`) هو الوحدة التشغيلية المحلية إن وجدت.
* **ماذا يحدث عند فشل الوصول أو القدم:** يتاح للمستخدم تقديم بلاغ تصحيح جغرافي (`Community Report`) أو النقر للاتصال المباشر بالمسؤول لاستدلال الطريق.
* **العلاقة مع المعاملات الخارجية (External Transactions):** العملية التجارية التي تتم أثناء الزيارة الميدانية (كشراء أثاث أو الدفع نقداً) تعتبر معاملة خارجية تقع خارج المنصة كلياً.

---

## 12. Service Journeys (Journey D — Service Request & Execution)

### مسار الرحلة:
**`Need` → `Search Provider/Service` → `Evaluate Capability` → `Request / Inquiry` → `Provider Accept` → `Service Execution` → `Completion`**

* **الهدف:** الحصول على خدمة مادية (سباكة، كهرباء، صيانة سيارة) في موضع ثابت أو لدى العميل. [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]
* **نوع المستخدم:** Service Customer / Homeowner.
* **أنواع الفاعلين المشاركين:** Requester ↔ Independent Provider / Business Manager.
* **نقاط القرار:** هل يغطي المزود منطقة العميل (Coverage Check)؟ هل النطاق واضح؟ هل اتفق الطرفان على الأجرة والوقت؟
* **الفرق التشغيلي:** الخدمة تتطلب **أداء إنسانياً وسياقاً زمنياً/مكانياً** وليست سلعة مخزنة.
* **العلاقة الجوهرية مع Journey H:** **تمثل الرحلة H مساراً رئيسياً متخصصاً ضمن مجال الخدمات الأوسع الذي تمثله الرحلة D، وتم فصلها لأن تنفيذ الخدمة في موقع العميل يضيف شروطاً جغرافية وخصوصية وتغطية ووصولاً تختلف عن المسار العام لطلب الخدمة وتنفيذها.** *(Journey H is a specialized primary journey variant of the broader service domain represented by Journey D; it is separated because customer-site execution introduces distinct geographic, privacy, coverage, and arrival conditions.)* [CONCEPTUAL IMPLICATION]
* **الاعتماد الجغرافي:** يعتمد التفاعل على `Service Coverage Area` وليس بالضرورة على `Place` ثابت للمزود. [CONCEPTUAL IMPLICATION / DESIGN CANDIDATE]

---

## 13. RFQ Journeys (Journey E — RFQ & Custom Contracting)

### مسار الرحلة:
**`Need` → `Search Provider/Workspace` → `Specify Requirements / Specs` → `RFQ Submission` → `Quote Offer` → `Negotiation` → `Agreement`**

* **الهدف:** الحصول على عرض سعر مخصص لعملية أو معاينة غير محددة السعر مسبقاً (تفصيل أثاث، تركيب منظومة شمسية، مقاولة حدادة في صالة العرض أو الورشة / Workspace). [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]
* **طبيعة السعر:** **لا يوجد سعر ثابت مسبقاً (No Fixed Price)**. السعر يتحدد بناءً على رفع المقاسات والمواصفات ورسوم المواد والتنفيذ.
* **حالة الرحلة التشغيلية:** تمر عبر `Inquiry` ← `Request` ← `RFQ` ← `Quote` ← `Agreement`.
* **فشل الرحلة:** يقع الفشل عند عدم رد المزود، المبالغة في السعر، أو عدم مطابقة الأثاث/التأثيث للمواصفات عند المعاينة. [OBSERVED | HIGH]

---

## 14. Product Journeys (Journey F — Product Discovery & Purchase)

### مسار الرحلة:
**`Need` → `Search Product / Item Identifier` → `Evaluate Availability & Price` → `Order Draft` → `Merchant Accept` → `Fulfillment`**

* **الهدف:** شراء سلعة محددة بـ Product / Item Identifier (قطع غيار، هاتف، أجهزة منزلية، مواد غذائية) دون افتراض مسبق لبنية باركود/SKU تقنية صلبة. [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]
* **شروط البدء في المنصة:** تفعل هذه الرحلة فقط للأنشطة التي تمتلك قدرة صريحة (`Product Catalog` & `Order Processing`) وفق `LOGIC-002`.
* **نقاط القرار:** هل السلعة متوفرة فعلياً في المحل؟ هل السعر محدث (مراعاة التغير السريع للأسعار)؟ هل الاستلام باليد أم بالتوصيل؟
* **حالات الفشل:** تغير السعر الفجائي بين وقت البحث والطلب، أو نفاد المخزون الميداني دون تحديث المنصة. [OBSERVED | HIGH]

---

## 15. Order Fulfillment Journeys (Journey G — Fulfillment & Delivery Execution)

### مسار الرحلة:
**`Accepted Order / Request` → `Fulfillment Preparation` → `Pickup OR Merchant Delivery OR Third-Party Carrier` → `Handover & Proof` → `Completion`**

* **النماذج التشغيلية للتنفيذ (Fulfillment Types):** [OBSERVED | HIGH]
  1. **Customer Pickup (الاستلام الذاتي):** العميل يذهب بنفسه إلى المحل لاستلام الطلب.
  2. **Merchant Delivery (توصيل البائع):** صاحب البقالة أو المطعم يرسل الطلب مع عامل المحل.
  3. **Third-Party Carrier (ناقل مستقل):** الاستعانة بسائق فرزة أو دباب لنقل البضاعة.
* **الفصل الحاكم المقفل:** **Order ≠ Fulfillment ≠ Delivery**.
* **ملاحظة المسؤولية القانونية والتشغيلية عن التوصيل:** **مسؤولية WAYNAH عن التوصيل ليست محسومة في هذه الدراسة، وتبقى خاضعة لدراسة تشغيلية وقانونية/تعاقدية مستقلة [OPEN QUESTION / SPECIALIST REQUIRED]. أما التفاصيل التقنية للتنفيذ فتظل مؤجلة لمرحلة التنفيذ [DEFER TO IMPLEMENTATION].**

---

## 16. Mobile / Field Journeys (Journey H — المزود المتنقل والميداني)

### مسار الرحلة:
**`Need` → `Search Mobile Provider` → `Check Service Coverage` → `Request / Call` → `Provider Travels to Customer Site` → `On-site Service` → `Completion`**

```
┌────────┐    ┌─────────────────┐    ┌────────────────────┐    ┌──────────────────┐    ┌─────────────┐
│ Customer│───>│ Search Mobile   │───>│ Check Service      │───>│ Provider Travels │───>│ On-site     │
│ Need   │    │ Technician      │    │ Coverage Area      │    │ to Customer Site │    │ Service &   │
└────────┘    └─────────────────┘    └────────────────────┘    └──────────────────┘    │ Completion  │
                                                                                       └─────────────┘
```

* **الخصوصية التخصصية كـ Primary Journey Variant:** **تمثل الرحلة H مساراً رئيسياً متخصصاً ضمن مجال الخدمات الأوسع الذي تمثله الرحلة D، وتم فصلها لأن تنفيذ الخدمة في موقع العميل يضيف شروطاً جغرافية وخصوصية وتغطية ووصولاً تختلف عن المسار العام لطلب الخدمة وتنفيذها.** *(Journey H is a specialized primary journey variant of the broader service domain represented by Journey D; it is separated because customer-site execution introduces distinct geographic, privacy, coverage, and arrival conditions.)* [CONCEPTUAL IMPLICATION]
* **الخصائص الجغرافية:** المزود يعمل **بدون Place استقبال عام ثابت**. يتم التعبير عن موقعه بـ `Service Coverage Area` (مديرية أو شعاع تغطية). [CONCEPTUAL IMPLICATION / DESIGN CANDIDATE]
* **حماية الخصوصية:** ينشر موقع العميل الدقيق للمزود **فقط بعد قبول الطلب والاتفاق**، لضمان عدم تسريب العناوين المنزلية للعامة. [DESIGN CANDIDATE]

---

## 17. Remote Journeys (Journey I — الخدمات الرقمية وعن بُعد)

### مسار الرحلة:
**`Need` → `Search Remote Specialist` → `Inquire / Scope Definition` → `RFQ & Agreement` → `Digital Delivery` → `Remote Completion`**

* **طبيعة الخدمة:** مبرمج، مصمم، مترجم، أو مستشار قانوني/مالي يقدم خدمته كلياً عبر شبكة الإنترنت. [OBSERVED | HIGH]
* **الجغرافيا:** الخدمة لا تخضع لقيود المسافة المكانية أو التغطية الجغرافية المحلية. ترتبط بسياق إداري مرجعي للأداء والتوثيق فقط. [CONCEPTUAL IMPLICATION / DESIGN CANDIDATE]

---

## 18. External Transaction Journeys (Journey J — المعاملات الخارجية)

### مسار الرحلة:
**`Discovery on WAYNAH` → `Obtain Contact / Address` → `Leave Platform` → `In-Person / Phone Transaction`**

* **الدراسة التحليلية:** هل تعتبر هذه الرحلة مكتملة من منظور **WAYNAH**؟
* **النتيجة المنطقية:** **تعتبر هذه المسألة فرضية عمل (Working Hypothesis)** تفيد بأن المنصة تؤدي دورها بنجاح بمجرد ردم فجوة الاكتشاف وإيصال العميل بالنشاط. وتظل هذه النتيجة مرتبطة بالكامل بـ Open Question #10 الموروث من `LOGIC-002` دون ادعاء حسمها نهائياً. [WORKING HYPOTHESIS | MEDIUM]

---

## 19. Commitment & Interaction Flows (تدفقات التعهد والتفاعل — Booking & Order Sub-Flows)

تؤكد هذه الدراسة المنقحة التزاماً صارماً بالتصنيف الموحد للرحلات (Primary Journey Taxonomy A–J = 10 الرحلات الرئيسية فقط). وبالتالي، فإن الحجز (Booking) والالتزام بالشراء (Order) **ليسا رحلات رئيسية مستقلة خارج A–J (ولا توجد Journey K أو L)**، بل هما تدفقات تعهد وتفاعل ضمتية (Commitment / Interaction Sub-Flows) تظهر داخل الرحلات الرئيسية المناسبة (مثل Journey D و F و G): [DESIGN CANDIDATE]

### 1. تدفق حجز المواعيد والأدوار (Booking Sub-Flow):
* **المجال:** ينشأ داخل Journey D أو C أو G عند الحاجة لتخصيص **وقت / سعة استيعابية (Time Slot / Capacity)** في عيادة أو صالون أو مركز تدريب.
* **نقاط القرار:** توفر الوقت، تأكيد الحجز، والتزام الطرفين بالحضور (مراعاة مخاطر No-Show).

### 2. تدفق الالتزام بالشراء (Order Sub-Flow):
* **المجال:** ينشأ داخل Journey F أو E عند الوصول لاتفاق محدد العناصر والسعر والشروط بين المشتري والبائع.
* **التفريق الحاكم المقفل:** الـ `Order` هو وثيقة الالتزام، بينما الـ `Fulfillment` هو التنفيذ، والـ `Delivery` هو النقل المادي الخياري. [FACT | HIGH]

---

## 20. Supporting Operational Workflows (مسارات الفاعلين الداعمة للتشغيل والحوكمة)

تؤكد الوثيقة تصنيف مسارات جانب الأعمال والإدارة والتحقق التالية باعتبارها **مسارات تشغيلية داعمة للفاعلين (Supporting Operational Workflows / Supporting Actor Workflows)**:

> **تأطير مفاهيمي حاكم:**  
> **هذه التدفقات ليست جزءاً من Primary Journey Taxonomy A–J، ولا تضيف Journey Codes جديدة، وإنما تمثل مسارات تشغيلية داعمة للفاعلين التجاريين والمنصة والحوكمة.** [DESIGN CANDIDATE]

### 1. مسار مالك النشاط (Business Owner Supporting Workflow):
**`Search Place / Claim Request` → `Submit Evidence` → `Verification Review` → `Profile Setup` → `Manage Branches & Offers` → `Customer Interaction`**
* الهدف: إثبات الملكية، حماية العلامة، وتحديث البيانات لضمان الوصول للعملاء.

### 2. مسار المزود (Provider Supporting Workflow):
**`Create Profile` → `Define Capabilities & Coverage Area` → `Set Availability Status` → `Receive Requests` → `Execute & Complete`**
* الهدف: استقبال طلبات العمل الفردي أو الميداني وإشهار المهارات.

### 3. مسار جامع البيانات الميداني (Field Operator Supporting Workflow):
**`Receive Survey Task` → `Field Visit` → `Capture Coordinates & Photos` → `Record Observation Evidence` → `Submit Data Update`**
* الهدف: تحديث سجلات الأماكن وتأكيد الوجود الجغرافي وحالة الفتح.

---

## 21. Verification-related Journeys (مسار التوثيق النطاقي الداعم)

### مسار التوثيق النطاقي (Scoped Verification Supporting Workflow):
**`Claim Submission (Existence / Identity / Contact / License)` → `Evidence Upload` → `Audit Queue` → `Verification Reviewer Audit` → `Grant Scoped Verification` → `Audit Trail Record`**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Claim Submitted │───>│ Evidence Upload │───>│ Reviewer Audit  │───>│ Grant Scoped     │───>│ Record Audit    │
│ Specific Claim  │    │ Docs / Photos   │    │ Decision Gate   │    │ Claim Badge      │    │ History & Date  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └──────────────────┘    └─────────────────┘
```

* **مبدأ عدم التعميم المقفل:** التوثيق صادر لادعاء محدد وخاص (مثل `Contact Verified` أو `Existence Verified`) ولا يمنح شارة عامة ملتبسة ("موثق كلياً"). [FACT | HIGH]
* **التصنيف:** يعتبر هذا المسار تدفقاً تشغيلياً داعماً للحوكمة (`Supporting Operational Workflow`) ولا يضيف كود رحلة رئيسية جديدة خارج A–J. [DESIGN CANDIDATE]

---

## 22. Journey States (حالات الرحلة المنطقية)

تُمثل حالات الرحلة التالية التطور المنطقي الذي يمر به المستخدم خلال تفاعله مع المنصة. **هذه الحالات هي تأطير تحليلي سلوكي فقط، ولا تمثل State Machine تقنية أو Enum برمجي**: [DESIGN CANDIDATE]

* `Need`: نشوء الحاجة لدى المستخدم.
* `Discovery`: التصفح والبحث الجغرافي/التصنيفي.
* `Evaluation`: فحص بيانات المكان/النشاط والثقة وساعات العمل.
* `Comparison`: التمييز والمفاضلة بين خيارات متعددة.
* `Contact`: النقر للتواصل الهاتفي أو عبر الواتساب.
* `Inquiry`: الاستفسار عن توفر أو دواء أو سعر بلا التزام.
* `Request`: تقديم طلب خدمة أو معايرة غير محددة السعر.
* `RFQ`: طلب عرض سعر مخصص لمواصفات محددة.
* `Quote`: إرسال عرض السعر والمواعيد من قبل المزود.
* `Agreement`: قبول عرض السعر والاتفاق المتبادل.
* `Booking`: حجز دور أو وقت محدد في جدول المزود.
* `Order`: الالتزام بشراء سلعة محددة المواصفات والسعر.
* `Fulfillment`: مرحلة تجهيز أو تقديم الوعد المتفق عليه.
* `Pickup`: استلام العميل للسلعة بنفسه من المقر.
* `Delivery`: نقل السلعة عبر ناقل معلن للعميل.
* `Service Execution`: تنفيذ الخدمة الميدانية أو الحرفية فعلياً.
* `External Transaction`: إتمام العملية خارج المنصة.
* `Completion`: اكتمال الرحلة بنجاح واستيفاء القيمة.
* `Cancellation`: إلغاء الرحلة بقرار من أحد الطرفين.
* `Failure`: تعثر الرحلة لسبب تشغيلي أو جغرافي أو تقني.
* `Dispute`: حدوث نزاع على المواصفات أو الخدمة.
* `Abandonment`: توقف المستخدم وانسحابه من الرحلة قبل النتيجة.

---

## 23. Decision Points (نقاط القرار الحاسمة في الرحلة)

في كل مرحلة من رحلة المستخدم، توجد **بوابات قرار (Decision Gates)** تحدد استمرار الرحلة أو تحولها أو انسحاب المستخدم: [DESIGN CANDIDATE]

1. **هل وجدت ما أبحث عنه؟** (نجاح/فشل استعلام البحث).
2. **هل البيانات كافية ومحدثة؟** (تقييم الحداثة Freshness وثقة السجل).
3. **هل الموقع والحي والمعلم واضح؟** (وضوح الجغرافيا المكانية).
4. **هل الجهة مفتوحة أو متاحة الآن؟** (فحص ساعات الدوام أو حالة الدعم).
5. **هل السعر معروف ومناسب؟** (سعر معلوم ← Order / سعر متغير ← RFQ / تفاوض).
6. **هل الخدمة يغطيها المزود في منطقتي؟** (مطابقة Service Coverage Area).
7. **هل يحتاج المستخدم للاتصال الهاتفي المباشر أم يكتفي بالطلب الرقمي؟** (التوجيه لـ Contact Intent أو Request Flow).
8. **هل الزيارة الفعلية الميدانية لازمة قبل الشراء؟** (معاينة الأثاث أو قطع الغيار).
9. **هل المعاملة تكتمل داخلياً أم تنتقل كلياً للخارج؟** (الانتقال لـ External Interaction).

---

## 24. Failure & Abandonment Models (نماذج الفشل والانسحاب)

### أسباب انسحاب أو تعثر رحلة المستخدم [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]:

1. **عدم وجود نتائج بحث (No Search Results):** ناتج عن نقص التغطية في مديرية معينة أو تباين تهجئة اسم الحي.
2. **البيانات المتقادمة (Stale Data):** الذهاب لمحل وتبين أنه نقل موقعه أو أغلق، أو الاتصال برقم مقطوع.
3. **عدم استجابة التاجر/المزود (No Response):** إرسال استفسار أو طلب عبر المنصة ودون تلقي رد شفهي أو رقمي.
4. **فشل التغطية الجغرافية (Out of Coverage):** اكتشاف أن السباك أو التاكسي لا يصل إلى قرية العميل في حجة.
5. **غموض السعر والتوفر (Price/Availability Ambiguity):** الامتناع عن الشراء بسبب غياب السعر أو تقلبات الصرف.
6. **فشل التوصيل الميداني (Delivery Failure):** تعثر الناقل بسبب صعوبة التضاريس الجبلية أو سوء وصف المعلم.
7. **انقطاع الاتصال بالإنترنت (Network Drop):** انقطاع تغطية شبكة المحمول أثناء إجراء حجز أو طلب.
8. **غياب الثقة (Lack of Trust):** الخوف من الاحتيال لغياب أي إثبات أو توثيق للنطاق المعروض.

---

## 25. Trust Within the Journey (طبقات الثقة داخل الرحلة)

مبدأ حاكم: **"يحتاج المستخدم إلى مستويات مختلفة من الثقة بناءً على مرحلة الرحلة ونوع العملية"**. [WORKING HYPOTHESIS / DESIGN CANDIDATE]

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          Trust Progression Layers                         │
├─────────────────────┬─────────────────────────────────────────────────────┤
│ 1. Existence Trust  │ الثقة بأن المكان محدد وموجود فعلاً على الخريطة.    │
│ 2. Location Trust   │ الثقة بدقة الإحداثيات والمعلم الوصفي للوصول.       │
│ 3. Contact Trust    │ الثقة بأن رقم الهاتف يعمل ويخص النشاط المعني.       │
│ 4. Identity Trust   │ الثقة بهوية وتصريح صاحب العمل أو الفني.             │
│ 5. Capability Trust │ الثقة بقدرة المزود الفنية والتجهيزية على الأداء.     │
│ 6. Experience Trust │ الثقة المستمدة من تجارب العملاء السابقين (Reviews).  │
└─────────────────────┴─────────────────────────────────────────────────────┘
```

* **الفصل الحاكم المقفل:**
  * **Verification (التوثيق):** قرار إداري تدقيقي يستند على أدلة ومستندات.
  * **Review (التقييم):** رأي شخصي مستند على تجربة استخدام مثبتة.
  * **Observation Confidence (ثقة الملاحظة):** درجة حساسية السجل بناءً على حداثة المسح الميداني وتطابق المصادر.
  * **Business Claim (ادعاء الملكية):** طلب مقدم من المالك لا يمنح ثقة آلية قبل المراجعة. [FACT | HIGH]

---

## 26. Geographic Journey Context (السياق الجغرافي للرحلات)

ربط رحلات المستخدم بالمفاهيم الجغرافية الأربعة المقفلة في `GEO-001..005` و `LOGIC-002`: [FACT | HIGH]

1. **Fixed Place Journey (الأماكن الثابتة):** ترتبط بـ `Physical Location` صريح في مديرية معينة (`District`). العميل يبحث بالحي أو القرب.
2. **Mobile Provider Journey (المزود المتنقل):** ترتبط بـ `Service Coverage Area`. العميل لا يهمه مكان نوم/إقامة المزود، بل يهمه هل يشمل نطاق خدمته قريته/حيّه.
3. **Home-Based Journey (أنشطة المنازل):** تنشر `Discovery Context` (الحي العام) لحماية الخصوصية، وتكشف الموقع الدقيق فقط عند مرحلة التسليم/الاتفاق.
4. **Remote Journey (الخدمات عن بُعد):** تعمل بلا نطاق جغرافي مادي للأداء، وتعتمد على السياق الإداري للمستندات والتوثيق.

---

## 27. Activity Compatibility (اختبار الرحلات على الأنشطة الـ 41)

لتأكيد مرونة نموذج المستخدم ورحلاته، تم مطابقة الرحلات الرئيسية (Journeys A–J) على المجموعات الـ 10 من الأنشطة الـ 41 المقفلة في `LOGIC-002`: [DESIGN CANDIDATE]

| مجموعة الأنشطة | Journeys القابلة للتطبيق | النمط التشغيلي السائد في الرحلة |
|---|---|---|
| **Group A — Non-Commercial** | Journey A (Discovery), Journey C (Visit) | اكتشاف، معلومات، ملاحة ميدانية بلا معاملات مالية. |
| **Group B — Retail** | Journey A, B (Contact), C (Visit), F (Product), G (Fulfillment) | تصفح منتجات، تأكيد توفر، زيارة، شراء، استلام ذاتي أو توصيل. |
| **Group C — Wholesale** | Journey B, E (RFQ), F, G | طلبات بالشد/الطن، تسعير يومي، تفاوض بكميات، وشحن شاحنات. |
| **Group D — Hybrid Commerce** | Journey D (Service), E (RFQ), F (Product) | بيع جهاز مع طلب تركيب ميداني أو صيانة وتوريد قطع. |
| **Group E — Food** | Journey B, C (Visit), F (Product), G (Fulfillment) | طلبات سريعة، استهلاك يومي، استلام من المخبز/المطعم أو توصيل محلي. |
| **Group F — Services** | Journey B, D (Service Execution), E (RFQ) | سباكة، كهرباء، صيانة شمسية؛ تعتمد على المهارة ونطاق التغطية. |
| **Group G — Appointment** | Journey B, C (Visit), D, Booking Sub-Flow | حجز دور كشف طبي أو حلاقة، والالتزام بموعد زمني محدد. |
| **Group H — Mobile / Field** | Journey H (Mobile), B, D | المزود ينتقل بسيارته/صهريجه إلى موقع العميل بناءً على النطاق. |
| **Group I — Multi-Branch** | Journey A, B, C, D, F, G | اختيار الفرع الأقرب، واستهلاك عروض الفرع التشغيلي المحدد. |
| **Group J — Regulated** | Journey A, B, C (Visit), Scoped Verification Supporting Workflow | التأكد الصارم من التراخيص والجهات الرسمية قبل التفاعل. |

---

## 28. Journey Completion (مفهوم التمام واكتمال الرحلة)

تحديد التعاريف المنطقية لإغلاق واكتمال الرحلات: [WORKING HYPOTHESIS / DESIGN CANDIDATE]

1. **WAYNAH Internal Completion:** اكتمال الرحلة وتنفيذ المعاملة بالكامل عبر محركات المنصة (طلب/حجز/دفع منشأ ومثبت). [DESIGN CANDIDATE]
2. **WAYNAH External Completion:** الحصول على القيمة المكانية والمعلوماتية من المنصة، ثم إتمام التواصل أو الشراء خارجياً عبر الهاتف أو الزيارة. (تظل فرضية عمل مرتبطة بـ Open Question #10). [WORKING HYPOTHESIS | MEDIUM]
3. **Partial Completion:** توقف الرحلة بعد مرحلة الاستفسار أو عرض السعر دون الوصول لعقد شراء أو تنفيذ.
4. **Abandoned Journey:** خروج العميل من الشاشة أثناء البحث أو التصفح قبل اتخاذ أي إجراء.
5. **Failed Journey:** تعثر الرحلة بسبب خطأ في البيانات، انقطاع اتصال، أو رفض المزود للطلب.
6. **Disputed Journey:** اكتمال الخدمة أو التوصيل مع وجود نزاع بين العميل والمزود على الجودة أو السعر.

---

## 29. Accessibility & Real-World Constraints (قيود الاستخدام الواقعية في حجة واليمن)

دراسة سياق الاستخدام الميداني من منظور UX / HCI Domain: [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]

1. **الاتصال المتقطع بالإنترنت (Intermittent Connectivity):** مراعاة ضعف شبكات المحمول. أما الأفكار مثل التخزين المحلي المؤقت (Local Caching) أو حفظ أرقام التلفون أثناء انقطاع الاتصال فهي مقترحات تصميمية تقنية [DESIGN CANDIDATE / DEFER TO IMPLEMENTATION].
2. **السيادة التامة للهاتف والـ WhatsApp:** إدراك أن العميل يفضل الضغط على زر الاتصال المباشر أو المحادثة الشفهية بدلاً من ملء استشارات وسلات تسوق معقدة. [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]
3. **الملاحة بالمعالم بدلاً من العناوين البريدية:** عدم قسر المستخدم على إدخال "رمز بريدي" أو "اسم الشارع والبرج"، والاعتماد على اسم الحي، المعلم الشهير، والنقطة المرجعية. [DESIGN CANDIDATE]
4. **سهولة الاستخدام للعامة وتصميم RTL:** بناء الواجهات والنصوص بلغة عربية بسيطة تناسب الأفراد غير التقنيين وتراعي القراءة من اليمين لليسار. [DESIGN CANDIDATE]

---

## 30. Journey Matrix (مصفوفة الرحلات الشاملة A–J)

توضح هذه المصفوفة المقارنة التحليلية بين الرحلات الرئيسية العشر المقفلة هيكلياً (Journeys A through J): [DESIGN CANDIDATE]

| Journey Code | Name | Primary Intent | Core Actors | Primary Decision Point | Trust Requirement | Geo Context | Transaction Location |
|---|---|---|---|---|---|---|---|
| **Journey A** | Discovery Only | Discovery / Location | Visitor ↔ Place | Is info sufficient & clear? | Existence / Observation | Fixed Place / Admin | None (Info Only) |
| **Journey B** | Discovery → Contact | Contact / Availability | Customer ↔ Business Mgr | Is phone verified & active? | Contact Verified | Fixed Place / Branch | External (Phone/WhatsApp)|
| **Journey C** | Discovery → Visit | Location / Navigation | Visitor ↔ Place / Branch | Is landmark & status clear?| Location & Existence | Physical Location | External (On-site Visit) |
| **Journey D** | Service Request | Service / Capability | Requester ↔ Provider | Does provider cover my area?| Capability & Identity | Coverage Radius | Internal / Hybrid |
| **Journey E** | RFQ Flow | Price / Specification | Buyer ↔ Business / Workspace | Is quote acceptable & clear? | Identity & Workspace | Branch / Workspace | Internal Agreement |
| **Journey F** | Product Purchase | Product / Availability | Buyer ↔ Merchant | Is Item in stock & price valid? | Merchant Identity | Fixed Branch | Internal Order Engine |
| **Journey G** | Order Fulfillment | Fulfillment / Delivery | Buyer ↔ Merchant / Driver | Which pickup/delivery model? | Fulfillment Proof | Pickup / Transport | Internal Execution |
| **Journey H** | Mobile / Field | Service / Mobile Coverage| Customer ↔ Mobile Provider | Is provider traveling to me? | Personal Vetting | Coverage Area | On-site Execution |
| **Journey I** | Remote Service | Service / Digital Scope | Customer ↔ Remote Specialist| Is scope & portfolio solid? | Portfolio & Identity | Administrative Context| Remote Digital Handover|
| **Journey J** | External Transaction | Discovery / Transaction | Visitor ↔ Merchant | Is merchant real & open? | Basic Identity | Place / Branch | External Offline |

---

## 31. Actor Interaction Matrix (مصفوفة تفاعل الفاعلين)

تحدد هذه المصفوفة طبيعة التفاعل السلوكي والتشغيلي بين الأطراف (ليست Database Foreign Keys): [DESIGN CANDIDATE]

| Interaction Pair | Operational Relationship & Interaction Type | Governance / Control Boundary |
|---|---|---|
| **User ↔ Place** | اكتشاف، تصفح، خريطة، ملاحة، حفظ، وإبلاغ عن خطأ مكاني. | لا يمنح المستخدم حق ملكية Place؛ الملاحظات تخضع للتدقيق. |
| **User ↔ Business** | استفسار عن العلامة، متابعة، فحص ادعاءات الملكية ورسائل الهوية. | Business يمثل الكيان التجاري المظلي وليس بالضرورة الموقع المادي. |
| **User ↔ Branch** | استهلاك الخدمات والسلع المحلية المعلنة في الفرع التشغيلي المحلي المحدد. | الفرع يمثل نقطة التشغيل المباشرة المتميزة محلياً. |
| **User ↔ Provider** | طلب خدمة ميدانية، حجز موعد، أو تفاوض على خدمة حرفية. | المزود قد يكون مستقلاً أو تابعاً لـ Business؛ التغطية تحدد الأهلية. |
| **User ↔ Service** | طلب تنفيذ أداء، اختيار وقت متاح، أو الاستفسار عن النطاق. | الخدمة وعد بأداء في زمان/مكان وليست سلعة مخزنة. |
| **User ↔ Product** | تصفح كتالوج، استعلام توفر وسعر، وإضافة لطلب شراء. | السلعة تتطلب توفراً وسعراً محدثين وقدرة بيع مفعّلة للنشاط. |
| **User ↔ Verification** | الاطلاع على ادعاءات التحقق النطاقية المؤكدة لزيادة الثقة. | التوثيق صادر من مراجع مستقل بناءً على أدلة رسمية وميدانية. |
| **User ↔ Platform** | إدارة الحساب، تفضيلات الخصوصية، وتلقي التنبيهات والإرشادات. | المنصة تفرض قواعد السلوك وحماية البيانات والتدقيق. |

---

## 32. Exception Cases (الحالات الاستثنائية لرحلة المستخدم)

تحليل وتأطير الحالات الاستثنائية السلوكية الملاحظة ميدانياً: [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM]

1. **تحول الرحلة من داخل المنصة إلى خارجها (Mid-Journey External Shift):** بدء العميل لطلب حجز ثم التراجع والاتصال هاتفياً بالتاجر مباشرة.
2. **انقطاع تغطية الشبكة أثناء الحجز (Mid-Booking Network Drop):** انقطاع الإنترنت أثناء تأكيد الموعد.
3. **تغير التغطية الجغرافية للمزود أثناء الطلب (Mid-Request Coverage Shift):** انتقاء مزود متنقل لقرية أخرى أثناء انتظار قبول الطلب.
4. **تغير اسم أو ملكية المحل أثناء الرحلة (Business Transfer Mid-Journey):** تغيير اسم النشاط أو انتقاله مع بقاء المكان المادي.
5. **الطلب المتعدد للأطراف (Multi-Party Request):** طلب خدمة تركيب شمسية تتطلب تاجر أجهزة + فني تركيب مستقل.

---

## 33. Open Questions (الأسئلة المفتوحة المجمعة)

### 1. Inherited Open Questions — Preserved, Not Resolved (الأسئلة الموروثة المقفلة حفظاً من LOGIC-002)

تلتزم هذه الوثيقة بالحفاظ الكامل الصارم على الأسئلة المفتوحة الـ 12 الموروثة من `LOGIC-002` دون حذف أو ادعاء حسم غير مستند: [OPEN QUESTION]

1. **[OPEN QUESTION | HIGH]:** Price freshness collection (ما هي الآلية الميدانية الأكفأ لجمع وتحديث أسعار السلع السريعة التغير في حجة دون الإضرار بمصداقية المنصة؟).
2. **[OPEN QUESTION | HIGH]:** Informal unnamed business indexing (كيف يتم التعامل مع الأنشطة التجارية التي تعمل بدون اسم رسمي وتعتمد فقط على الشهرة المحلية في فهارس البحث الجغرافي؟).
3. **[OPEN QUESTION | MEDIUM]:** Stale threshold hours/provider (ما هو السقف الزمني المناسب لاعتبار بيانات ساعات العمل وتوفر الفنيين "متقادمة" Stale وتستدعي التنبيه للمستخدم؟).
4. **[OPEN QUESTION | MEDIUM]:** Ownership dispute resolution (ما هي الضوابط الدقيقة لفض التنازع بين شخصين يدعيان ملكية صفحة نشاط تجاري قائم في الواقع؟).
5. **[OPEN QUESTION | HIGH]:** Geographic Context vs Service Coverage in queries (كيف نميز بين الحدود الإدارية للمكان ونطاق خدمة المزود المتنقل في الاستعلامات؟).
6. **[OPEN QUESTION | HIGH]:** Contact mechanism requirement by record type (متى يكون رقم التواصل ميزة شرطية أو اختيارية بحسب نوع سجل الاكتشاف؟).
7. **[OPEN QUESTION | MEDIUM]:** When Business needs Branch (ما هو الحد الفاصل التشغيلي الذي يجعل النشاط يطلب إنشاء فرع حقيقي متميز محلياً؟).
8. **[OPEN QUESTION | HIGH]:** Activity as entity vs classification/capability (هل النشاط كيان مستقل بذاته أم صفة/قدرة تصنيفية تلحق بالـ Place أو Business؟).
9. **[OPEN QUESTION | HIGH]:** Provider under multiple Businesses (هل يمكن لمؤدي الخدمة العمل تحت مظلة عدة أنشطة تجارية متعددة في نفس الوقت؟).
10. **[OPEN QUESTION | MEDIUM]:** External Transactions as complete journey (هل المعاملات والتفاعلات الخارجية تعتبر رحلة عميل مكتملة بالنسبة لـ WAYNAH؟ — *تظل هذه المسألة الموروثة فرضية عمل مفتوحة غير محسومة*).
11. **[OPEN QUESTION | MEDIUM]:** Request vs RFQ boundary (ما هو الحد الفاصل التشغيلي والتعهدي بين طلب الاستفسار المباشر Request وطلب عرض السعر RFQ؟).
12. **[OPEN QUESTION | MEDIUM]:** Availability vs Capacity (ما هو الفرق المنطقي والدقيق بين التوفر اللحظي Availability والقدرة التشغيلية الاستيعابية Capacity؟).

---

### 2. LOGIC-003 New Open Questions (الأسئلة المفتوحة الجديدة السلوكية)

13. **[OPEN QUESTION | HIGH]:** ما هي الواجهة الأبسط للعميل اليمني للتمييز بين "مكان للزيارة الميدانية (Journey C)" و "مزود خدمة متنقل يأتي للمنزل (Journey H)" دون إحداث إرباك مفاهمي؟
14. **[OPEN QUESTION | HIGH]:** كيف نقيس معدل نجاح الرحلات التي تكتمل عبر الاتصال الهاتفي الخارجي (Journey B) دون انتهاك خصوصية المكالمات؟
15. **[OPEN QUESTION | MEDIUM]:** ما هو السلوك الأفضل للواجهة عندما يرسل العميل طلب حجز لمزود متوقف مؤقتاً عن العمل؟
16. **[OPEN QUESTION | HIGH]:** كيف يتم حماية العناوين المنزلية للعملاء في رحلات الخدمة الميدانية مع ضمان وصول الفني بوضوح ودون الاعتماد على العناوين البريدية؟
17. **[OPEN QUESTION | MEDIUM]:** ما هي الآلية السلوكية الأنسب لتنبيه العميل بأن أسعار السلع الغذائية أو قطع الغيار معروضة كـ "أسعار إرشادية قابلة للتغير"؟
18. **[OPEN QUESTION / SPECIALIST REQUIRED]:** مسؤولية WAYNAH عن التوصيل ليست محسومة في هذه الدراسة، وتبقى خاضعة لدراسة تشغيلية وقانونية/تعاقدية مستقلة.

---

## 34. Dependencies (التبعيات لدراسات المجال القادمة)

تحدد هذه الدراسة التبعيات المنطقية المباشرة للدراسات القادمة في خارطة طريق WAYNAH: [FACT | HIGH]

1. **Core Entities & Relationship Architecture Study (Step 04):** صياغة بنية العلاقات بين Place, Business, Branch, Provider, Service, Product بناءً على نتائج الفاعلين والرحلات.
2. **RFQ, Booking & Order Mechanisms Study (Step 07):** صياغة المحركات الاختيارية للتفاعلات التي تم تفكيك رحلاتها في هذه الوثيقة.
3. **Verification & Scoped Claims Architecture Study (Step 10):** صياغة آليات ودوال التوثيق ومسارات تدقيق الأدلة.
4. **UX / HCI Field Testing Study:** إجراء اختبارات واجهة وقابلية استخدام ميدانية لعينات من المستخدمين في محافظة حجة.

---

## 35. Architecture & Implementation Implications — Conceptual Only

توضيح المبادئ التوجيهية المفهومية غير الملزمة للتطوير المستقبلي (Conceptual Only): [CONCEPTUAL IMPLICATION]

* **Dynamic Capability Rendering (مطلب مفاهيمي):** الواجهات ينبغي أن تُبنى بديناميكية تشترط قدرة النشاط المعلنة دون فرض قالب متجر صلب. [CONCEPTUAL IMPLICATION]
* **Decoupled Transaction Tracing (مطلب مفاهيمي):** طبقة الاكتشاف ينبغي أن تظل سريعة ومستقلة كلياً عن محركات المعاملات، بحيث لا يعطل بطء محرك الطلبات قدرة المستخدم على اكتشاف الأماكن. [CONCEPTUAL IMPLICATION]
* **Contextual Authorization (تأجيل للتنفيذ):** التحقق من صلاحيات الأفعال ينبغي أن يتناسب مع سياق الفاعل محلياً [DEFER TO IMPLEMENTATION].

---

## 36. Final Findings (النتائج النهائية)

1. مستخدمو **WAYNAH** يتنوعون كلياً بين مستكشفي أماكن، زوار ميدانيين، طالبي خدمات، مشتري سلع، وأصحاب أعمال.
2. رحلات المستخدم تتوزع حتماً على **10 رحلات رئيسية فقط (Primary Journeys A through J)**، بينما الحجز والشراء هما تدفقات تعهد وتفاعل ضمتية (`Sub-Flows`).
3. مكتسب القيمة يبدأ من اكتشاف المكان المادي أو التوجيه الميداني (Journey C) أو التواصل، وتظل المعاملات الخارجية مسألة مكتملة كفرضية عمل ترتبط بالكامل بـ Open Question #10 في `LOGIC-002`.
4. الثقة تُبنى بالتدرج عبر 6 طبقات، والتوثيق يجب أن يظل نطاقياً ومستنداً إلى أدلة.
5. البيئة اليمنية ومحافظة حجة تتطلب تصميم رحلات تتقبل الاتصال المتقطع، الملاحة بالمعالم، والتواصل الشفهي المباشر عبر الهاتف والـ WhatsApp [OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM].

---

## 37. Internal Self-Audit — Completed (مراجعة بوابة الجودة الداخلية)

تم إجراء مراجعة نقدية ذاتية صارمة (Internal Self-Audit) لبنود التحقق الـ 12 المحددة لـ **LOGIC-003**:

> **تنبيه:** هذه التقييمات هي مراجعة ذاتية داخلية (Internal Self-Audit) ولا تعتبر دليلاً على القبول الخارجي المستقل (Independent Acceptance).

* **Q1: هل تم تحليل المستخدمين كأشخاص/أطراف تشغيلية وليس فقط Roles تقنية؟**
  * **نعم.** (تم التفكيك في الأقسام 5 و 6 و 7 إلى User Types, Personas, Operational Actors).
* **Q2: هل تم تحليل أكثر من Journey واحدة؟**
  * **نعم.** (تم تحليل 10 رحلات مستقلة Journeys A–J من القسم 9 إلى 18 واستيفاء Journey C).
* **Q3: هل الرحلات متوافقة مع Alternative Transaction Paths في LOGIC-002؟**
  * **نعم.** (تم المطابقة التامة مع المسارات البديلة وقدرات الأنشطة).
* **Q4: هل تم اختبار الرحلات على تنوع الأنشطة الـ 41؟**
  * **نعم.** (تم الاختبار والمطابقة في القسم 27 عبر المجموعات الـ 10 للأنشطة الـ 41).
* **Q5: هل تم الفصل بين Discovery و Transaction؟**
  * **نعم.** (تم الفصل الصريح وتحديد أن الاكتشاف طبقة مستقلة ذات قيمة مكتملة لذاتها).
* **Q6: هل تم الفصل بين Verification و Review و Observation؟**
  * **نعم.** (تم التأكيد والالتزام بالقرارات المقفولة في القسم 21 و 25).
* **Q7: هل تم احترام الجغرافيا الأربعة؟**
  * **نعم.** (تم الربط مع Physical Location, Admin Context, Service Coverage, Discovery Context في القسم 26).
* **Q8: هل تم تحليل Failure / Abandonment؟**
  * **نعم.** (تم التفكيك والتحليل المنهجي في القسم 24).
* **Q9: هل تم تجنب النسب غير المدعومة؟**
  * **نعم.** (خلت الدراسة تماماً من أي نسب مئوية وهمية وتم إعادة ضبط مراميز الأدلة).
* **Q10: هل تم تجنب تحويل الدراسة إلى Schema أو API أو UI؟**
  * **نعم.** (الوثيقة دراسة مجال سلوكية ومنطقية ولم تكتب أي كود أو Schema أو UI).
* **Q11: هل تم الحفاظ على جميع القرارات المقفولة؟**
  * **نعم.** (تم حماية جميع قرارات LOGIC-001 و LOGIC-002 و GEO Contracts والأسئلة الـ 12 الموروثة).
* **Q12: هل تم توثيق Open Questions بدل اختراع إجابات؟**
  * **نعم.** (تم الحفاظ على الأسئلة الـ 12 الموروثة إضافة إلى 5 أسئلة سلوكية جديدة وإبقاء مسؤولية التوصيل مفتوحة).

**نتيجة المراجعة الداخلية الذاتية:**
`Internal self-audit completed after revision.`

---

## 38. Study Status & Recommended Next Study (حالة الدراسة والاتجاه القادم)

### حالة الوثيقة الرسمية:
**`STATUS: LOCKED`**
*(Review Status: **FINAL APPROVED & LOCKED** | Lock Date: **1 October 2026**)*

---

### Recommended Next Study (التوصية غير الملزمة للدراسة القادمة):

> **تنبيه حاكم بشأن التوصية وخارطة الطريق الرسمية:**  
> **هذا اقتراح دراسي غير ملزم، ولا يعدل خارطة الطريق الرسمية للمشروع. بعد قفل LOGIC-003 تتم مراجعة خارطة الطريق الرسمية واختيار الدراسة التالية بشكل صريح.**  
> *(خارطة الطريق الرسمية الأصلية: 01 General Logic ← 02 Operating Models ← 03 Users & Journeys ← 04 Place/Business/Branch ← 05 Service/Provider ← 06 Product/Catalog ← 07 Inquiry/Request/Booking/Order ← 08 Fulfillment/Delivery ← 09 Money/Payments ← 10 Trust/Verification ← 11 Data/Ops ← 12 Exceptions ← 13 Unify Full Logic ← 14 Return to Implementation).*

توصي هذه الدراسة (توصية غير ملزمة تتماشى مع الخطوة 04 من خارطة الطريق الأصلية) بأن تكون الخطوة التالية في خارطة الطريق الرسمية لمشروع **WAYNAH** بعد اتخاذ قرار قفل مستقل هي:

# WAYNAH-LOGIC-004
## CORE ENTITIES & RELATIONSHIP ARCHITECTURE STUDY (04 — Place / Business / Branch)

*(تأطير العلاقات التفصيلية بين المكان المادي Place، الهوية التجارية Business، الفرع التشغيلي Branch، المزود Provider، العروض Services/Products، وادعاءات التوثيق Scoped Claims بناءً على النتائج التشغيلية والسلوكية المقفولة في LOGIC-001 و LOGIC-002 و LOGIC-003).*

---

# REVISION CHANGELOG

يستعرض هذا السجل التعديلات الإلزامية التي تم تنفيذها في هذه النسخة المنقحة بناءً على مراجعة REVISION الرسمية (R1 إلى R13):

| ID | المشكلة | التعديل | الأثر |
|---|---|---|---|
| **R1** | غياب قسم تفصيلي مستقل لـ Journey C | إضافة قسم مستقل كامل للرحلة `Journey C — Discovery → Visit` (القسم 11) يشمل كل تفاصيل الهدف والتوجيه والوصول الميداني والفرق المكاني | استيفاء النقص وتغطية رحلات الزيارة الميدانية دون تفاصيل تقنية |
| **R2** | تعارض وتضخيم عدد الرحلات بين A–J والـ Booking/Order | توحيد هيكل الرحلات على **10 رحلات رئيسية فقط A–J** وتأطير الحجز والشراء كتدفقات تعهد وتفاعل ضمتية (Sub-Flows) | توحيد ومنع تضارب عدد الرحلات عبر الوثيقة |
| **R3** | خطر اختفاء أو دمج أسئلة LOGIC-002 الموروثة | إنشاء قسم صريح بعنوان `Inherited Open Questions — Preserved, Not Resolved` يحفظ الأسئلة الـ 12 الموروثة كما هي | حماية الاتساق المنهجي مع LOGIC-002 |
| **R4** | وسم ادعاءات سلوكية بـ FACT \| HIGH | إعادة ضبط مراميز الأدلة وتحويل الفرضيات والملاحظات إلى `OBSERVATION`, `WORKING HYPOTHESIS`, `DESIGN CANDIDATE` | رفع الموضوعية والدقة المنهجية |
| **R5** | اقتراب بعض الأقسام (29 و 35) من الصياغات التنفيذية | تحويل المقترحات التقنية (Local Caching) إلى `DESIGN CANDIDATE` و `DEFER TO IMPLEMENTATION` والصياغات الحتمية إلى `Conceptual Only` | حماية حدود الدراسة وعدم التعدي على مرحلة التنفيذ |
| **R6** | إظهار التوصية بـ LOGIC-004 كأنها تعديل لخارطة الطريق | إضافة تنبيه صريح يوضح أن التوصية غير ملزمة وأن خارطة الطريق الأصلية (14 مرحلة) هي السلطة الحاكمة | منع تجاوز خارطة الطريق المعتمدة |
| **R7** | أخطاء تحريرية ومصطلحات غامضة (SKU, Workshop, تنفيدية) | تنظيف لغوي ومصطلحي شامل (إزالة SKU، تصحيح الأخطاء النحوية، وضبط المصطلحات) | رفع جودة المستند ووضوحه التحريري |
| **R8** | استخدام كلمة "LOCKED" لوصف رحلات A–J قبل القفل الفعلي | استبدال جميع عبارات القفل لرحلات A–J بـ "الرحلات الرئيسية العشر المعتمدة/المقترحة داخل هذه الدراسة" | منع الخلط بين الحالة الدراسية والاعتماد المالي/المقفول |
| **R9** | ظهور رحلات الفاعلين التشغيلية كرحلات رئيسية جديدة | تصنيف رحلات مالك النشاط والمزود والميداني والتحقق كـ `Supporting Operational Workflows` تؤدي أدواراً داعمة ولا تضيف Journey Codes | منع تضخيم فهارس الرحلات الرئيسية الحصرية A–J |
| **R10** | تصنيف افتراضات الكيانات والخدمات المتنقلة بـ FACT \| HIGH | تجريد افتراضات الكيانات والخدمات المتنقلة والمنزلية من FACT وتحويلها إلى `DESIGN CANDIDATE` أو `CONCEPTUAL IMPLICATION` | الامتثال التام لقواعد انضباط مراميز الأدلة |
| **R11** | الجزم بعدم مسؤولية WAYNAH عن التوصيل كقرار محسوم | إعادة صياغة مسؤولية التوصيل كمسألة غير محسومة وتصنيفها كـ `OPEN QUESTION / SPECIALIST REQUIRED` مع تأجيل التنفيذ | منع فرض قرارات تشغيلية/قانونية مبكرة |
| **R12** | وسم عنوان القسم 37 بـ FACT \| HIGH | تعديل عنوان القسم 37 إلى `Internal Self-Audit — Completed` وتوضيح أنه مراجعة ذاتية وليس قبولاً مستقلاً | الشفافية في التقييم الذاتي |
| **R13** | توضيح العلاقة المفاهيمية بين Journey D و Journey H | إدراج نص صريح باللغتين العربية والإنجليزية يوضح أن H مسار رئيسي متخصص مشتق من مجال D العام للتنفيذ لدى العميل | إزالة اللبس المفاهيمي بين طلب الخدمة العام والتنفيذ الميداني |

---

# EVIDENCE CLASSIFICATION CHANGES

جدول يوضح أهم العبارات التي تم تحويل تصنيفها من `FACT | HIGH` إلى تصنيفات أدلة أكثر دقة وانضباطاً:

| العبارة / المفهوم الأصلي | التصنيف السابق | التصنيف المنقح الجديد | سبب التعديل |
|---|---|---|---|
| اكتمال الرحلة بالتواصل الخارجي (Journey B) | `FACT | HIGH` | `WORKING HYPOTHESIS | MEDIUM` | لا توجد حقيقة إحصائية قطعية؛ هي فرضية عمل ترتبط بـ Open Question #10. |
| تفضيل المستخدم اليمني للمكالمات والواتساب | `FACT | HIGH` | `OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM` | ملاحظة تشغيلية نوعية وليست مسحاً إحصائياً موثقاً. |
| أسباب تعثر الرحلات والانسحاب | `FACT | HIGH` | `OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM` | تحليل سلوكي ميداني غير مقترن بأرقام مسحية. |
| التدرج في طبقات الثقة الـ 6 | `FACT | HIGH` | `WORKING HYPOTHESIS / DESIGN CANDIDATE` | نموذج منطقي مقترح للتأطير وليس حقيقة جغرافية/إدارية. |
| السلوك في ظروف انقطاع الإنترنت | `FACT | HIGH` | `OBSERVATION — NOT STATISTICALLY VALIDATED | MEDIUM` | ملاحظة ميدانية عامة لظروف الاتصال المحلي. |
| آليات التخزين المحلي والاحتفاظ | `FACT | HIGH` | `DEFER TO IMPLEMENTATION / DESIGN CANDIDATE` | مسألة تصميم واجهات وتنفيذ تقني لا تدخل في نطاق قرارات المجال. |
| المعاملات الخارجية كرحلة مكتملة (Journey J)| `FACT | HIGH` | `WORKING HYPOTHESIS | MEDIUM` | ترتبط مباشرة بالـ Open Question #10 الموروث من LOGIC-002. |
| المبادئ المعمارية في قسم 35 | "must implement" | `CONCEPTUAL IMPLICATION / DEFER TO IMPLEMENTATION` | تجريد الصياغات الحتمية وتحويلها إلى متطلبات مفاهيمية غير ملزمة تقنياً. |
| مسافات وتغطية الخدمات المتنقلة والمنزلية | `FACT | HIGH` | `CONCEPTUAL IMPLICATION / DESIGN CANDIDATE` | افتراضات واختيارات تصميمية وليست حقائق تجريبية مقفلة. |
| عدم مسؤولية WAYNAH عن التوصيل | `FACT | HIGH` | `OPEN QUESTION / SPECIALIST REQUIRED` | مسألة تشغيلية وقانونية غير محسومة في هذه المرحلة. |
| وسم عنوان قسم 37 بوابة الجودة | `FACT | HIGH` | `Internal Self-Audit — Completed` | مراجعة نقدية ذاتية داخلية وليست قبولاً مستقلاً. |

---

# OPEN QUESTIONS PRESERVATION CHECK

تأكيد رسمي على الحفاظ الكامل على الأسئلة المفتوحة الموروثة من `LOGIC-002`:

* **العدد الإجمالي لأسئلة LOGIC-002 الموروثة:** 12 سؤالاً (تم حفظها بالكامل في القسم 33.1).
* **العدد الإجمالي لأسئلة LOGIC-003 الجديدة:** 6 أسئلة جديدة (شاملة مسألة مسؤولية التوصيل) (تم حفظها بالكامل في القسم 33.2).
* **المجموع الكلي للأسئلة المفتوحة في الوثيقة:** 18 سؤالاً مفتوحاً مميزاً بوضوح.
* **تأكيد قاطع:** لم يتم حذف أي سؤال موروث، ولم يتم ادعاء حسم مسألة المعاملات الخارجية (LOGIC-002 Open Question #10) أو أي من الأسئلة الـ 12 الموروثة.

---

# FINAL STATUS & STATEMENT

```text
STATUS: LOCKED
```

> **OFFICIAL AUTHORITY STATEMENT:**  
> **Final Review completed. LOGIC-003 is formally LOCKED. It now serves as a stable, immutable domain input for subsequent logic studies.**
