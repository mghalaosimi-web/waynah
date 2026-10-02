# WAYNAH-LOGIC-002

## REAL-WORLD ACTIVITIES & OPERATING MODELS STUDY — LOCKED VERSION

> **نوع الوثيقة:** وثيقة دراسة مجال وتأطير منطقي لمنتج WAYNAH (وينه؟) — النسخة النهائية المعتمدة والمقفلة رسمياً.
> **STATUS:** **`LOCKED`** (Review Status: **ACCEPTED** | Final Lock: **APPROVED** | Reference Date: **1 October 2026**).
> **قاعدة أساسية:** لا تتضمن هذه الوثيقة أي كود، أو تعديل لمخطط قاعدة البيانات (Prisma Schema)، أو إنشاء migrations، أو أي تنفيذ تقني أو عقد معمارية تنفيدية.
> **النطاق الجغرافي الأول:** محافظة حجة — الجمهورية اليمنية.
> **النطاق المستقبلي:** قابلية التوسع إلى جميع محافظات اليمن (22 محافظة).

---

## 1. Executive Summary (الملخص التنفيذي)

تهدف هذه الدراسة إلى فهم وتكشيف واقع الأنشطة الاقتصادية، الخدمية، والاجتماعية في البيئة اليمنية (وبشكل خاص في محافظة حجة كبيئة تشغيل مرجعية أولى)، واستخراج المنطق التشغيلي الحقيقي الذي يجب أن يستوعبه منصة **WAYNAH** دون فرض نموذج تجاري موحد أو افتراضات مستوردة من بيئات تختلف تشغيلياً ولوجستياً ومالياً.

### أهم نتائج الدراسة المقفلة:

1. **دحض افتراض "المتجر الموحد" [OBSERVATION — NOT STATISTICALLY VALIDATED]:** إن افتراض أن "كل نشاط = متجر + منتجات + سلة + دفع + توصيل" هو افتراض خاطئ وغير واقعي. فالواقع اليمني يظهر انتشاراً واسعاً لأنشطة لا تبيع منتجات رقمية ثابتة أو لا تقدم توصيلاً أو لا تمتلك مخزوناً محدداً بدقة، بل تعتمد على الاتصال والمشافهة والتفاوض وعروض الأسعار والخدمة الميدانية. [WORKING HYPOTHESIS]
2. **الاتساق المعماري مع العقود القائمة (Place ≠ Business):** تقدم هذه الدراسة أدلة ميدانية وحالات اختبار واقعية تدعم وتؤكد ما تم إقراره سابقاً في `WAYNAH SYSTEM LOGIC MASTER STUDY` و `GEOGRAPHIC_DATA_CONTRACT` من أن الكيان المرجعي الأول للاكتشاف هو **Place** (المكان/الموقع). فالـ Place يمثل موضعاً قابلاً للزيارة أو الاكتشاف جغرافياً، بينما الـ **Business** يمثل الهوية التشغيلية/التجارية، والـ **Branch** يمثل نقطة تشغيل محلية متميزة عند وجود تمايز تشغيلي، والـ **Provider** يمثل مؤدي الخدمة (سواءً كان مستقلاً أو تابعاً)، والـ **Product/Service** يمثل قدرات اختيارية (Optional Capabilities). [DESIGN CANDIDATE]
3. **تفكيك مسارات التفاعل (Alternative Transaction Paths):** لا توجد معاملة حتمية خطية موحدة. التفاعل يتوزع عبر مسارات بديلة مستقلة عن التجارة الإلكترونية التقليدية:
   - `Discovery` → `Inquiry` → (انتهاء/معاملة خارجية).
   - `Discovery` → `Request` → `RFQ` → `Agreement`.
   - `Discovery` → `Booking` → `Service Execution`.
   - `Discovery` → `Order` → `Fulfillment`.
   - `Discovery` → `Contact / On-site Visit` → (معاملة خارجية مباشرة). [OBSERVED | HIGH]
4. **مرشحات التحقق النطاقي (Candidate Scoped Verification Claims):** شارات الثقة العامة ("موثق") تسبب تضليلاً للمستخدم. يجب تفكيك الثقة إلى ادعاءات نطاقية مرشحة: إثبات الوجود المكاني، إثبات بيانات الاتصال، إثبات ملكية النشاط، وإثبات التراخيص والأهلية المهنية (تحتوي المسائل التنظيمية على وسم `SPECIALIST REQUIRED`). [DESIGN CANDIDATE]
5. **موقف التعديل المعماري والتحليلي:** خرجت الدراسة بتصنيف النتائج إلى: `FACT`, `SOURCE-BACKED`, `OBSERVED`, `ASSUMPTION`, `WORKING HYPOTHESIS`, `DESIGN CANDIDATE`, `OPEN QUESTION`, `SPECIALIST REQUIRED`, و `DEFER TO IMPLEMENTATION`. [FACT | HIGH]

---

## 2. Research Methodology & Evidence Discipline (منهجية البحث ومبادئ إثبات الأدلة)

تعتمد هذه الدراسة على تحليل النماذج التشغيلية الميدانية في محافظة حجة وبقية المحافظات اليمنية عبر تصنيف الأدلة المباشرة والملاحظة الميدانية واستعراض الأدبيات والوثائق التجارية المتاحة.

### تصنيف الأدلة وتحديد درجات الثقة:

لكل معلومة تشغيلية رئيسية في هذه الوثيقة، تم تطبيق الامتثال المباشر لدقة الأدلة عبر الملازم التالية:
* **`FACT`**: حقيقة هيكلية أو جغرافية أو إدارية مثبتة ومستقرة في المشروع.
* **`SOURCE-BACKED`**: معلومة مدعومة بمصادر رسمية أو أدلة تجارية عامة أو وثائق منظمات موثوقة (مثل OCHA / Central Statistical Organization).
* **`OBSERVED`**: ممارسة تشغيلية أو تجارية تمت ملاحظتها ميدانياً في اليمن ومحافظة حجة.
* **`ASSUMPTION`**: افتراض منطقي لبناء النموذج التشغيلي، يتطلب تحسيناً أو تحليلاً ميدانياً إضافياً.
* **`WORKING HYPOTHESIS`**: فرضية عمل تشغيلية لتوجيه التحليل ولا تشكل قاعدة تقنية.
* **`OBSERVATION — NOT STATISTICALLY VALIDATED`**: ملاحظة ميدانية نوعية غير مدعومة بإحصاء كمي أو مسح ميداني شامل.
* **`DESIGN CANDIDATE`**: مقترح للمفهوم المنطقي ينتظر الحسم في دراسات الميكانزمات التالية.
* **`SPECIALIST REQUIRED`**: مسألة تتطلب دراسة قانونية، تنظيمية، أو لوجستية من متخصص.
* **`DEFER TO IMPLEMENTATION`**: مسألة تقنية تأجلت صراحة لمرحلة التنفيذ.
* **`OPEN QUESTION`**: مسألة تشغيلية أو قانونية حاسمة تتطلب تحليلاً لاحقاً.

كما تم تعيين مستوى ثقة محدد لكل معلومة: **HIGH** / **MEDIUM** / **LOW**.

---

## 3. Yemeni Operating Context (السياق التشغيلي اليمني — محافظة حجة واليمن)

تشكل محافظة حجة بيئة ممتازة كاختبار تشغيلي مرجعي (Reference Scope) لمنصة WAYNAH، نظراً لتنوعها الجغرافي (تجمع بين المناطق الجبلية والسهلية والساحلية) وتنوع أنشطتها الاقتصادية بين المراكز الحضرية (مثل مدينة حجة، عبس، حرض) والمناطق الريفية. [SOURCE-BACKED | HIGH]

```
                  ┌───────────────────────────────────────────┐
                  │    Yemeni Real-World Operating Context     │
                  └─────────────────────┬─────────────────────┘
                                        │
      ┌─────────────────────────────────┼─────────────────────────────────┐
      ▼                                 ▼                                 ▼
┌──────────────┐              ┌──────────────────┐              ┌──────────────────┐
│ Informal &   │              │ Flexible &       │              │ Volatile Cash &  │
│ Landmark GIS │              │ Variable Pricing │              │ Offline Trust    │
└──────────────┘              └──────────────────┘              └──────────────────┘
• No structured postal addresses  • Prices change with exchange     • Dominance of cash & local
• Reliance on local landmarks,      rates, fuel & seasonal demand   mobile money/transfers
  streets & neighborhood names    • Negotiation & custom RFQs       • Trust based on phone contacts,
• Fluid home & mobile services      are standard baseline practice    personal verification & place
```

### الخصائص الحاكمة للبيئة اليمنية [OBSERVED | HIGH]:

1. **غياب نظام العناوين البريدية المنسقة:** يعتمد الناس والتجار على المعالم الشهيرة (Landmarks)، أسماء المساجد، المدارس، الحارات، والأسوق المركزية كنقاط مرجعية جغرافية. [OBSERVED | HIGH]
2. **السيولة السعرية والتقلب:** تتقلب الأسعار (خاصة للمواد الغذائية، الأجهزة، والخدمات المعتمدة على المشتقات النفطية والمواد المستوردة) بشكل يومي أو أسبوعي نتيجة تغير أسعار الصرف والتكاليف اللوجستية. [OBSERVED | HIGH]
3. **هيمنة الاقتصاد النقدي والتحويلات المحلية:** تعتمد المعاملات بشكل رئيسي على الدفع نقداً (Cash on Delivery / In-person Cash)، أو عبر خدمات الصرافة والمحافظ الإلكترونية المحلية، بينما ينعدم استخدام بطاقات الائتمان الدولية. [OBSERVED | HIGH] (التفاصيل اللوجستية والمالية مؤجلة لـ Payments Study [DEFER TO IMPLEMENTATION]).
4. **الاعتماد الإداري والشفهي على الهاتف:** يتم حجز الخدمات، طلب السلع، والاستفسار عن التوفر عبر المكالمات الهاتفية المباشرة أو تطبيق WhatsApp. [OBSERVED | HIGH]
5. **الطبيعة المختلطة وغير الرسمية للأنشطة:** تدمج العديد من المحلات بين البيع بالجملة والتجزئة، أو البيع والصيانة، أو العمل من محل ثابت مع تقديم خدمات منزلية متنقلة. [OBSERVED | HIGH]

---

## 4. Activity Taxonomy (تصنيف وتأطير الأنشطة)

لتغطية كافة أطياف المشهد التشغيلي دون قسر الأنشطة في قالب تجاري واحد، تم تقسيم الأنشطة الـ 41 المطلوب دراستها إلى 10 مجموعات رئيسية: [FACT | HIGH]

* **Group A — Discovery / Non-Commercial:** أنشطة غير تجارية أو خدمية عامة تهدف للاكتشاف والمعرفة المكانية فقط.
* **Group B — Retail:** أنشطة بيع التجزئة المباشر للسلع الاستهلاكية والمعمرة.
* **Group C — Wholesale:** أنشطة بيع الجملة والتوزيع وإعادة التموين للمحلات.
* **Group D — Hybrid Commerce:** أنشطة تدمج البيع مع الخدمات (تركيب، صيانة، جملة + تجزئة).
* **Group E — Food:** أنشطة الأغذية، الوجبات، والمخابز التي تتصف بالاستهلاك السريع والتحضير الفوري.
* **Group F — Services:** الخدمات المهنية، الحرفية، والتقنية (تعتمد على الجهد والمقاولات).
* **Group G — Appointment-Based:** أنشطة تعتمد على المواعيد والحجز المسبق للموارد أو الأوقات.
* **Group H — Mobile / Field Service:** الأنشطة والخدمات المتنقلة التي تنتقل إلى موقع العميل أو تعمل بدون مكان ثابت.
* **Group I — Multi-Branch / Complex:** المؤسسات والشركات ذات الطبيعة التشكيلية المعقدة (فروع متعددة، أنشطة متعددة).
* **Group J — Special / Regulated:** الأنشطة ذات القيود التنظيمية والتراخيص الخاصة (الصحية، الأمنية، المالية).

---

## 5. Detailed Activity Cases (دراسة الحالات التفصيلية — 41 نشاطاً)

يتم تحليل كل حالة من الحالات الـ 41 بدقة وفق النموذج التحليلي: الهوية التشغيلية، التواجد المكاني، نموذج العرض، واقع المنتجات والخدمات، رحلة العميل، التفاعلات، الالتزامات، التسعير، التوفر، التنفيذ، التوصيل، الدفع، الإلغاء، الجغرافيا، متطلبات الثقة، مصادر البيانات، ومعدل التغير.

---

### Group A — Discovery / Non-Commercial

#### 1. معلم أو موقع عام (Landmark / Public Site)
* **هوية النشاط:** موضع جغرافي أو معلم تاريخي/طبيعي/عام (مثل قلعة القاهرة في حجة، جبل كحلان). لا يمثل منظمة تجارية. [FACT | HIGH]
* **Place vs Business vs Provider:** هو **Place** خالص. ليس Business وليس Provider ولا يملك Branch.
* **Physical Presence:** Fixed Location ثابت كلياً.
* **Offering Model:** Information Only. لا يبيع منتجات ولا يقدم خدمات تجارية.
* **Product & Service Reality:** N/A (لا يوجد).
* **Customer Journey:** `Search` → `Discover` → `View Place Details` → `Get Directions / Map Navigation`.
* **Interaction Types:** Search, View, Navigation (External / No System Transaction).
* **Pricing & Availability:** No Price. متاح دائماً أو حسب أوقات الزيارة العامة.
* **Geographic Logic:** Place محدد بـ Location دقيق (إحداثيات + معلم مرجعي في مديرية محددة).
* **Trust Requirements:** إثبات الوجود المكاني فقط (Existence Verification).
* **Data Sources:** Official, Field Operator, Community.
* **Data Freshness:** SLOW CHANGING.

#### 2. مستشفى / منشأة صحية (Hospital / Healthcare Facility)
* **هوية النشاط:** منشأة خدمية صحية عامة أو خاصة (مثل مستشفى الجمهوري بحجة). يمثل **Place** و **Business** مقيم فيه. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يقيم في Place ثابت. يحتوي داخلياً على Providers متعددين (أطباء، استشاريين).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Services + Information + Emergency Response.
* **Product & Service Reality:** يقدم خدمات طبية وفحوصات. السعر يخضع للوائح المنشأة (التراخيص والأهلية تخضع لـ [SPECIALIST REQUIRED]).
* **Customer Journey:** `Search` → `View Department Info` → `Contact (Phone)` → `On-site Visit`.
* **Interaction Types:** Search, View, Contact, Inquiry, Booking (اختياري للعيادات).
* **Pricing & Availability:** Fixed Price / Price Range. التوفر 24/7 للطوارئ.
* **Geographic Logic:** Fixed Place في مديرية معينة.
* **Trust Requirements:** رخصة وزارة الصحة [SPECIALIST REQUIRED]، إثبات الموقع وأرقام الطوارئ.
* **Data Sources:** Official, Business Submitted, Field Verification.
* **Data Freshness:** MEDIUM.

#### 3. جهة حكومية / خدمة عامة (Government Entity / Public Service)
* **هوية النشاط:** مكتب تنفيذي أو مؤسسة حكومية (مثل مكتب الأحوال المدنية بحجة). [FACT | HIGH]
* **Place vs Business vs Provider:** **Place** إداري يمثل جهة رسمية (Government Entity). ليس Business تجارياً.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Information Only + Public Administrative Services.
* **Customer Journey:** `Search` → `View Required Documents / Hours` → `Contact / Direction` → `On-site Visit`.
* **Interaction Types:** Search, View, Contact, Inquiry (لا توجد معاملات تجارية).
* **Pricing & Availability:** الرسم الحكومي المعتمد قانوناً. ساعات العمل الرسمية.
* **Trust Requirements:** التوثيق الرسمي لتبعية المقر والمسمى الإداري.
* **Data Sources:** Official, Administrative Field Audit.
* **Data Freshness:** SLOW CHANGING.

#### 4. سوق شعبي / سوق مركزي (Popular Market / Central Market)
* **هوية النشاط:** مجمع أو منطقة جغرافية تجارية تجمع عشرات التجار والبسطات (مثل سوق عبس المركزي). [OBSERVED | HIGH]
* **Place vs Business vs Provider:** **Place** رئيسي يضم داخله عدة Places و Businesses صغيرة.
* **Physical Presence:** Fixed Location (أو Seasonal / Temporary للأسواق الأسبوعية).
* **Offering Model:** Information Only (كدليل للمجمع).
* **Customer Journey:** `Search Market Location` → `Navigate to Market` → `In-person Discovery`.
* **Interaction Types:** Search, View, Navigation.
* **Pricing & Availability:** يوم السوق (Seasonal/Weekly Availability).
* **Trust Requirements:** إثبات وجود السوق وأيامه التشغيلية.
* **Data Sources:** Community, Field Operator, Local Authorities.
* **Data Freshness:** MEDIUM.

---

### Group B — Retail

#### 5. بقالة / متجر مواد غذائية (Grocery / Food Store)
* **هوية النشاط:** متجر تجزئة لبيع المواد الغذائية والاستهلاكية اليومية. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك Place (محل ثابت).
* **Physical Presence:** Fixed Location (أو Home-Based للبقاليات الصغرى).
* **Offering Model:** Products.
* **Product Reality:** أصناف متعددة (SKUs غير مرقمنة غالباً في البقالات الصغيرة). السعر ثابت نسبياً أو يتغير مع التوريد. البيع بالقطعة أو الوزن.
* **Customer Journey:** `Search` → `Contact / Visit` → `Select Items` → `Pay` → `Take / Local Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, Order (C / Conditional عبر الهاتف محلياً)، Pickup (C), Delivery (C).
* **Pricing & Availability:** Fixed / Daily Price.
* **Fulfillment & Delivery:** Customer Pickup أو Merchant Delivery محلي (C / Conditional).
* **Payment:** Cash عند الاستلام (Domain Observation).
* **Geographic Logic:** Fixed Place يخدم حارة/حي مجاور.
* **Trust Requirements:** إثبات وجود المحل ورقم التلفون.
* **Data Sources:** Business Submitted, Field Operator.
* **Data Freshness:** FAST CHANGING (للتوفر)، SLOW (للموقع).

#### 6. صيدلية (Pharmacy)
* **هوية النشاط:** منشأة تجزئة لبيع الأدوية والمستلزمات الطبية. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business في Place ثابت ويضم صيدلانياً (Provider).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products + Specialized Advisory Service.
* **Customer Journey:** `Search Pharmacy` → `Inquire Drug Availability (Phone/Msg)` → `Visit / Pickup / Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, Pickup (C), Delivery (C).
* **Pricing & Availability:** Official Price / Daily Price. ساعات عمل مناوبة.
* **Trust Requirements:** ترخيص صيدلة رسمي [SPECIALIST REQUIRED]، إثبات الوجود.
* **Data Sources:** Official, Business Submitted.
* **Data Freshness:** FAST CHANGING.

#### 7. محل هواتف (Phone Shop)
* **هوية النشاط:** متجر بيع هواتف جديدة ومستعملة وإكسسوارات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يقيم في Place.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products + Services (صيانة وشحن).
* **Customer Journey:** `Search` → `View Catalog/Offer` → `Inquire Price/Negotiate` → `Visit Store / Pickup`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Pickup (C).
* **Pricing & Availability:** Daily Market Price, Negotiable.
* **Trust Requirements:** السجل التجاري والوجود المحلي.
* **Data Sources:** Business Submitted, Field Observation.
* **Data Freshness:** FAST CHANGING.

#### 8. محل إلكترونيات (Electronics Shop)
* **هوية النشاط:** بيع أجهزة منزلية، شاشات، وحواسب. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business في Place (معرض/محل).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products + Services (ضمان، توصيل).
* **Customer Journey:** `Search` → `Browse/Inquire Specification` → `RFQ/Negotiate Price` → `Order` → `Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Order (C), Delivery (C).
* **Pricing & Availability:** Fixed / Market Price.
* **Trust Requirements:** السجل التجاري وسياسة الضمان المعلنة.
* **Data Sources:** Business Submitted.
* **Data Freshness:** MEDIUM.

#### 9. محل أثاث (Furniture Shop)
* **هوية النشاط:** معرض بيع أثاث جاهز وتفصيل حسب الطلب. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يملك معرضاً (Place) وأحياناً ورشة تصنيع تابعة.
* **Physical Presence:** Fixed Location (معرض + ورشة).
* **Offering Model:** Products (جاهز) + Services (تفصيل وتصميم).
* **Customer Journey:** `Search` → `Visit Showroom` → `Custom Specs RFQ` → `Deposit/Order` → `Delivery & Installation`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Order (C), Delivery (C).
* **Pricing & Availability:** Fixed (للجاهز) / Custom Quote (للتفصيل).
* **Trust Requirements:** المعرض، الورشة، وسابقة الأعمال.
* **Data Sources:** Business Submitted, Field Visit.
* **Data Freshness:** SLOW (للمعرض)، MEDIUM (للمواعيد).

#### 10. محل ملابس (Clothing Shop)
* **هوية النشاط:** تجزئة ملابس وأحذية وأقمشة. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يقيم في Place ثابت.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products.
* **Customer Journey:** `Search` → `Visit Store` → `Try & Bargain` → `Purchase & Pickup`.
* **Interaction Types:** Search, View, Contact, Inquiry, Pickup (C).
* **Pricing & Availability:** Negotiable / Seasonally Variable.
* **Trust Requirements:** موقع المحل والسمعة الميدانية.
* **Data Sources:** Business Submitted, Field Observation.
* **Data Freshness:** FAST CHANGING.

---

### Group C — Wholesale

#### 11. تاجر جملة (Wholesaler)
* **هوية النشاط:** بيع المواد الاستهلاكية بكميات كبيرة للمحلات والتجار الصغار. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك مخزناً/معرضاً (Place).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products (Wholesale).
* **Product Reality:** البيع بالشد/الكرتون/الطن. حد أدنى للطلب (Minimum Quantity). السعر متغير يومياً.
* **Customer Journey:** `Search Wholesaler` → `Inquire Price List` → `RFQ / Bulk Negotiate` → `Order Confirmation` → `Delivery/Pickup`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Order (C), Delivery (C).
* **Pricing & Availability:** Daily Price / Quantity-Based Price.
* **Trust Requirements:** السجل التجاري وموقع المخازن.
* **Data Sources:** Business Submitted.
* **Data Freshness:** FAST CHANGING.

#### 12. موزع مواد غذائية (Food Distributor)
* **هوية النشاط:** توزيع سلع وكالات عبر سيارات توزيع متنقلة على البقاليات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك مركز توزيع (Place) وأسطول توزيع (Providers/Mobile Units).
* **Physical Presence:** Mixed (Fixed Warehouse + Mobile Distribution Fleet).
* **Offering Model:** Products + Distribution Service.
* **Customer Journey:** `Search Distributor` → `Inquire Route/Day` → `Order` → `Mobile Van Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, Order (C), Mobile Delivery (C).
* **Pricing & Availability:** Wholesale Fixed/Agency Price.
* **Trust Requirements:** الوكالة الرسمية وهوية المندوبين.
* **Data Sources:** Business Submitted.
* **Data Freshness:** MEDIUM.

#### 13. تاجر مواد بناء (Building Materials Merchant)
* **هوية النشاط:** بيع الأسمنت، الحديد، النيس، والآجر. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك حوش مواد بناء (Place).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products + Transport Service.
* **Customer Journey:** `Search` → `RFQ (Quantity & Site)` → `Quote with Transport` → `Truck Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Order (C), Delivery (C).
* **Pricing & Availability:** Market Price / Daily Price.
* **Trust Requirements:** المقر الميداني والمصداقية في الأوزان.
* **Data Sources:** Business Submitted, Field Audit.
* **Data Freshness:** FAST CHANGING.

#### 14. تاجر قطع غيار (Spare Parts Dealer)
* **هوية النشاط:** بيع قطع غيار السيارات والمعدات (جديد ومستعمل). [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك محل/مخزن قطع غيار.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products.
* **Customer Journey:** `Search Parts Shop` → `Inquire by Sample/Photo` → `Confirm Fit & Price` → `Purchase`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Order (C), Pickup (C).
* **Pricing & Availability:** Fixed / Negotiable Price.
* **Trust Requirements:** التخصص والمصداقية في جودة القطعة.
* **Data Sources:** Business Submitted.
* **Data Freshness:** MEDIUM.

---

### Group D — Hybrid Commerce

#### 15. متجر بيع + تركيب (Sale + Installation Shop)
* **هوية النشاط:** بيع أنظمة الطاقة الشمسية والتكييف مع تقديم خدمة التركيب الميداني. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك معرضاً (Place) وفنيي تركيب (Providers).
* **Physical Presence:** Mixed (Fixed Showroom + Mobile Team).
* **Offering Model:** Products + Services (هجين).
* **Customer Journey:** `Search` → `Select Hardware` → `Site Survey Request` → `RFQ (Items + Labor)` → `Installation & Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C), Order (C), On-site Service.
* **Pricing & Availability:** Hardware Price + Installation Quote.
* **Trust Requirements:** الاعتماد الفني وضمان الأجهزة.
* **Data Sources:** Business Submitted, Field Audit.
* **Data Freshness:** MEDIUM.

#### 16. متجر بيع + صيانة (Sale + Maintenance Shop)
* **هوية النشاط:** بيع أجهزة إلكترونية/هواتف مع وجود قسم صيانة داخلي. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يضم مكان بيع وفنيي صيانة (Providers).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products + Services.
* **Customer Journey:** `Search Shop` → `Visit with Broken Device` → `Diagnostic Quote` → `Repair` → `Pickup`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Pickup (C).
* **Pricing & Availability:** Fixed Product Price + Diagnostic Fee.
* **Trust Requirements:** أمانة الفنيين ودقة التشخيص.
* **Data Sources:** Business Submitted.
* **Data Freshness:** MEDIUM.

#### 17. ورشة تبيع قطع غيار + تقدم خدمة (Workshop Parts Sale + Service)
* **هوية النشاط:** ورشة ميكانيكا/كهرباء سيارات تبيع الزيوت والقطع وتنفذ الخدمة. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يقيم في ورشة (Place) وتضم فنيين (Providers).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products + Services.
* **Customer Journey:** `Drive Vehicle to Workshop` → `Problem Assessment` → `Estimate` → `Repair` → `Payment`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C), Service Execution.
* **Pricing & Availability:** Parts Fixed/Market + Labor Negotiable.
* **Trust Requirements:** خبرة الورشة وضمان الشغل.
* **Data Sources:** Field Operator, Business Submitted.
* **Data Freshness:** SLOW (للموقع)، FAST (للازدحام).

#### 18. نشاط يجمع الجملة والتجزئة (Wholesale + Retail Hybrid)
* **هوية النشاط:** متجر مواد غذائية يبيع بالقطعة وبالكرتون للجملة. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business واحد يملك Place صالة عرض ومخزناً.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products (Wholesale & Retail).
* **Customer Journey:** `Search` → `Inquire Rate (Retail/Wholesale)` → `Purchase / Bulk Order`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Order (C), Pickup (C), Delivery (C).
* **Pricing & Availability:** Dual Pricing Scheme.
* **Trust Requirements:** وضوح سياسة الشريحة السعرية.
* **Data Sources:** Business Submitted.
* **Data Freshness:** MEDIUM.

---

### Group E — Food

#### 19. مطعم (Restaurant)
* **هوية النشاط:** إعداد وتقديم الوجبات الساخنة والأطعمة. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك صالة طعام ومطبخاً (Place).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products (وجبات) + Services (ضيافة).
* **Customer Journey (Dine-in):** `Search` → `Visit` → `Order from Menu` → `Eat` → `Pay`.
* **Customer Journey (Takeaway/Delivery):** `Search` → `Phone Order` → `Preparation` → `Pickup / Delivery`.
* **Interaction Types:** Search, View, Contact, Inquiry, Order (C — غير إلزامي للـ dine-in حصرياً)، Pickup (C), Delivery (C).
* **Pricing & Availability:** Fixed Menu Prices. توفر الوجبات ينتهي بنفاد الكمية لليوم.
* **Trust Requirements:** النظافة والجودة.
* **Data Sources:** Business Submitted, Community.
* **Data Freshness:** FAST CHANGING.

#### 20. مطبخ / إنتاج منزلي (Home-based Kitchen / Production)
* **هوية النشاط:** إعداد أكلات حلويات ومعجنات منزلية بطلب مسبق. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Provider/Business يعمل من المنزل (لا يملك معرضاً عاماً).
* **Physical Presence:** Home Based (إخفاء العنوان الدقيق والاكتفاء بـ Discovery Context الحي/المنطقة).
* **Offering Model:** Products (Made-to-Order).
* **Customer Journey:** `Discover` → `Inquire & Custom Request` → `Agree Price/Time` → `Prepayment/Deposit` → `Delivery/Pickup`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Booking/Order (C), Delivery (C).
* **Pricing & Availability:** Fixed Menu / Custom Quote. حجز مسبق.
* **Trust Requirements:** النظافة المنزلية والتزكية المحلية.
* **Data Sources:** Business Submitted.
* **Data Freshness:** MEDIUM.

#### 21. مخبز (Bakery)
* **هوية النشاط:** إنتاج وبيع الخبز (ملوح، كدَم، روطي). [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يقيم في مخبز (Place ثابت).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Products.
* **Customer Journey:** `Search` → `Visit Bakery` → `Buy Bread` → `Pay Cash`.
* **Interaction Types:** Search, View, Navigation (المعاملات عبر المنصة خارجية).
* **Pricing & Availability:** Fixed Official/Market Price.
* **Trust Requirements:** جودة الخبز والوزن القانوني.
* **Data Sources:** Field Operator, Community.
* **Data Freshness:** SLOW (للموقع)، FAST (لساعات العمل).

---

### Group F — Services

#### 22. ورشة سيارات (Auto Repair Shop)
* **هوية النشاط:** إصلاح وتوضيب ميكانيكا وكهرباء المركبات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك الورشة (Place) وتضم فنيين (Providers).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Services + Parts.
* **Customer Journey:** `Search` → `Visit` → `Inspection` → `Diagnostic Quote` → `Repair` → `Payment`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C), Service Execution.
* **Pricing & Availability:** Variable Price / Task-Based Quote.
* **Trust Requirements:** سمعة الأسطى والضمان التشغيلي.
* **Data Sources:** Field Verification, Business Submitted.
* **Data Freshness:** MEDIUM.

#### 23. فني كهرباء (Electrician)
* **هوية النشاط:** تركيب وصيانة التأسيسات الكهربائية للمنازل. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** **Provider** حرفي متنقل. يعمل بدون Place استقبال عام.
* **Physical Presence:** Mobile / Field Service (Service Coverage Radius).
* **Offering Model:** Services.
* **Customer Journey:** `Search Electrician` → `Call / Explain Problem` → `Site Visit & Diagnostic` → `Repair` → `Payment`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C — غير إلزامي للإصلاح البسيط)، On-site Service.
* **Pricing & Availability:** Task-Based Quote / Hourly.
* **Trust Requirements:** الهوية الشخصية والأمانة (تزكية).
* **Data Sources:** Provider Submitted, Community.
* **Data Freshness:** FAST CHANGING.

#### 24. فني طاقة شمسية (Solar Energy Technician)
* **هوية النشاط:** تصميم وتركيب وصيانة منظومات الطاقة الشمسية والبطاريات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Provider متخصص قد يعمل مستقلاً أو يتبع محلاً تجارياً.
* **Physical Presence:** Mobile / Field Service / Fixed Shop (Mixed).
* **Offering Model:** Services.
* **Customer Journey:** `Search` → `Contact Load Details` → `Site Survey` → `RFQ` → `Installation` → `Testing`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C), On-site Service.
* **Pricing & Availability:** Capacity Quote / Task-Based.
* **Trust Requirements:** الاعتماد الفني وسابقة التركيبات.
* **Data Sources:** Provider Submitted, Field Audit.
* **Data Freshness:** MEDIUM.

#### 25. فني تبريد وتكييف (HVAC / Refrigeration Technician)
* **هوية النشاط:** صيانة وتعبئة فريون المكيفات والثلاجات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Provider قد يملك ورشة صغيرة أو يعمل بسيارته.
* **Physical Presence:** Mobile / Field Service / Fixed Workshop.
* **Offering Model:** Services + Parts.
* **Customer Journey:** `Search` → `Call` → `Describe Issue` → `Home Visit & Inspection` → `Quote` → `Repair`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C), On-site Service.
* **Pricing & Availability:** Diagnostic Fee + Repair Quote.
* **Trust Requirements:** الأمانة المنزلية وجودة القطع.
* **Data Sources:** Provider Submitted, Community.
* **Data Freshness:** FAST.

#### 26. سباك (Plumber)
* **هوية النشاط:** صيانة وتأسيس شبكات المياه والمضخات والخزانات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Provider فردي متنقل.
* **Physical Presence:** Mobile / Field Service.
* **Offering Model:** Services.
* **Customer Journey:** `Search` → `Emergency Call` → `Site Visit` → `Fix Issue` → `Payment`.
* **Interaction Types:** Search, View, Contact, Request (C), On-site Service.
* **Pricing & Availability:** Task-Based / Emergency Rate.
* **Trust Requirements:** السرعة في الاستجابة والأمانة.
* **Data Sources:** Community, Provider Submitted.
* **Data Freshness:** FAST CHANGING.

#### 27. نجار / حداد / ألمنيوم (Carpenter / Blacksmith / Aluminium Worker)
* **هوية النشاط:** تصنيع وتركيب أبواب ونوافذ وهياكل معدنية/خشبية. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك ورشة (Place) وتضم عمالة (Providers).
* **Physical Presence:** Fixed Workshop + Field Installation (Mixed).
* **Offering Model:** Products + Services (Made-to-Order).
* **Customer Journey:** `Search Workshop` → `Measurement Request` → `RFQ (Specs & Meter)` → `Fabrication` → `Installation`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), RFQ (C), Order (C), On-site Service.
* **Pricing & Availability:** Meter-Based Price / Custom Quote.
* **Trust Requirements:** جودة التصنيع والالتزام بالمواعيد.
* **Data Sources:** Business Submitted, Field Observation.
* **Data Freshness:** SLOW.

#### 28. مصمم / مطور / خدمة مهنية عن بعد (Remote Professional Service)
* **هوية النشاط:** تقديم خدمات تصميم، برمجة، أو استشارات عن بعد. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Provider / Business يعمل كلياً عن بعد (Digital/Remote). لا يحتاج Place مادي للاستقبال العام.
* **Physical Presence:** Remote (No Physical Reception Place).
* **Offering Model:** Services (Digital Deliverables).
* **Customer Journey:** `Search Profile` → `Contact Scope` → `RFQ / Proposal` → `Digital Execution` → `Handover`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C — غير إلزامي للخدمات البسيطة)، Remote Service Delivery.
* **Pricing & Availability:** Scope Quote / Hourly Rate.
* **Trust Requirements:** سابقة الأعمال (Portfolio) وتقييمات العملاء.
* **Data Sources:** Self-Registered Provider.
* **Data Freshness:** SLOW.

---

### Group G — Appointment-Based

#### 29. عيادة (Clinic)
* **هوية النشاط:** تقديم كشوفات واستشارات طبية تشخيصية بواسطة طبيب أخصائي. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business (العيادة) يضم Place وطبيباً (Provider).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Services.
* **Customer Journey:** `Search Clinic` → `Check Doctor Hours` → `Contact / Book Queue` → `Visit Clinic` → `Pay Consultation`.
* **Interaction Types:** Search, View, Contact, Inquiry, Booking (C — غير إلزامي للكشف الفوري المباشر)، On-site Service.
* **Pricing & Availability:** Fixed Consultation Fee.
* **Trust Requirements:** ترخيص ممارسة المهنة [SPECIALIST REQUIRED]، المؤهل الطبي.
* **Data Sources:** Official, Business Submitted.
* **Data Freshness:** MEDIUM.

#### 30. صالون / حلاق (Salon / Barber)
* **هوية النشاط:** خدمات العناية الشخصية والتجميل. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك صالوناً (Place) ويضم حلاقين (Providers).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Services.
* **Customer Journey:** `Search Salon` → `Visit / Book Queue` → `Service Execution` → `Payment`.
* **Interaction Types:** Search, View, Contact, Inquiry, Booking (C), On-site Service.
* **Pricing & Availability:** Fixed Service Menu / Custom Package.
* **Trust Requirements:** النظافة والتعقيم ومهارة الكادر.
* **Data Sources:** Business Submitted, Field Observation.
* **Data Freshness:** FAST.

#### 31. مركز تدريب (Training Center)
* **هوية النشاط:** تقديم دورات تدريبية ولغات ومهارات. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك مقراً (Place) ومدربين (Providers).
* **Physical Presence:** Fixed Location.
* **Offering Model:** Services (Educational Programs).
* **Customer Journey:** `Search Center` → `Inquire Schedule` → `Register / Seat Booking` → `Attend Classes`.
* **Interaction Types:** Search, View, Contact, Inquiry, Booking (C), Subscription (C).
* **Pricing & Availability:** Fixed Course Fee.
* **Trust Requirements:** التراخيص الرسمية [SPECIALIST REQUIRED]، اعتماد الشهادات.
* **Data Sources:** Official, Business Submitted.
* **Data Freshness:** MEDIUM.

#### 32. خدمة تعتمد على موعد عامة (General Appointment-Based Service)
* **هوية النشاط:** مكاتب تدقيق، استشارات قانونية، أو استوديوهات تصوير. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك مقراً (Place) وتنسيق وقت لقاء.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Services.
* **Customer Journey:** `Search` → `Book Slot` → `Attend Session` → `Deliver Result`.
* **Interaction Types:** Search, View, Contact, Inquiry, Booking (C), Fulfillment.
* **Pricing & Availability:** Fixed Package / Hourly Rate.
* **Trust Requirements:** السمعة المهنية والسرية [SPECIALIST REQUIRED].
* **Data Sources:** Business Submitted.
* **Data Freshness:** SLOW.

---

### Group H — Mobile / Field Service

#### 33. فني متنقل (Mobile Technician)
* **هوية النشاط:** فني صيانة هواتف/حواسيب ينتقل بسيارته/دراجته للعميل. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** **Provider** محوري بدون Place مادي استقبال عام.
* **Physical Presence:** Mobile / Field Service (Service Coverage Area).
* **Offering Model:** Services + Parts.
* **Customer Journey:** `Search Mobile Tech` → `Describe Issue` → `Confirm Location` → `Tech Arrives` → `Repair`.
* **Interaction Types:** Search, View, Contact, Request (C), RFQ (C), On-site Service.
* **Pricing & Availability:** Call-out Fee + Repair Quote.
* **Trust Requirements:** إثبات الهوية الشخصية والأمانة الفردية.
* **Data Sources:** Provider Self-Registered.
* **Data Freshness:** FAST CHANGING.

#### 34. سائق / خدمة نقل (Driver / Transport Service)
* **هوية النشاط:** سائق تكسي، باص نقل، أو بيجو لنقل الركاب/البضائع. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** **Provider** (السائق ورقم اللوحة). قد يرتبط بمكتب فرزة (Place) أو يعمل مستقلاً.
* **Physical Presence:** Mobile / Transport.
* **Offering Model:** Transport Services.
* **Customer Journey:** `Search Transport` → `Contact Driver/Office` → `Specify Pickup & Destination` → `Agree Fare` → `Transport`.
* **Interaction Types:** Search, View, Contact, Inquiry, RFQ (C), Request (C), Fulfillment.
* **Pricing & Availability:** Route Fare / Distance-Based Quote.
* **Trust Requirements:** رخصة القيادة وسلامة المركبة [SPECIALIST REQUIRED].
* **Data Sources:** Field Operator, Provider Submitted.
* **Data Freshness:** FAST CHANGING.

#### 35. صهريج مياه / خدمة توريد متنقلة (Water Tanker / Mobile Supply)
* **هوية النشاط:** توريد مياه الشرب أو الاستخدام (وايت ماء) للمنازل والمزارع. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business/Provider يمتلك صهريج شاحنة (وايت).
* **Physical Presence:** Mobile / Field Supply (Coverage Radius من محطة المياه).
* **Offering Model:** Products (مياه) + Transport Service.
* **Customer Journey:** `Search Water Tanker` → `Call Driver` → `State Address & Tank Size` → `Dispatch & Offload`.
* **Interaction Types:** Search, View, Contact, Request (C), Order (C), Delivery (C).
* **Pricing & Availability:** Distance & Capacity Based Price.
* **Trust Requirements:** عذوبة المياه وسعة الصهريج الحقيقية.
* **Data Sources:** Field Operator, Provider Submitted.
* **Data Freshness:** FAST.

#### 36. خدمة منزلية (Home Care / Cleaning Service)
* **هوية النشاط:** تقديم خدمات النظافة، الغسيل، أو التمريض المنزلي. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** مكتب (Business) يوفر كوادر أو **Provider** مستقلة.
* **Physical Presence:** Field / Home Service (Coverage Area).
* **Offering Model:** Services.
* **Customer Journey:** `Search Service` → `Define Scope & Agree Terms` → `Provider Arrives` → `Execution`.
* **Interaction Types:** Search, View, Contact, Request (C), RFQ (C), Booking (C), On-site Service.
* **Pricing & Availability:** Hourly Rate / Task Rate.
* **Trust Requirements:** التحقق الصارم من الهوية والسمعة الأخلاقية [SPECIALIST REQUIRED].
* **Data Sources:** Verification Office, Trusted Referrals.
* **Data Freshness:** MEDIUM.

---

### Group I — Multi-Branch / Complex

#### 37. شركة متعددة الفروع (Multi-Branch Company)
* **هوية النشاط:** شركة تجارية أو مصرفية تملك فروعاً في مدن ومحافظات متعددة (مثل بنك الكريمي، صيدليات العزاني). [OBSERVED | HIGH]
* **Place vs Business vs Provider:** **Business** واحد يمثل الهوية المركزية، وتتبع له **Branches** عند وجود تمايز تشغيلي محلي. كل Branch يرتبط بـ **Place** محدد.
* **Physical Presence:** Multiple Locations.
* **Offering Model:** Products / Services / Financial Services.
* **Customer Journey:** `Search Business/Branch` → `Filter Closest Branch` → `View Branch Hours` → `Visit Specific Branch`.
* **Interaction Types:** Search, View, Contact, Inquiry, Branch-level Interaction.
* **Pricing & Availability:** Centralized Policy with Local Branch Availability.
* **Trust Requirements:** التوثيق الرسمي للشركة وإثبات تفرعها [SPECIALIST REQUIRED].
* **Data Sources:** Official Business Registry, Corporate Management.
* **Data Freshness:** SLOW (للهوية)، MEDIUM (لساعات وتوفر الفروع).

#### 38. مؤسسة لها أكثر من نشاط (Multi-Activity Institution)
* **هوية النشاط:** مجموعة تجارية تملك سوبرماركت، صيدلية، ومحطة وقود في نفس المجمع. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business إداري واحد يمارس أنشطة تصنيفية مختلفة في موضع واحد أو متجاور.
* **Physical Presence:** Fixed Location (Shared Commercial Complex).
* **Offering Model:** Products + Services (متعددة الفئات).
* **Customer Journey:** `Search Category` → `Discover Department inside Complex` → `Interact`.
* **Interaction Types:** Search by Category, View Department, Transact per Department.
* **Trust Requirements:** إثبات التراخيص المختلفة لكل قسم [SPECIALIST REQUIRED].
* **Data Sources:** Business Submitted, Field Audit.
* **Data Freshness:** MEDIUM.

#### 39. نشاط له أكثر من موقع تشغيلي (Business with Multiple Operational Sites)
* **هوية النشاط:** شركة مقاولات تملك مكتباً إدارياً، وحوش معدات، وكسارة أطراف المديرية. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business واحد مرتبط بثلاثة **Places** تشغيلية مختلفة الوظيفة (مكتب، حوش، كسارة).
* **Physical Presence:** Multiple Operational Sites.
* **Offering Model:** Services + Bulk Materials.
* **Customer Journey:** `Search Admin Office` → `Contract & RFQ` → `Fulfillment Dispatched from Operational Site`.
* **Interaction Types:** Search Office, Contract at Office, Dispatch from Site.
* **Trust Requirements:** توثيق المقر الرئيسي وتراخيص مواقع التشغيل [SPECIALIST REQUIRED].
* **Data Sources:** Official, Business Submitted.
* **Data Freshness:** SLOW.

#### 40. نشاط يعمل من موقع + خدمة متنقلة (Physical Location + Mobile Service)
* **هوية النشاط:** مركز صيانة تكييف له محل ثابت وسيارات صيانة متنقلة. [OBSERVED | HIGH]
* **Place vs Business vs Provider:** Business يمتلك Place ثابتاً كقاعدة تشغيل ويدير فنيين متنقلين (Providers & Coverage Areas).
* **Physical Presence:** Mixed (Fixed Place + Mobile Coverage Radius).
* **Offering Model:** Products + Services (On-site & In-shop).
* **Customer Journey:** `Request Visit / Visit Shop` → `Diagnosis & Service Execution`.
* **Interaction Types:** Search, View, Contact, Inquiry, Request (C), Booking (C), Delivery (C), On-site Service.
* **Pricing & Availability:** Shop Rate vs Mobile Rate.
* **Trust Requirements:** توثيق المحل المادي كمرجعية ثقة تضمن الجودة المتنقلة.
* **Data Sources:** Business Submitted, Field Observation.
* **Data Freshness:** MEDIUM.

---

### Group J — Special / Regulated

#### 41. نشاط يحتاج متطلبات أو قيود تنظيمية خاصة (Regulated / Special Compliance Activity)
*(تركيز الدراسة حصرياً على: النمط التشغيلي، التراخيص، التحقق، والقيود القانونية والتنظيمية العامة - مثل الصرافة، تحويل الأموال، بيع الغاز المنزلي).* [FACT | HIGH]

* **هوية النشاط:** منشأة تعمل تحت مظلة تنظيمية وتراخيص حكومية مشددة. [SPECIALIST REQUIRED]
* **Place vs Business vs Provider:** Business معتمد قانونياً يقيم في Place مرخص بشدة.
* **Physical Presence:** Fixed Location.
* **Offering Model:** Specialized Regulated Services / Commodities.
* **Product & Service Reality:** المعاملات خاضعة لسقوف تنظيمية وأحكام القانون النافذ. المنصة تعرض **المعلومة والتواجد والموثوقية والتواصل المعتمد فقط**.
* **Customer Journey:** `Search Licensed Facility` → `Verify Official License Status` → `View Official Hours & Contact` → `Visit Facility`.
* **Interaction Types:** Search, View, Contact, Inquiry, Official Compliance Check.
* **Pricing & Availability:** Official Central Rates / Regulated.
* **Trust Requirements:** **أقصى درجات التحقق (Strict Compliance Verification):** مطابقة الترخيص الحكومي، السجل التجاري النافذ، هوية المالك [SPECIALIST REQUIRED].
* **Data Sources:** Official Regulatory Databases, High-Priority Field Audits.
* **Data Freshness:** FAST CHANGING (حالة التراخيص والتعليمات).

---

## 6. Physical Presence & Geographic Concepts Separation (الفصل بين المفاهيم الجغرافية)

تثبت الدراسة الميدانية ضرورة الفصل التام والمطلق بين 4 مفاهيم جغرافية مستقلة لتجنب الخلط المعماري: [FACT | HIGH]

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Separation of Geographic Concepts                    │
├──────────────────────┬─────────────────────────────────────────────────┤
│ 1. Physical Location │ موضع مادي فعلي ثابت يمثله Place/PlaceLocation.  │
│ 2. Administrative    │ سياق إداري مرجعي محسوم: Governorate → District. │
│ 3. Service Coverage  │ النطاق الذي يقدم فيه المزود/النشاط خدمته الميدانية.│
│ 4. Discovery Context │ النطاق الجغرافي المستعمل للبحث والاكتشاف من العميل.│
└──────────────────────┴─────────────────────────────────────────────────┘
```

> **تأكيد القرارات الجغرافية المقفلة [FACT | HIGH]:** تلتزم الدراسة بالعقود الجغرافية المقفلة في المشروع (`GEO-001` → `GEO-005` و `GEOGRAPHIC_DATA_CONTRACT`):
> * الاعتماد الحصري على مصادر OCHA Yemen COD-AB.
> * الاعتماد على PostGIS للعمليات الجيو-مكانية.
> * حدود المديرية (`District boundary`) كمرجع مكاني أساسي، و `ST_Covers` كسلطة مكانية، و `nearest-Place` كـ fallback، و `PlaceLocation` كمفهوم مكاني ثابت.
> * لا تعد النطاقات الخدمية (`Service Coverage`) بديلاً عن `Place` المادي.

### أنماط التواجد المكاني التشغيلي:
1. `Fixed Location`: محل/منشأة ثابتة بعنون ومعالم مرئية للجمهور.
2. `Multiple Locations`: مواضع تشغيلية مختلفة لنفس النشاط.
3. `Home Based`: إنتاج/خدمة من المنزل (إخفاء الإحداثيات الدقيقة للحفاظ على الخصوصية).
4. `Mobile`: فني/سائق/صهريج ينتقل ميدانياً بلا مقر استقبال عام (يعتمد على Coverage Area).
5. `Remote`: تقديم مخرجات رقمية عن بعد كلياً.
6. `Seasonal`: أنشطة موسمية (أسواق أسبوعية).
7. `Temporary`: مبادرات/مقاولات مؤقتة الزمان والمكان.
8. `Mixed`: مقر ثابت + تغطية ميدانية متنقلة.

---

## 7. Product Models (نماذج المنتجات في الواقع)

المنتجات في الواقع التجاري اليمني تخضع للخصائص التشغيلية التالية: [OBSERVED | HIGH]

1. **السيولة السعرية (Price Volatility):** الأسعار غير ثابتة في عدة قطاعات (قطع الغيار، الإلكترونيات، المواد الغذائية بالجملة، مواد البناء)، وتتأثر بسعر الصرف اليومي وتكاليف المشتقات والنقل [OBSERVATION — NOT STATISTICALLY VALIDATED].
2. **غياب الباركود و SKUs الموحدة:** تعتمد البقاليات ومحلات الملابس والأثاث على الموديل أو الوصف الشفهي بدون SKU رقمي موحد. [OBSERVED | HIGH]
3. **وحدات البيع المتنوعة:** البيع يتوزع بين: بالقطعة، بالوزن (كجم/طن)، بالحجم (لتر/م3)، بالمتر المربع، أو بالكرتون/الربطة. [OBSERVED | HIGH]
4. **البيع الجاري بدون مخزون رقمي (Selling Without Digital Inventory):** التجار يبيعون السلع المتاحة في الرفوف دون نظام إدارة مخزون محدث لحظياً. [OBSERVED | HIGH]
5. **التفاوض والتسعير حسب الزبون:** السعر في محلات التجزئة والأثاث والملابس خاضع للفصال (Negotiation)، وفي الجملة خاضع لحجم الكمية. [OBSERVED | HIGH]

---

## 8. Service Models (نماذج الخدمات في الواقع)

أظهر تحليل الخدمات الخصائص الحاكمة التالية: [OBSERVED | HIGH]

1. **نمط التنفيذ (Execution Mode):** خدمة بمقر النشاط (On-site)، عند العميل (In-Home / Field)، أو عن بعد (Remote).
2. **متطلبات المعاينة والفحص (Diagnostic Requirement):** لوحظ أن جزءاً كبيراً من خدمات الورش والسباكة والكهرباء والتبريد والبناء لا يمكن تسعيرها قبل زيارة وفحص المشكلة ميدانياً (Diagnostic / Site Survey) [OBSERVATION — NOT STATISTICALLY VALIDATED].
3. **التسعير التفاوضي والتسعير بالمهمة:** السعر يعتمد على "المقطوعية" (Task Flat Rate) أو "عروض الأسعار المخصصة" (RFQ). [OBSERVED | HIGH]
4. **التوفر والجدولة (Availability vs Capacity):** توفر الخدمة لا يعني فتح المحل، بل يعني وجود الفني المباشر وشاغر القدرة الاستيعابية (Capacity). [OBSERVED | HIGH]

---

## 9. Customer Journey Models (نماذج رحلة العميل كـ Alternative Paths)

تثبت الدراسة أن مسارات العملاء تختلف باختلاف الفئة والهدف التشغيلي، ويجب عرضها كـ **مسارات بديلة وتوازية (Alternative Parallel Paths)** وليست سلسلة خطية إلزامية: [DESIGN CANDIDATE]

```
                                 [ Discovery ]
                                       │
      ┌────────────────┬───────────────┼───────────────┬────────────────┐
      ▼                ▼               ▼               ▼                ▼
[ Path A: Inquiry ] [ Path B: Req/RFQ ] [ Path C: Book ] [ Path D: Order ] [ Path E: Visit ]
      │                │               │               │                │
      ▼                ▼               ▼               ▼                ▼
(End / External) (Agreement/Quote) (Service Exec) (Fulfillment)   (External Offline)
```

### تفصيل المسارات المتوازية:
* **Path A (Inquiry Path):** `Discovery` → `Inquiry` → (ينتهي الاستفسار أو يتحول لتفاعل خارجي).
* **Path B (RFQ / Agreement Path):** `Discovery` → `Request` → `RFQ` → `Custom Quote` → `Agreement`.
* **Path C (Booking Path):** `Discovery` → `Booking` → `Service Execution`.
* **Path D (Order Path):** `Discovery` → `Order` → `Fulfillment`.
* **Path E (Direct Offline Visit):** `Discovery` → `Contact / Navigation` → `External Physical Visit`.

---

## 10. Interaction & Commitment Models (نماذج التفاعل والالتزام)

التأكيدات الحاكمة لمستويات التفاعل والتزام الأطراف: [FACT | HIGH]

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Levels of Interaction & Commitment                   │
├─────────────┬───────────────────────────────────────────────────────────┤
│ Inquiry     │ استفسار عام عن معلومة، موقع، ساعات، أو توفر. لا يرتب التزاماً.    │
│ Request     │ طلب اهتمام أو طلب معاينة ميدانية/فحص. يقبل الرفض أو التعديل.      │
│ RFQ         │ طلب عرض سعر مخصص لمواصفات أو كميات أو خدمات محددة.               │
│ Booking     │ حجز موعد زمن أو سعة مقعد/طبيب/فني دون نقل ملكية سلعة.            │
│ Order       │ التزام تجاري مؤكد بشراء عناصر/خدمات بسعر وشروط محددة.             │
│ Fulfillment │ مرحلة التنفيذ الفعلي لما تم الاتفاق عليه (تصنيع، أداء، تجهيز).    │
│ Delivery    │ الحركة اللوجستية المادية لنقل شيء من نقطة إلى نقطة.              │
└─────────────┴───────────────────────────────────────────────────────────┘
```

---

## 11. Pricing Models (نماذج التسعير كـ Domain Observations)

تم رصد 10 نماذج تسعيرية تشغيلية باعتبارها ملاحظات مجال (Domain Observations): [OBSERVED | HIGH]

1. **`Fixed Price`**: سعر معلن ثابت (مثل وجبات المطاعم، كشفية الطبيب).
2. **`Price Range`**: نطاق سعر (مثل صيانة المحرك بين 20,000 و 50,000 ريال).
3. **`Quote / RFQ`**: سعر مخصص يصدر بعد دراسة الطلب والمواصفات (الأثاث، المقاولات).
4. **`Negotiable`**: سعر قابل للتفاوض والفصال الميداني (الملابس، أجور الفنيين).
5. **`Market / Daily Price`**: سعر متغير يومياً مرتبط بالبورصة أو الصرف.
6. **`Weight-Based`**: سعر محسوب بالوزن (الخضروات، الأسمنت).
7. **`Quantity / Volume Price`**: سعر ينخفض مع زيادة الكمية (الجملة).
8. **`Custom Price`**: سعر يحسب بناءً على معادلة مدخلات.
9. **`No Price`**: الأنشطة غير التجارية (المعالم، الجهات الحكومية).
10. **`Distance-Based Price`**: سعر يرتبط بعد المسافة وتكاليف الوقود (وايت الماء).

---

## 12. Availability Models (نماذج التوفر والجداول الزمنية)

مفهوم **"Open"** للمكان يقتصر على فتح الباب ولا يعني توفر المنتج أو الخدمة: [FACT | HIGH]

* **`Operating Hours (Place Open/Closed)`**: فتح الباب المادي أو المقر الإداري.
* **`Provider Availability`**: تواجد الفني/الطبيب وقدرته التشغيلية.
* **`Product Availability`**: وجود السلعة في الرف/المخزن لحظياً.
* **`Service Appointment Slot / Capacity`**: وجود شاغر زمني والسعة التشغيلية المتاحة.
* **`Seasonal / Batch Availability`**: توفر وجبات المطعم أو الخبز التي تنفد في أوقات محددة.

---

## 13. Fulfillment Models (تثبيت مبدأ Fulfillment ≠ Delivery)

تثبت الدراسة المبدأ المعماري الصارم: **Fulfillment ≠ Delivery**. [FACT | HIGH]

* **Fulfillment بدون Delivery:** المعاينة الطبية، الحلاقة، الاستشارة القانونية، الأكل في المطعم، أو الاستلام من الكاونتر (Customer Pickup).
* **Fulfillment بموقع العميل (On-site Fulfillment):** تركيب المنظومات، السباكة، والتمريض المنزلي.
* **Fulfillment الرقمي (Remote Fulfillment):** تسليم المخرجات الرقمية عبر الشبكة.

---

## 14. Delivery Models (نماذج التوصيل كـ Domain Observations)

أنماط النقل والتوصيل الملاحظة تشغيلياً: [OBSERVED | HIGH]

1. **`Customer Pickup`**: العميل يتكفل بالنقل بنفسه (الموديل الشائع والملاحظ في معظم الحالات [OBSERVATION — NOT STATISTICALLY VALIDATED]).
2. **`Merchant Delivery`**: التاجر يوصل بسيارته/أسطوله (البقالة، معرض الأثاث، وايت الماء).
3. **`Third Party Transport`**: الاعتماد على تكسي محلي، فرزة باصات، أو مكاتب النقل.
4. **`Future Platform Delivery (Future Capability / Future Domain)`**: قدرة أو نطاق مستقبلي مؤجل، ولا تعبر عن اعتماد شبكة توصيل تشغيلية في هذه المرحلة.
5. **`No Delivery`**: الأنشطة التي لا تتضمن حركة مادية (الخدمات الرقمية، المعالم، الأنشطة الموقعية).

> **ملاحظة صريحة:** لا تقرر هذه الوثيقة أي عقود لوجستية أو بنية تنفيذية أو منصة ناقلة، وتترك كافة العقود اللوجستية لدراسات التشغيل المستقبلية [DEFER TO IMPLEMENTATION].

---

## 15. Payment Models (نماذج الدفع كـ Domain Observations)

وسائط الدفع الملاحظة في البيئة الميدانية: [OBSERVED | HIGH]

* **`Cash in Person / COD`**: النقد يد بيد.
* **`Mobile Money / Wallet Transfer`**: التحويل عبر المحافظ الإلكترونية المحلية وتطبيقات الصرافة.
* **`Bank Deposit / Exchange Transfer`**: الإيداع عبر شبكات الصرافة المحلية.
* **`Deposit + Balance`**: دفع عربون مقدماً وسداد المتبقي عند الاستلام.
* **`Deferred / Informal Credit`**: دفتر الدين المحلي بين البقال وأهل الحارة.

> **تأجيل صريح [DEFER TO IMPLEMENTATION]:** لا تقرر هذه الوثيقة بوابات الدفع (Gateways)، أو آليات التسوية (Settlements)، أو الرسوم (Fees)، أو الاسترداد (Refunds)، أو المسؤولية المالية، وتُحال جميعها بحيادية إلى **Money & Payments Study** المستقبلي.

---

## 16. Cancellation & Dispute Scenarios (سيناريوهات الإلغاء والنزاع)

السيناريوهات التشغيلية الملاحظة عند الإلغاء أو تعثر الخدمة: [OBSERVED | HIGH]

1. **رفض التاجر/المزود:** لنفاد السلعة، تغيب الفني، أو تغير السعر الفجائي.
2. **عدم حضور العميل (No-Show):** في حرة العيادات أو طلبات وجبات المطاعم.
3. **فشل التوصيل:** تعثر السائق في الطرق الجبلية، عدم رد العميل، أو الخطأ في وصف المعلم الجغرافي.
4. **اختلاف المواصفات:** اكتشاف عيب في المنتج المستعمل أو عدم مطابقة الأثاث للمقاسات (يحل شفهياً أو عبر وسيط محلي).

---

## 17. Geographic Context vs Coverage (الفصل الجغرافي في الأنشطة)

تحديد الضوابط الجغرافية طبقاً للعقود المقفلة (`GEO-001` → `GEO-005`): [FACT | HIGH]

* **`Fixed Places`**: ترتبط بـ **Place** محدد يتبع `District` ويمتلك `PlaceLocation` (إحداثيات PostGIS).
* **`Mobile Providers`**: ترتبط بـ **Service Coverage Area** (مديرية، عدة مديريات، أو شعاع جيو-مكاني) دون اشتراط Place استقبال عام.
* **`Home-based Businesses`**: تنشر **Discovery Context** (الحي/المنطقة العامة) لمنع كشف خصوصية المنازل.
* **`Remote Services`**: لا ترتبط بنطاق جغرافي مادي للأداء، وتعزى لسياق إداري مرجعي.

---

## 18. Candidate Scoped Verification Claims (مرشحات التحقق النطاقي)

مبدأ حاكم: **"لا توجد شارات ثقة عامة مطلق (Business Verified ≠ Everything Verified)"**. [FACT | HIGH]

تحديد الادعاءات المستقلة كـ **مرشحات تحقق (Candidate Scoped Claims)**: [DESIGN CANDIDATE]

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   Candidate Scoped Verification Claims                  │
├─────────────────────┬───────────────────────────────────────────────────┤
│ Existence Verified  │ إثبات وجود المكان جغرافياً وبنائياً في الواقع.      │
│ Identity Verified   │ إثبات الهوية التجارية/المهنية والمالك القانوني.    │
│ Contact Verified    │ إثبات صحة رقم التلفون والوصول المباشر.             │
│ Location Verified   │ إثبات دقة الإحداثيات والمعلم الوصفي.              │
│ License Verified    │ إثبات الترخيص الرسمي [SPECIALIST REQUIRED].       │
│ Capability Verified │ إثبات امتلاك التجهيزات والقدرة على تقديم الخدمة.   │
└─────────────────────┴───────────────────────────────────────────────────┘
```

---

## 19. Data Sources & Provenance (مصادر البيانات والأثر التدقيقي)

تتنوع مصادر البيانات داخل WAYNAH وفق المبادئ السابقة: [FACT | HIGH]

1. **`Official Data`**: البيانات الحكومية والمخططات المعتمدة.
2. **`Business Submitted Data`**: البيانات المرفوعة من مالك النشاط أو مديره.
3. **`Field Operator Data`**: المسوحات التي يجمعها ماسحو WAYNAH الميدانيون.
4. **`Community Contributions`**: اقتراحات وتصحيحات الجمهور والمستخدمين.
5. **`System Generated Data`**: المؤشرات الآلية المحسوبة.

---

## 20. Data Freshness Hypotheses (فرضيات تقادم البيانات)

تم تصنيف عناصر البيانات حسب سرعة تقادمها باعتبارها **فرضيات تقادم ميدانية (Field-specific freshness hypotheses)** تنتظر الضبط التشغيلي: [WORKING HYPOTHESIS]

* **`FAST CHANGING`**: أسعار السلع المتغيرة، توفر الأدوية الحرجة، توفر الوجبات اليومية، حالة الفتح/الإغلاق الطارئ.
* **`MEDIUM CHANGING`**: أوقات الدوام الرسمية، قائمة الخدمات، جدول الدورات التدريبية.
* **`SLOW CHANGING`**: اسم النشاط، الموقع الجغرافي للمحل الثابت، السجل التجاري، والحدود الإدارية.

---

## 21. Documented Exception Cases (الحالات الاستثنائية الموثقة)

لتصحيح خطأ التوثيق السابق، تسجل الوثيقة **11 حالة استثنائية موثقة فعلياً** بدلاً من 16: [FACT | HIGH]

1. **Multiple Businesses / One Place:** مكان واحد يضم عدة أنشطة مستقلة (مجمع تجاري/محطة وقود).
2. **One Business / Multiple Places:** نشاط واحد يملك عدة مواضع (معرض، مخزن، ورشة).
3. **Business Without Place:** نشاط يعمل بدون مكان استقبال مادي (فني متنقل، مطور ريموت).
4. **Temporary Closure vs Relocation:** الإغلاق للتجديد مقابل انتقال المحل مع حفظ السجل التاريخي للموقع القديم.
5. **Seasonal Activity:** أسواق أسبوعية تظهر وتختفي في أيام محددة.
6. **Mobile Operation:** صهريج ماء أو سائق فرزة يتغير موقعه الجغرافي لحظياً.
7. **Shared Location:** صالون حلاقة داخل فندق أو صيدلية داخل مستشفى.
8. **Informal Business:** نشاط تجاري يعمل بلا لوحة رسمية ويعتمد على الاسم المحلي.
9. **Owner / Name / Phone Change:** تغير المالك أو اسم المحل مع بقاء الموقع الجغرافي والتاريخ الميداني.
10. **Service Suspension:** إيقاف خدمة التوصيل مؤقتاً لغياب السائق مع استمرار المحل مفتوحاً.
11. **Conflicting Ownership Claims:** ادعاء شخصين لملكية نفس الصفحة التجارية (تتطلب طابور نزاع إداري).

---

## 22. Cleaned Universal Logic Baseline (المنطق المشترك العام المنظف)

تصحيح المنطق المشترك العام وتخليصه من الاشتراطات التعسفية: [FACT | HIGH]

### الأساس الكلي لكل سجل قابل للاكتشاف (Universal Record Baseline):
كل سجل قابل للاكتشاف في WAYNAH يحتاج حتمياً إلى:
1. **Record Identity (هوية السجل):** معرّف فريد واسم قابل للبحث والتصنيف.
2. **Discovery Classification (تصنيف الاكتشاف):** ينتمي لفئة اكتشافية مرجعية (`Category`).
3. **Data Source & Provenance (المصدر والتدقيق):** مصدر بيانات، تاريخ تحديث، ومستوى ثقة.
4. **Appropriate Operational Status (الحالة التشغيلية):** حالة تشغيلية مناسبة (نشط، مغلق مؤقتاً، منقول..).

### الخصائص والقدرات الشرطية (Conditional Capabilities):
الخصائص التالية ليست إلزامية لجميع السجلات، بل تضاف بشرط طبيعة النشاط:
* `Physical Location`: ينطبق فقط على الأماكن المادية المفتوحة للاستقبال (`Places`).
* `Contact Mechanism`: يضاف بناءً على نوع السجل وحاجته للاتصال.
* `Service Coverage`: يضاف للمزودين والأنشطة المتنقلة والمنزلية (`Coverage Area`).
* `Product Offerings / Catalog`: اختيارية حسب النشاط.
* `Service Offerings / Catalog`: اختيارية حسب النشاط.
* `Transaction / Interaction Flows`: مسارات شرطية مفعّلة بحسب قدرة النشاط.

---

## 23. Optional Capabilities (القدرات الاختيارية)

الخصائص التالية هي قدرات اختيارية (Modules/Capabilities) تُفعل فقط للأنشطة التي تمتلك الحاجة والقدرة التشغيلية عليها: [DESIGN CANDIDATE]

* `Product Catalog`: كتالوج منتجات معروضة.
* `Service Catalog`: قائمة خدمات معروضة.
* `Inventory Indicator`: مؤشر تقريبي لتوفر السلعة.
* `Appointment Booking`: محرك حجز مواعيد وأدوار.
* `RFQ Engine`: محرك طلبات واستقبال عروض الأسعار.
* `Order Processing`: استقبال ومعالجة طلبات الشراء.
* `Merchant Delivery`: قدرة التوصيل الذاتي للنشاط.
* `Customer Pickup`: إمكانية استلام المشتري من المقر.
* `Mobile Coverage Radius`: تحديد نطاق الخدمة الميدانية للمزود المتنقل.
* `Multi-Branch Hierarchy`: إمكانية ربط فروع متعددة تحت مظلة شركة واحدة.

---

## 24. Specialized Rules & Specialist Classification (القواعد المتخصصة)

تحويل المسائل التنظيمية والقانونية إلى تصنيف **`SPECIALIST REQUIRED`** وإحالتها للدراسات التنظيمية القادمة: [SPECIALIST REQUIRED]

* **Healthcare Rules [SPECIALIST REQUIRED]:** اشتراط التراخيص الطبية، منع حجز الأدوية المقيدة قانوناً، وعرض هواتف الطوارئ.
* **Financial & Regulated Rules [SPECIALIST REQUIRED]:** القيود التنظيمية لشركات الصرافة والخدمات المالية والغاز المنزلي.
* **Legal Liability & Background Checks [SPECIALIST REQUIRED]:** مسؤولية المنصة، والتحقق الأخلاقي والأمني لخدمات دخول المنازل.
* **Home-based Privacy Rules [DESIGN CANDIDATE]:** إخفاء الإحداثيات الدقيقة للمنازل والاكتفاء بعرض المنطقة/الحي العام.

---

## 25. Domain Capability Analysis Matrix (مصفوفة تحليل القدرات — ليست عقد تنفيذ)

توضح المصفوفة التحليلية التالية توزيع القدرات التشغيلية على الأنشطة الـ 41. هذه المصفوفة **أداة تحليل مجال (Analytical Tool)** وليست Schema، ولا Implementation Contract، ولا Final Business Rules: [DESIGN CANDIDATE]

*الرموز:* **R** = Core to Entity Nature (عند ثبوته) | **C** = Conditional | **O** = Optional | **NA** = Not Applicable

| Activity | Physical Place | Branch | Products | Services | Inquiry | RFQ | Booking | Order | Pickup | Delivery | Mobile Radius | Trust Level |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Landmark | **R** | NA | NA | NA | O | NA | NA | NA | NA | NA | NA | Location Existence |
| 2. Hospital | **R** | O | O | **R** | **R** | NA | C | NA | NA | O | NA | License [SPECIALIST] |
| 3. Gov Entity | **R** | NA | NA | **R** | **R** | NA | NA | NA | NA | NA | NA | Official Source |
| 4. Popular Market | **R** | NA | NA | NA | O | NA | NA | NA | NA | NA | NA | Existence |
| 5. Grocery | **R** | O | **R** | NA | **R** | NA | NA | C | C | C | NA | Basic Contact |
| 6. Pharmacy | **R** | O | **R** | O | **R** | NA | NA | C | C | O | NA | License [SPECIALIST] |
| 7. Phone Shop | **R** | O | **R** | **R** | **R** | C | NA | O | C | O | NA | Business Identity |
| 8. Electronics Shop | **R** | O | **R** | O | **R** | C | NA | C | C | C | NA | Business & Warranty |
| 9. Furniture Shop | **R** | O | **R** | **R** | **R** | C | NA | C | C | C | NA | Business & Workshop |
| 10. Clothing Shop | **R** | O | **R** | NA | **R** | NA | NA | O | C | O | NA | Basic Identity |
| 11. Wholesaler | **R** | O | **R** | NA | **R** | C | NA | C | C | C | NA | Wholesale Credit |
| 12. Food Distributor | **R** | O | **R** | **R** | **R** | C | NA | C | NA | C | C | Agency Verification |
| 13. Building Materials | **R** | O | **R** | O | **R** | C | NA | C | C | C | NA | Business & Heavy |
| 14. Spare Parts | **R** | O | **R** | NA | **R** | C | NA | C | C | O | NA | Technical Specs |
| 15. Sale + Install | **R** | O | **R** | **R** | **R** | C | NA | C | C | C | C | Technical Cert |
| 16. Sale + Repair | **R** | O | **R** | **R** | **R** | C | NA | O | C | NA | NA | Technical Skill |
| 17. Workshop + Parts | **R** | NA | O | **R** | **R** | C | NA | NA | NA | NA | NA | Mechanical Reputation |
| 18. Wholesale + Retail | **R** | O | **R** | NA | **R** | C | NA | C | C | C | NA | Business Identity |
| 19. Restaurant | **R** | O | **R** | O | **R** | NA | NA | C | C | C | NA | Hygiene & Speed |
| 20. Home Kitchen | NA | NA | **R** | NA | **R** | C | C | C | C | C | C | Community Trust |
| 21. Bakery | **R** | O | **R** | NA | O | NA | NA | NA | C | NA | NA | Weight & Hygiene |
| 22. Auto Workshop | **R** | NA | O | **R** | **R** | C | NA | NA | NA | NA | NA | Master Mechanic |
| 23. Electrician | NA | NA | NA | **R** | **R** | C | NA | NA | NA | NA | C | Personal Vetting |
| 24. Solar Tech | C | NA | O | **R** | **R** | C | NA | NA | NA | O | C | Engineering Cert |
| 25. HVAC Tech | C | NA | O | **R** | **R** | C | NA | NA | NA | NA | C | Skill Verification |
| 26. Plumber | NA | NA | NA | **R** | **R** | NA | NA | NA | NA | NA | C | Personal Vetting |
| 27. Carpenter/Iron | **R** | NA | **R** | **R** | **R** | C | NA | C | C | C | C | Workshop Verification |
| 28. Remote Developer | NA | NA | NA | **R** | **R** | C | NA | NA | NA | NA | NA | Portfolio & Identity |
| 29. Clinic | **R** | O | NA | **R** | **R** | NA | C | NA | NA | NA | NA | License [SPECIALIST] |
| 30. Barber / Salon | **R** | O | NA | **R** | **R** | NA | C | NA | NA | NA | NA | Hygiene & Skill |
| 31. Training Center | **R** | O | NA | **R** | **R** | NA | C | NA | NA | NA | NA | License [SPECIALIST] |
| 32. Appointment Service | **R** | O | NA | **R** | **R** | NA | C | NA | NA | NA | NA | Professional Cert |
| 33. Mobile Tech | NA | NA | O | **R** | **R** | C | NA | NA | NA | NA | C | Personal Vetting |
| 34. Transport Driver | NA | NA | NA | **R** | **R** | C | C | NA | NA | C | C | Driver License [SPEC] |
| 35. Water Tanker | NA | NA | **R** | **R** | **R** | NA | NA | C | NA | C | C | Water Quality & Vehicle |
| 36. Home Care | NA | NA | NA | **R** | **R** | C | C | NA | NA | NA | C | Background [SPEC] |
| 37. Multi-Branch Co | **R** | **R** | **R** | **R** | **R** | C | C | C | C | C | O | Corporate Registry |
| 38. Multi-Activity Inst | **R** | O | **R** | **R** | **R** | C | O | C | C | C | O | Multiple Licenses |
| 39. Multi-Site Business | **R** | **R** | **R** | **R** | **R** | C | NA | C | C | C | NA | Corporate & Site Audits |
| 40. Location + Mobile | **R** | O | **R** | **R** | **R** | C | C | C | C | C | C | Store & Dispatch Audit |
| 41. Regulated Activity | **R** | **R** | C | C | **R** | NA | NA | NA | NA | NA | NA | Strict License [SPEC] |

---

## 26. Operating Model Matrix (مصفوفة النماذج التشغيلية — أداة تحليلية)

تحدد هذه المصفوفة كيفية التقاء العميل بمزود الخدمة أو السلعة: [DESIGN CANDIDATE]

| Activity Category | Customer Arrives | Provider Travels | Remote Service | Scheduled Interaction | Immediate Interaction | RFQ Required | Fixed Pricing | Negotiable Pricing | Delivery Included |
|---|---|---|---|---|---|---|---|---|---|
| A. Non-Commercial | **Yes** | No | No | No | **Yes** | No | N/A | N/A | No |
| B. Retail | **Yes** | Rare | No | No | **Yes** | Conditional | **Yes** | Often | Conditional |
| C. Wholesale | **Yes** | Rare | No | No | **Yes** | Conditional | Dynamic | Volume-Based | Conditional |
| D. Hybrid Commerce | **Yes** | **Yes** | No | Conditional | Conditional | Conditional | Mixed | **Yes** | Conditional |
| E. Food | **Yes** | No | No | No | **Yes** | No | **Yes** | No | Conditional |
| F. Services | Conditional | **Yes** | Conditional | Conditional | Conditional | Conditional | Rare | **Yes** | N/A |
| G. Appointment | **Yes** | Rare | No | Conditional | Rare | No | **Yes** | No | No |
| H. Field / Mobile | No | **Yes** | No | Conditional | **Yes** | Conditional | Dynamic | **Yes** | Conditional |
| I. Multi-Branch | **Yes** | Conditional | Conditional | Conditional | **Yes** | Conditional | Centralized | Conditional | Conditional |
| J. Special / Regulated| **Yes** | No | No | Conditional | **Yes** | No | Official | No | No |

---

## 27. Transaction Compatibility Matrix (المسارات المتوازية لتوافق المعاملات)

مخطط المسارات البديلة المتوازية لمنع فرض التجارة الإلكترونية الخطية: [DESIGN CANDIDATE]

```
                       [ Discovery Phase ]
                                │
   ┌────────────────────┬───────┴────────┬────────────────────┐
   ▼                    ▼                ▼                    ▼
[ Inquiry ]        [ Request ]      [ Booking ]          [ Order ]
   │                    │                │                    │
   ▼                    ▼                ▼                    ▼
(End / Ext)        [  RFQ  ]      (Service Exec)       [ Fulfillment ]
                        │                                     │
                        ▼                                     ▼
                   (Agreement)                        (Pickup / Delivery)
                                                              │
                                                              ▼
                                                          (Payment)
```

---

## 28. Case Compatibility Analysis (توافق الحالات واستقرار القرارات المعمارية)

### الإجابة المنطقية: هل يمكن تمثيل جميع هذه الأنشطة الـ 41 داخل WAYNAH بدون بناء نظام مستقل لكل نشاط؟

**الإجابة:** **نعم، بشرط التخلي النهائي عن نموذج "كل نشاط هو متجر إلكتروني".** [FACT | HIGH]

### التوافق مع القرارات المعمارية المقفلة سابقاً:
1. **دعم الفصل بين Place و Business:** تقدم LOGIC-002 أدلة ميدانية وحالات اختبار واقعية تدعم وتؤكد ما تم إقراره سابقاً في `WAYNAH SYSTEM LOGIC MASTER STUDY` و `GEOGRAPHIC_DATA_CONTRACT` من أن Place ≠ Business. [FACT | HIGH]
2. **الطبقة الجغرافية المقفلة:** جميع الأنشطة ترتبط بسياق جغرافي إداري (`Governorate` → `District`) مع حفظ سلطة PostGIS ومخططات OCHA اليمن المقفلة. [FACT | HIGH]
3. **القدرات الاختيارية (Optional Capabilities):** تعتبر الكتالوجات، محركات RFQ، محركات Booking، ومعالجة الطلبات قدرات مضافة تُفعل بناءً على طبيعة النشاط دون قسر. [DESIGN CANDIDATE]

---

## 29. False Assumptions / Review Required (اكتشاف الافتراضات وتأطيرها)

تأطير المسائل التي تتطلب حسمًا في دراسات الميكانزمات التالية (`REVIEW REQUIRED`): [DESIGN CANDIDATE]

### 1. مرونة العلاقة بين Place و Business و Provider (`REVIEW REQUIRED`)
* **الوضع القائم:** دعم الفصل المفهومي وتوضيح حالات الأنشطة المتنقلة والمنزلية التي لا تملك المكان الاستقبالي العام، واستيعاب المباني متعددة الأنشطة.

### 2. مفهوم الفرع التشغيلي الحقيقي (`REVIEW REQUIRED`)
* **الوضع القائم:** عدم إنشاء `Branch` آلياً لكل `Business` إلا عند وجود تمايز تشغيلي محلي (مثل الشركات متعددة الفروع).

### 3. مرشحات التحقق النطاقي (`REVIEW REQUIRED`)
* **الوضع القائم:** دعم مرشحات التحقق النطاقية (Scoped Claims) بدلاً من الشارة العامة الإجمالية.

---

## 30. Architecture Impact & Process Gates (الأثر المعماري وبوابات الإجراءات)

تأكيداً للقواعد الحاكمة، تقتصر نتائج هذه الوثيقة على التصنيف المنطقي للتوصيات بدون كتابة كود أو تعديل شفرة: [FACT | HIGH]

* **`NO CHANGE`**:
  * المعمارية الجغرافية الأساسية (`Governorate` → `District` → `PlaceLocation`).
  * فصل طبقة الاكتشاف عن طبقة المعاملات.
  * هيكلية حفظ الملاحظات ومصادر البيانات (Data Governance / Provenance).

* **`REVIEW REQUIRED`**:
  * نمذجة علاقات التشغيل بين `Business` و `Place` و `Provider` وتأطير الأنشطة المتنقلة والمنزلية.
  * صياغة عقد مرشحات التحقق النطاقية (Candidate Scoped Claims).
  * تمثيل مناطق الخدمة الجغرافية (Coverage Areas) للمزودين المتنقلين.

* **`FUTURE DOMAIN`**:
  * تصميم المخطط التفصيلي لـ Product Schema و Service Schema.
  * بناء محركات المعاملات الاختيارية (Booking Engine, RFQ Engine, Order Engine).
  * آليات الدفع والتسويات المالية (Money & Payments Study).

* **`IMPLEMENTATION BLOCKER (Process / Planning Gate)`**:
  * يُفهم هذا القيد كبوابة تخطيط وإجراءات (Process / Planning Gate) تمنع البدء في بناء أي شاشة طلبات أو معاملات تجارية قبل حسم عقد العلاقات بين `Place` و `Business` و `Provider` وتحديد شروط تفصيل القدرات الاختيارية في الدراسة المخصصة القادمة.

---

## 31. Specialist Consultation Map (خريطة استشارة المتخصصين — SPECIALIST REQUIRED)

تحدد هذه الخريطة المسائل التشغيلية والقانونية التي لا يمكن حسمها نظرياً وتتطلب دراسات متخصصة مستقبلاً: [SPECIALIST REQUIRED]

| الاختصاص المطلوب | المسألة التي تحتاج حسم | سبب عدم القدرة على الحسم نظرياً |
|---|---|---|
| **GIS Specialist** | تمثيل نطاقات الخدمة المتنقلة (Coverage Polygons vs Radii) والأداء Spatial Indexing. | يتطلب دراسة أحمال استعلامات PostGIS وحجم البيانات المكاني. |
| **Legal & Regulatory** | التراخيص الطبية، المسئولية القانونية للأنشطة المالية والمنظمة، والتحقق الأمني. | تتطلب دراسة التشريعات اليمنية النافذة ولوائح وزارة التجارة والصحة. |
| **Logistics Specialist** | إدارة نماذج فشل التوصيل والتعامل مع التضاريس الجبلية في محافظة حجة. | تتطلب خبرة ميدانية في تشغيل أساطيل النقل والتوزيع المحلي. |
| **Financial / Payment** | تسوية التحويلات عبر المحافظ الإلكترونية وشبكات الصرافة والمسؤولية المالية. | تتطلب فهم القيود المصرفية وآليات الربط المالي المحلي. |
| **UX / HCI Specialist** | التدرج في إظهار تفاصيل الأنشطة المختلفة بدون تعقيد الواجهة. | تتطلب اختبارات واجهة المستخدم وااختبارات القابلية للمستخدم اليمني. |

---

## 32. Consolidated Open Questions (الأسئلة المفتوحة المجمعة)

تجمع الوثيقة الأسئلة المفتوحة المجمعة من الدراسة والمراجعة المستقلة (12 سؤالاً حاسماً): [OPEN QUESTION]

1. **[OPEN QUESTION | HIGH]:** ما هي الآلية الميدانية الأكفأ لجمع وتحديث أسعار السلع السريعة التغير في حجة دون الإضرار بمصداقية المنصة؟
2. **[OPEN QUESTION | HIGH]:** كيف يتم التعامل مع الأنشطة التجارية التي تعمل بدون اسم رسمي وتعتمد فقط على الشهرة المحلية في فهارس البحث الجغرافي؟
3. **[OPEN QUESTION | MEDIUM]:** ما هو السقف الزمني المناسب لاعتبار بيانات ساعات العمل وتوفر الفنيين "متقادمة" (Stale) وتستدعي التنبيه للمستخدم؟
4. **[OPEN QUESTION | MEDIUM]:** ما هي الضوابط الدقيقة لفض التنازع بين شخصين يدعيان ملكية صفحة نشاط تجاري قائم في الواقع؟
5. **[OPEN QUESTION | HIGH]:** كيف نميز بين Geographic Context (الحدود الإدارية للمكان) و Service Coverage (نطاق خدمة المزود المتنقل) في الاستعلامات؟
6. **[OPEN QUESTION | HIGH]:** متى يكون رقم التواصل (Contact Mechanism) ميزة شرطية أو اختيارية بحسب نوع سجل الاكتشاف؟
7. **[OPEN QUESTION | MEDIUM]:** ما هو الحد الفاصل التشغيلي الذي يجعل النشاط (Business) يطلب إنشاء فرع (Branch) حقيقي متميز محلياً؟
8. **[OPEN QUESTION | HIGH]:** هل النشاط (Activity) كيان مستقل بذاته أم صدم/قدرة تصنيفية تلحق بالـ Place أو Business؟
9. **[OPEN QUESTION | HIGH]:** هل يمكن لمؤدي الخدمة (Provider) العمل تحت مظلة عدة أنشطة تجارية (Businesses) متعددة في نفس الوقت؟
10. **[OPEN QUESTION | MEDIUM]:** هل المعاملات والتفاعلات الخارجية (External Transactions) تعتبر رحلة عميل مكتملة بالنسبة لـ WAYNAH؟
11. **[OPEN QUESTION | MEDIUM]:** ما هو الحد الفاصل التشغيلي والتعهدي بين طلب الاستفسار المباشر (Request) وطلب عرض السعر (RFQ)؟
12. **[OPEN QUESTION | MEDIUM]:** ما هو الفرق المنطقي والدقيق بين التوفر اللحظي (Availability) والقدرة التشغيلية الاستيعابية (Capacity)؟

---

## 33. Roadmap Dependencies & Next Study Direction (اتجاه التبعيات وخارطة الطريق)

تؤكد الوثيقة المقفلة التزامها بخارطة طريق المشروع، وأن تحديد اختيار الوثيقة التالية قرار إداري مستقل يعتمد خارطة الطريق المعتمدة للمشروع: [DESIGN CANDIDATE]

> **ملاحظة توجيهية:** يظل اختيار الوثيقة التالية تابعاً لخارطة الطريق الرسمية لمشروع WAYNAH، ولا تفرض هذه الوثيقة بدء أي دراسة جديدة تلقائياً قبل اتخاذ قرار مرحلي مستقل.

---

## 34. Final Conclusions (الاستنتاجات النهائية)

### إجابات أسئلة معيار النجاح الـ 24 المنقحة:
1. **أنواع الأنشطة:** تفهم WAYNAH الـ 41 نشاطاً الموزعة على الـ 10 مجموعات من الأنشطة غير التجارية إلى الأنشطة المعقدة والمنظمة.
2. **المشترك بينها:** هوية السجل، تصنيف الاكتشاف، مصدر البيانات والأثر التدقيقي، وحالة التشغيل.
3. **أوجه الاختلاف:** نمط التواجد المكاني، طبيعة العرض (سلع/خدمات)، نمط التسعير، ومسارات التفاعل.
4. **ما الذي يحتاج Place:** الأنشطة والمواضع ذات التواجد المادي المفتوح للاستقبال والزيارة.
5. **ما الذي يحتاج Branch:** الأنشطة المؤسسية ذات الفروع التشغيلية المتميزة محلياً فقط.
6. **ما الذي يحتاج Provider:** الأنشطة الحرفية والمهنية المعتمدة على الأداء الفردي أو الميداني.
7. **ما الذي يقدم Product:** أنشطة التجزئة والجملة والأغذية والهجين.
8. **ما الذي يقدم Service:** أنشطة الصيانة، المهن، المواعيد، والخدمات الميدانية والرقمية.
9. **متى نحتاج Inquiry:** في كل مرة يستفسر فيها المستخدم عن توفر أو دواء أو معلومة بلا التزام.
10. **متى نحتاج Request:** عند طلب فحص ميداني أو خدمة تتطلب تقييم المزود وتحديد نيتها.
11. **متى نحتاج RFQ:** عند الطلبات المخصصة، الشحنات الكبيرة، الأثاث، والمقاولات.
12. **متى نحتاج Booking:** عند حجز وقت أو سعة مقعد/طبيب/صالون.
13. **متى نحتاج Order:** عند الالتزام بشراء عناصر وسلع محددة المواصفات والسعر.
14. **متى نحتاج Fulfillment:** عند أداء الوعد والتنفيذ المباشر للخدمة أو تجهيز الطلب.
15. **متى نحتاج Delivery:** فقط عندما يتطلب الأمر حركة مادية لنقل السلعة عبر ناقل معلن.
16. **متى نحتاج Payment:** عند الاتفاق والتسليم وفق قناة الدفع المعتمدة (نقداً/محافظ).
17. **ما الذي لا يحتاج Transaction:** المعالم، الأماكن العامة، الجهات الحكومية، والمعاملات المباشرة خارج المنصة.
18. **ما الذي يتغير بسرعة:** الأسعار اليومية، توفر الأدوية، والتوفر الميداني للفنيين.
19. **ما الذي يحتاج Verification:** كل ادعاء مستقل (وجود، هوية، موقع، ترخيص).
20. **ما الذي لا يجوز تعميمه:** نماذج البيع والتوصيل والدفع الآلي، والشارات العامة للتحقق.
21. **توحيد الحالات في WAYNAH:** نعم، عبر منصة اكتشاف وجغرافيا وثقة أساسية، مع قدرات اختيارية مضافة.
22. **التعارضات الحقيقية:** تحدث فقط إذا تم قسر الأنشطة الخدمية والمتنقلة في نموذج "المتجر الإلكتروني".
23. **القرارات التي تحتاج متخصصاً:** نظم المعلومات الجغرافية، اللوائح الرقابية، اللوجستيات الجبلية، والربط المالي.
24. **الأسئلة التأجيلية:** تفاصيل مخططات المنتجات والخدمات، ومحركات الدفع والنزاعات التجارة الإلكترونية.

---

## REVISION CHANGELOG (سجل التعديلات الإلزامية R1 → R13)

يوضح هذا السجل كافة التعديلات المنفذة بناءً على المراجعة النقدية المستقلة:

* **R1 — النسب غير الموثقة:** تم حذف الصياغات الكمية الإحصائية القطعية (70%+, 60%+, 85%+, 80%+) وتحويلها إلى ملاحظات ميدانية نوعية غير مقيسة إحصائياً مع وسمها بـ `OBSERVATION — NOT STATISTICALLY VALIDATED` و `WORKING HYPOTHESIS` وضمان عدم تأثيرها على المعمارية أو المخططات.
* **R2 — عدد Exception Cases:** تم تصحيح التعارض وتثبيت عدد الحالات الاستثنائية بـ **11 حالة موثقة فعلياً** والتنويه بأن الرقم السابق (16) كان خطأ توثيقياً في الصياغة الأولى دون اختراع حالات وهمية.
* **R3 — Universal Logic:** تم تنظيف المنطق المشترك العام وحصر الإلزام الكلي في: هوية السجل، تصنيف الاكتشاف، مصدر البيانات، والحالة التشغيلية. وتم تحويل `Physical Location`, `Contact Mechanism`, `Service Coverage`, `Products`, `Services`, `Transactions` إلى قدرات وخصائص شرطية (`Conditional`).
* **R4 — الفصل الجغرافي:** تم الفصل الصريح والكامل بين 4 مفاهيم جغرافية: `Physical Location`, `Administrative Context`, `Service Coverage`, و `Discovery Context`. وتم التأكيد الكامل على عدم مساس الوثيقة بالعقود الجغرافية المقفلة (`GEO-001` → `GEO-005` و PostGIS و OCHA COD-AB).
* **R5 — Capability Matrix:** تم إعادة تصنيف مصفوفة القدرات باعتبارها `DOMAIN CAPABILITY ANALYSIS MATRIX` وتجريدها من أي صفة تنفيذية أو Schema. وتم تعديل علامات `R` المبالغ فيها في أنشطة المطاعم، البقالات، المستشفيات، السباكين، والمهندسين إلى `C` (Conditional) أو `O` (Optional).
* **R6 — Transaction Flow:** تم إعادة صياغة مخطط التفاعلات كمسارات بديلة وتوازية (Alternative Parallel Paths: Path A to Path E)، وتأطير الدفع كمرحلة مرتبطة بالاتفاق وليست خطوة إلزامية في كل رحلة.
* **R7 — Place / Business / Provider:** تم إعادة صياغة نتائج الفصل بين Place و Business باعتبار LOGIC-002 يوفر أدلة ميدانية تؤكد وتسند المبدأ المقفل سابقاً في `WAYNAH MASTER STUDY` وليس كـ اكتشاف جديد يناقض الماضي.
* **R8 — Scoped Verification:** تم تأكيد مبدأ `Business Verified ≠ Everything Verified` وتأطير ادعاءات التحقق النطاقية كـ `Candidate Scoped Claims`.
* **R9 — Legal / Regulatory:** تم تحويل كافة القواعد التنظيمية والطبية والمالية والأمنية والمسؤوليات القانونية إلى تصنيف **`SPECIALIST REQUIRED`** وإحالتها للدراسات القانونية المستقبلية.
* **R10 — Fulfillment / Delivery:** تم تثبيت المبدأ المعماري `Fulfillment ≠ Delivery` واستعراض نماذج التوصيل كملاحظات ميدانية دون اتخاذ أي قرار بشأن العقود اللوجستية أو البنية المنفذة للمنصة.
* **R11 — Payment:** تم حفظ نماذج الدفع الميدانية كـ Domain Observations وتأجيل بوابات الدفع، التسويات، الرسوم، والاستردادات صراحة إلى Money/Payments Study [DEFER TO IMPLEMENTATION].
* **R12 — Data Freshness:** تم الحفاظ على تصنيفات FAST/MEDIUM/SLOW وتأطير المدد كـ فرضيات تقادم ميدانية (`Field-specific freshness hypotheses`).
* **R13 — Open Questions:** تم الحفاظ على الأسئلة الـ 4 الأصلية وإضافة الأسئلة الـ 8 الجديدة التي أفرزتها المراجعة ليصل المجموع إلى **12 سؤالاً حاسماً ومجمعاً**.

---

## REMAINING OPEN QUESTIONS (الأسئلة المفتوحة المتبقية)

تظل الأسئلة الـ 12 المجمعة في القسم 32 مسجلة كـ `OPEN QUESTION` بانتظار الدراسات المنطقية والتنفيذية المتخصصة القادمة.

---

## DEPENDENCIES FOR FUTURE STUDIES (التبعيات للدراسات المستقبلية)

1. **Core Entities Architecture Study:** صياغة عقد العلاقات الجديد بين Place, Business, Branch, Provider, CoverageArea, و VerificationClaim.
2. **Geographic & Spatial Study (PostGIS & Coverage Polygons):** استشارة متخصص GIS لحسم تمثيل نطاقات التغطية المتنقلة وأداء الفهرسة المكانية.
3. **Money & Payments Study:** حسم قنوات الدفع، المحافظ الإلكترونية، بوابات الدفع، والتسويات والمسؤولية المالية.
4. **Legal & Regulatory Study:** حسم الاشتراطات القانونية للتراخيص الطبية، المالية، الأمنية، ومسؤولية المنصة.

---

## FINAL LOCK STATUS & STATEMENT (حالة القفل النهائية والبيان الرسمي)

> **FINAL STATUS:** **`LOCKED`** (Review Status: **ACCEPTED** | Final Lock: **APPROVED** | Reference Date: **1 October 2026**)
>
> **OFFICIAL AUTHORITY STATEMENT:**  
> **WAYNAH-LOGIC-002 is hereby LOCKED as the approved domain reference for Real-World Activities & Operating Models. Its accepted principles shall be treated as stable inputs for subsequent WAYNAH studies. Open Questions remain explicitly unresolved, deferred areas remain deferred, and no implementation decision is implied by this lock.**
