# WAYNAH — PHASE 5 UX/UI SYSTEM STUDY (V1.0)

> **PROJECT:** WAYNAH (وينه؟ — Geographic Discovery & Local Trust Platform)  
> **BRAND UMBRELLA:** M.GH.AL  
> **OPERATIONAL GEOGRAPHY:** Hajjah Governorate, Yemen (Initial Operational Geography) — Extensible Across Yemen  
> **DOCUMENT ID:** WAYNAH_PHASE_5_UX_UI_SYSTEM_STUDY_V1_0  
> **REFERENCE DATE:** 1 October 2026  
> **PHASE STATUS:** PHASE 5 — CLOSED  
> **NEXT:** PROTOTYPE DESIGN & INTERACTION MODEL  
> **PREVIOUS PHASES:** PHASE 1 — CLOSED | PHASE 2 — CLOSED | PHASE 3 — CLOSED | PHASE 4 — CLOSED  
> **BOUNDARIES:** ZERO Source Code Changes | ZERO Schema/Database Changes | ZERO API Changes | ZERO Implementation  
> **TAXONOMY NOTATION:** `[UX FACT]` | `[UX DECISION]` | `[UX HYPOTHESIS]` | `[UNKNOWN / VALIDATION REQUIRED]` | `[PROTOTYPE DECISION]` | `[IMPLEMENTATION DETAIL — PHASE 6]`  

---

## 1. AUTHORITATIVE PROJECT STATE

This document constitutes the authoritative **Phase 5 UX/UI System Study (V1.0)** for the WAYNAH platform.

### 1.1 Gated Phase History & Boundaries `[UX FACT]`
WAYNAH strictly adheres to a sequential, gated domain and system engineering process:

```text
Phase 1: Security & Codebase Safety Gate ──────────────────► [CLOSED]
  └── Phase 2: Domain / Real-World Logic Validation (V1.1) ──► [CLOSED]
       └── Phase 3: Domain Model Master Study (V1.2) ────────► [CLOSED]
            └── Phase 4: System Architecture Study (V1.0) ───► [CLOSED]
                 └── Phase 5: UX/UI System Study ────────────► [CLOSED]
                      └── Next: Prototype Design & Interaction Model ──► [CURRENT]
```

### 1.2 Mandatory Architectural & Domain Invariants `[UX DECISION]`
All UX/UI designs, interaction models, and prototype specifications in Phase 5 MUST strictly preserve and respect the locked decisions from Phase 3 (Domain Model V1.2) and Phase 4 (System Architecture V1.0):

1. **Place ≠ Business `[UX DECISION]`**: Physical spatial locations exist independently of commercial operating organizations. UI must never equate a physical site with a corporate entity.
2. **Business ≠ Branch `[UX DECISION]`**: A Business is an organizational umbrella; a Branch is a specific physical/operational unit with operational presence.
3. **Branch represents operational presence `[UX DECISION]`**: A Branch connects a Business to a physical Place or mobile area.
4. **Provider ≠ Place / Provider ≠ Business `[UX DECISION]`**: Independent service providers operate with mobility across field areas and must not be forced into storefront Place models.
5. **Service Offering ≠ Product `[UX DECISION]`**: Intangible execution capabilities are distinct from physical retail products or inventory.
6. **Claim ≠ Truth & Verification ≠ Permanent Truth `[UX DECISION]`**: Factual data consists of attribute claims bound to source, timestamp, and scope. Truth is temporal, multi-sourced, and subject to uncertainty.
7. **Review ≠ Factual Claim `[UX DECISION]`**: Subjective sentiment and user experience reports must never automatically alter objective factual attributes or operating state.
8. **Phone ≠ Identity `[UX DECISION]`**: Contact phone numbers are mutable value attributes, not immutable user or entity identifiers.
9. **P-code ≠ Postal Code `[UX DECISION]`**: UN OCHA P-codes are administrative reference codes, not consumer postal mailing codes.
10. **Current State ≠ History `[UX DECISION]`**: System entities mutate over time; historical states and relocation history are preserved.
11. **Server-Authoritative Trust Model `[UX DECISION]`**: UI client displays trust metadata and uncertainty indicators evaluated by server domain logic; client UI never invents trust metrics.
12. **Low-Bandwidth First & Graceful Degradation `[UX DECISION]`**: UX must perform reliably under low-bandwidth networks (2G/3G, high latency, packet loss) in Hajjah, Yemen, with text-first fallbacks and map independence.

---

## 2. MOST IMPORTANT GOAL & UX PHILOSOPHY

WAYNAH is NOT merely a web portal containing static search cards and embedded maps.

WAYNAH is a **Geographic Discovery & Local Trust Platform** designed to solve real-world questions for citizens, visitors, and business operators in Yemen:

```text
                                REAL-WORLD USER QUESTIONS
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ • Where is this place located physically?                                                 │
│ • What services or activities does it actually offer right now?                           │
│ • Is it open operating right now in Hajjah?                                                │
│ • How can I contact the responsible party reliably (Phone, WhatsApp)?                      │
│ • How reliable and fresh is this information? Who reported it?                             │
│ • Does this place still exist, or has it relocated to a new street/market?                 │
│ • Are there conflicting records for this same location?                                   │
│ • What does the system know with certainty, and what remains unverified?                  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Core UX Pillars `[UX DECISION]`
To answer these real-world questions, WAYNAH UX/UI is anchored on five foundational pillars:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 WAYNAH UX PILLARS                                         │
├───────────────┬───────────────┬───────────────┬───────────────┬───────────────────────────┤
│   DISCOVERY   │     TRUST     │    CLARITY    │    CONTEXT    │        UNCERTAINTY        │
│               │               │               │               │                           │
│ Multi-modal   │ Clear source  │ Direct, non-  │ Geographic,   │ Honest representation     │
│ spatial &     │ provenance,   │ confusing     │ operational & │ of unverified, stale,     │
│ service search│ temporal      │ Arabic layout │ historical    │ or conflicting info       │
│ without name  │ confidence    │ hierarchy     │ background    │ without alarmism          │
│ exactness     │ indicators    │               │               │                           │
└───────────────┴───────────────┴───────────────┴───────────────┴───────────────────────────┘
```

---

## 3. UX/UI TAXONOMY & NOTATION SYSTEM

To prevent premature implementation directives and distinguish facts from hypotheses, every material UX statement in this study is tagged using the formal taxonomy:

* **`[UX FACT]`**: Empirical user context, platform boundary, or hardware/network reality (e.g. Arabic default language, low-bandwidth infrastructure in Yemen).
* **`[UX DECISION]`**: Locked UX principle, information hierarchy rule, or user interaction boundary for WAYNAH.
* **`[UX HYPOTHESIS]`**: User behavior assumption or interaction heuristic requiring prototype testing (e.g., thumb-reach bottom sheet preference on mobile).
* **`[UNKNOWN / VALIDATION REQUIRED]`**: Unresolved design question flagged for prototype validation (e.g., exact user comprehension rate of trust badges).
* **`[PROTOTYPE DECISION]`**: Specific design choice made strictly for the Phase 5 Prototype scope to enable evaluation.
* **`[IMPLEMENTATION DETAIL — PHASE 6]`**: Technical styling or component code concern explicitly deferred to Phase 6 engineering.

---

## 4. USER RESEARCH MODEL & PERSONAS

WAYNAH user research is modeled around functional roles, information needs, and environmental constraints rather than demographic statistics `[UX DECISION]`.

### 4.1 Primary User Archetypes `[UX DECISION]`

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                WAYNAH USER ARCHETYPES                                     │
├──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┤
│ 1. Local Citizen     │ 2. Field Visitor /   │ 3. Business / Branch │ 4. Community         │
│    Discoverer        │    Traveler          │    Operator          │    Contributor       │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ • Urgent local search│ • Orientation in     │ • Maintains branch   │ • Corrects stale     │
│ • Operating status   │   unfamiliar district│   hours & contact    │   location/hours     │
│ • Reliable contact   │ • Descriptive spatial│ • Manages service    │ • Submits new site   │
│ • Low data usage     │   landmark anchors   │   offerings          │   observations       │
└──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

#### User Profile Breakdown

| User Archetype | Primary Goals | Key Frustrations | Connectivity Constraints | Key Decision Moment |
|---|---|---|---|---|
| **Local Citizen Discoverer** `[UX DECISION]` | Find immediate services (pharmacy, repair shop, gas station), check if open, get phone/WhatsApp. | Outdated phone numbers, closed doors, wrong location pins on generic maps. | 2G/3G mobile networks, expensive mobile data bundles. | "Can I reach them by phone or walk there right now?" |
| **Field Visitor / Traveler** `[UX DECISION]` | Spatial orientation in unfamiliar districts (e.g., Abs, Hajjah city), landmark navigation. | Lack of formal street names, misleading generic address strings. | Intermittent coverage, offline/low-bandwidth needs. | "Where is this landmark relative to where I am?" |
| **Business / Branch Operator** `[UX DECISION]` | Present accurate operating hours, current phone/WhatsApp, active branch relocation notices. | Difficulty updating generic map pins, duplicate listings, false customer reports. | Standard mobile web access, periodic connection. | "Are my customers seeing my correct current location and phone?" |
| **Community Contributor & Verifier** `[UX DECISION]` | Report moved businesses, correct wrong phone numbers, confirm open/closed state. | Complex contributor forms, lack of feedback on submitted corrections. | Mobile web, active in-the-field reporting. | "Is my correction submitted and visible to reviewers?" |
| **Information Verifier / Admin** `[UX DECISION]` | Evaluate conflicting claims, review user contributions, resolve duplicate records. | Overwhelming triage queues, missing evidence artifacts. | Desktop/Tablet connection, high-density display. | "Does the evidence support marking this claim confirmed?" |

---

## 5. CORE USER JOBS (JTBD MODEL)

The UX of WAYNAH is structured directly around 11 Core Jobs-to-be-Done `[UX DECISION]`:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                CORE USER JOBS (JTBD)                                      │
├─────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ JTBD-01         │ Discovery: "I need to find a specific place or type of service near me." │
│ JTBD-02         │ Location: "I need clear directions using physical landmarks I know."     │
│ JTBD-03         │ Contact: "I need an active phone number or WhatsApp to talk to them."   │
│ JTBD-04         │ Operational State: "I need to know if they are open right now."          │
│ JTBD-05         │ Service Understanding: "I need to know what specific services they offer."│
│ JTBD-06         │ Trust: "I need to know if this information is verified and fresh."      │
│ JTBD-07         │ Comparison: "I need to compare nearby options by location and status."  │
│ JTBD-08         │ Contribution: "I want to report updated hours or a correct phone number."│
│ JTBD-09         │ Conflict: "I noticed conflicting information and want to report it."   │
│ JTBD-10         │ Relocation: "I need to find where a business moved after leaving its site."│
│ JTBD-11         │ Uncertainty: "I need to understand what the system does NOT know."      │
└─────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. INFORMATION ARCHITECTURE (IA) & NAVIGATION

WAYNAH Information Architecture decouples public user navigation from internal domain complexity `[UX DECISION]`. Users interact with natural real-world concepts (Places, Services, Contact, Verification) while the underlying Domain Model (`Business → Branch → Place`) operates seamlessly behind the scenes.

### 6.1 Global Site Architecture `[UX DECISION]`

```text
                               WAYNAH PUBLIC IA HIERARCHY
                                           │
     ┌───────────────────┬─────────────────┼───────────────────┬───────────────────┐
     ▼                   ▼                 ▼                   ▼                   ▼
 [Home Page]       [Search & Map]   [Place Detail]      [Business View]     [User / Account]
  - Primary Search  - Results List   - Identity Header   - Brand Overview    - Saved Places
  - Quick Categories- Map Markers    - Status & Hours    - Branch List       - My Contributions
  - Spatial Context - Category Filter- Location Anchors - Official Info     - Settings/Lang
  - Trust Cues      - List/Map Toggle- Contact Methods   - Trust Profile
                    - Low-Data View  - Services Offered
                                     - Provenance/Trust
                                     - Reviews & Feedback
                                     - Report/Edit Flow
```

### 6.2 Primary Navigation Structure `[PROTOTYPE DECISION]`
* **Mobile View**: Bottom Navigation Bar with 4 primary destinations `[PROTOTYPE DECISION]`:
  1. **Home / الرئيسية**: Search bar focus, top categories, recent context.
  2. **Explore / استكشاف**: Spatial search, list & map view, nearby places.
  3. **Saved / المحفوظات**: Cached saved places and contact shortcuts (read-only client cache).
  4. **Contributions / المساهمات**: User edits, reported changes, pending review status.
* **Desktop View**: Header Navigation with Search Bar, Category Dropdown, Geographic Region Selector (Hajjah / Abs / City), Saved Items, and Contribution Portal `[PROTOTYPE DECISION]`.

> **NAVIGATION NOTE `[UX HYPOTHESIS]`**: The 4-tab mobile bar and header options represent the initial prototype navigation layout. Prototype usability testing will evaluate whether users navigate fluently between search discovery, saved shortcuts, and contribution workflows.

---

## 7. INFORMATION PRIORITY & PROGRESSIVE DISCLOSURE

To avoid overwhelming users while maintaining complete transparency, WAYNAH UI applies a **5-Tier Progressive Disclosure Model** `[UX DECISION]`:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             5-TIER PROGRESSIVE DISCLOSURE                                 │
├───────────────────┬───────────────────────────────────────────────────────────────────────┤
│ Tier 1: Primary   │ Immediate Action: Place Name, Branch Title, Current Status (Open/   │
│                   │ Closed), Distance, Primary Phone/WhatsApp Button.                     │
├───────────────────┼───────────────────────────────────────────────────────────────────────┤
│ Tier 2: Secondary │ Immediate Context: Descriptive Address Anchor, Main Category,        │
│                   │ Operating Hours Schedule, Verified Badge (if verified).               │
├───────────────────┼───────────────────────────────────────────────────────────────────────┤
│ Tier 3: Support   │ Service Details: Service Offering list, Payment modes, Secondary      │
│                   │ contacts, User reviews & ratings.                                     │
├───────────────────┼───────────────────────────────────────────────────────────────────────┤
│ Tier 4: Trust     │ Provenance Context: Data source, last confirmation date, evidence     │
│                   │ summaries, uncertainty notices (stale/conflicting).                   │
├───────────────────┼───────────────────────────────────────────────────────────────────────┤
│ Tier 5: Advanced  │ Domain Details: Historical relocation timeline, aggregate lineage,    │
│                   │ technical verification record history, duplicate match flags.         │
└───────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 8. HOME EXPERIENCE

The Home screen prioritizes immediate utility over decorative marketing heroes `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                WAYNAH HOME SCREEN LAYOUT                                  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Header: Logo "وينه؟" | Location Context: "عبس، حجة" ▾ | Lang: العربية ]                │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ SEARCH INPUT BAR                                                                      ] │
│   "ابحث عن مكان، صيدلية، ورشة، أو خدمة..."  [🔍 Search Button]                             │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ QUICK DISCOVERY CATEGORIES (Horizontal Scrollable Chips)                              ] │
│   (🏥 صيدليات)  (🛠️ ورش وصيانة)  (⛽ محطات وقود)  (🛒 تموينات)  (🍽️ مطاعم)                 │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ NEARBY / CURRENT OPERATIONAL HIGHLIGHTS                                               ] │
│   Card 1: صيدلية الأمل الحديثة — مفتوح الآن (يبعد 250م) [اتصال] [واتساب]                 │
│   Card 2: ورشة السلام للميكانيكا — مفتوح الآن (دوار عبس) [اتصال]                          │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ TRUST & COMMUNITY BANNER                                                              ] │
│   "معلومات موثوقة ومحدّثة من الميدان — هل لاحظت تغييرًا؟ [ساهم بتحديث معلومة]"            │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Home Screen Behaviors `[UX DECISION]`
1. **Search Focus**: Tapping search immediately activates full-screen search input with instant Arabic suggestions.
2. **Location Context Selector**: Allows user to set active geographic context (e.g. "Abs District", "Hajjah City", "All Governorate") without requiring GPS.
3. **Low-Bandwidth Mode**: On slow connections, heavy graphic cards load minimal text representations instantly.

---

## 9. SEARCH UX & ARABIC LANGUAGE DISCOVERY

Search is the primary entry point for spatial and service discovery in WAYNAH.

### 9.1 Arabic Search Handling Heuristics `[UX DECISION]`
Arabic text input in Yemen presents specific spelling, phonetic, and dialect variations that the UI search experience must handle seamlessly:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                               ARABIC SEARCH TOLERANCE                                     │
├───────────────────┬───────────────────────────────┬───────────────────────────────────────┤
│ Variation Type    │ Example User Query            │ Matching Intention / Canonical Target │
├───────────────────┼───────────────────────────────┼───────────────────────────────────────┤
│ Character Folding │ "أمل" / "امل" / "إمل"          │ Matches "صيدلية الأمل"                │
│ Alef Maqsura      │ "مستشفى الأمل" / "مستشفي امل" │ Matches "مستشفى الأمل"                │
│ Ta Marbuta        │ "ورشة" / "ورشه"               │ Matches "ورشة صيانة"                  │
│ Vernacular Prefix │ "دوار" / "جولة"               │ Matches spatial landmark anchors      │
│ Partial Names     │ "باحكيم"                      │ Matches "مكتبة باحكيم وتوزيع"         │
│ Service Intent    │ "تغيير زيت"                   │ Matches Branches offering oil change  │
└───────────────────┴───────────────────────────────┴───────────────────────────────────────┘
```

### 9.2 Zero & Weak Results Experience `[UX DECISION]`
When a search query yields no exact match, WAYNAH UI never displays a blank dead end:
* **Alternative Suggestions**: "لم نجد نتائج مطابقة تمامًا لـ 'X'. هل تقصد..."
* **Nearby Category Expansion**: Shows closest operational categories matching query intent.
* **Geographic Scope Expansion**: "توسيع نطاق البحث ليشمل كامل مديرية عبس".
* **Contribution Prompt**: "هل هذا المكان موجود ولم ندرجه بعد؟ [أضف مكانًا جديدًا]".

---

## 10. SEARCH RESULT EXPERIENCE (CARD DESIGN)

Search results are presented as lightweight, scannable **Result Cards** that convey essential context before the user clicks to view details `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              WAYNAH SEARCH RESULT CARD                                    │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [Icon]  صيدلية الأمل الحديثة                      [✓ موثق | Verified Source]               │
│         فرع شارع المجمع — مؤسسة الأمل الطبية                                              │
│                                                                                           │
│ 📍 150 متر — جنوب دوار عبس، مقابل صيدلية السلام                                          │
│ ⏰ مفتوح الآن (يغلق 11:00 مساءً)                                                          │
│ 🏷️ صيدلية • مستلزمات طبية • خدمة 24 ساعة                                                  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ 📞 اتصال مباشر ]   [ 💬 واتساب ]   [ 📍 عرض على الخريطة ]   [ التفاصيل الكاملة ← ]      │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Information Boundary: Result Card vs Detail Page `[UX DECISION]`

| Information Attribute | Visible on Search Result Card | Visible ONLY on Detail Page | Rationale |
|---|---|---|---|
| Place / Branch Name | **Yes** | **Yes** | Core identification. |
| Operational Status | **Yes** (Open/Closed badge) | **Yes** (Full schedule breakdown) | Scannability. |
| Distance & District | **Yes** (e.g. "250m • Abs") | **Yes** (Full landmark anchors) | Quick orientation. |
| Primary Phone / WhatsApp | **Yes** (Direct quick-action buttons)| **Yes** (All contact channels) | Instant action without extra click. |
| Verification Signal | **Yes** (Compact trust badge) | **Yes** (Source evidence & proof summary)| Prevents card clutter. |
| Service Offering List | Category tags only | Full detailed service listing | Progressive disclosure. |
| Relocation History | Relocation indicator tag (if relocated)| Full historical timeline & old address | Advanced context. |
| User Reviews & Rating | Average rating snippet | Individual review cards & filter | Secondary information. |

---

## 11. MAP UX & LIST-MAP INTERACTION

WAYNAH treats the Map as a spatial visualization companion to the Result List, NOT as an mandatory prerequisite for discovery `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              LIST ↔ MAP INTERACTION MODEL                                 │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                 [ List / Map Toggle Bar ]                                 │
│                                ┌───────────────┬───────────────┐                          │
│                                │  📋 القائمة   │   🗺️ الخريطة  │                          │
│                                └───────────────┴───────────────┘                          │
│                                                                                           │
│   MOBILE SPLIT / TOGGLE VIEW                     DESKTOP SIDE-BY-SIDE VIEW                │
│  ┌────────────────────────┐                   ┌───────────────────┬────────────────────┐  │
│  │ Results List           │                   │ Results List      │ Interactive Map    │  │
│  │ Item 1 [Highlight] ───┼───────────────────┼──► Marker 1 (Active)│ Pin 1 (Selected)  │  │
│  │ Item 2                 │                   │ Item 2            │ Pin 2              │  │
│  │ Item 3                 │                   │ Item 3            │ Pin 3              │  │
│  └────────────────────────┘                   └───────────────────┴────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Map Interaction Rules `[UX DECISION]`
1. **Marker Selection**: Tapping a map marker scrolls to and highlights the corresponding result card in the list.
2. **List Hover/Tap**: Tapping a result card highlights and centers its marker on the map.
3. **Low-Bandwidth Fallback**: If map tiles fail to load (network drop), the List view remains 100% functional with descriptive text addresses (`[UX DECISION]`).
4. **No Forced Map Loading**: Users on poor networks can disable map tile rendering entirely in settings to save bandwidth.

---

## 12. PLACE DETAIL EXPERIENCE

The Place Detail Page is the central information hub for a location or branch. It organizes domain entities seamlessly into an intuitive human reading hierarchy `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              PLACE DETAIL SCREEN STRUCTURE                                │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. IDENTITY HEADER                                                                        │
│    - Canonical Name & Vernacular Aliases                                                  │
│    - Operating Unit Context ("فرع عبس المركز الرئيسي — شركة الخليج للتجارة")              │
│    - Trust & Verification Badge Bar                                                       │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. OPERATIONAL STATUS BLOCK                                                               │
│    - Real-time Open/Closed indicator                                                      │
│    - Today's Schedule & Ramadan / Seasonal Exception Notice                               │
│    - Freshness Signal ("تم التأكيد قبل 3 أيام بواسطة موظف الميدان")                      │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. LOCATION & ACCESS ANCHORS                                                              │
│    - Administrative Context: Governorate, District, Uzlah                                 │
│    - Descriptive Landmark Address: "جنوب دوار عبس الرئيسي، بجوار مسجد الفاروق"            │
│    - Map Preview with Coordinates & Directions button                                      │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. DIRECT CONTACT ACTIONS                                                                 │
│    - [ 📞 اتصال: 770000000 ]   [ 💬 واتساب مباشر ]   [ 🌐 الموقع الإلكتروني ]            │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. SERVICE OFFERINGS & CAPABILITIES                                                       │
│    - List of available services (e.g. فحص ميكانيكي، تغيير زيت، قطع غيار)                 │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 6. PROVENANCE & DATA TRUST CONTEXT                                                        │
│    - Data Source attribution ("المصدر: مسح ميداني + تحديث صاحب العمل")                   │
│    - Evidence summary & verification status                                               │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 7. USER REVIEWS & EXPERIENCES                                                             │
│    - Community ratings & experience reports (Decoupled from factual data)                 │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 8. CORRECTION & CONTRIBUTION BAR                                                          │
│    - "هل تلاحظ معلومة غير دقيقة؟ [إبلاغ عن تصحيح أو تغيير]"                               │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. BUSINESS VS BRANCH EXPERIENCE

WAYNAH UX clearly communicates organizational ownership without confusing technical domain jargon `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                               BUSINESS ↔ BRANCH UX MODEL                                  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│   BUSINESS VIEW (المؤسسة / الشركة)                                                       │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ شركة الأمل للخدمات الطبية (Commercial Entity)                                    │   │
│   │ "مؤسسة طبية وتجارية مسجلة — 3 فروع في محافظة حجة"                                 │   │
│   │                                                                                   │   │
│   │  BRANCHES LIST (الفروع التشغيلية):                                                │   │
│   │  📍 فرع عبس (شارع المجمع) ──────────► [عرض الفرع والموقع]                         │   │
│   │  📍 فرع حجة المدينة (حورة) ─────────► [عرض الفرع والموقع]                         │   │
│   │  📍 فرع حرض (مغلق مؤقتًا) ──────────► [عرض التاصيل]                              │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
│   BRANCH VIEW (الفرع والموقع)                                                            │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ صيدلية الأمل — فرع عبس                                                            │   │
│   │ 🏢 يتبع: شركة الأمل للخدمات الطبية [عرض صفحة المؤسسة]                             │   │
│   │ 📍 الموقع: شارع المجمع، عبس، حجة                                                  │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. TRUST UX & MULTI-LAYERED CONFIDENCE

Trust in WAYNAH is expressed through clear, transparent provenance signals rather than opaque numeric scores or fake percentage algorithms `[UX DECISION]`.

### 14.1 Multi-Layered Trust Classification `[UX DECISION]`

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             WAYNAH TRUST CLASSIFICATION                                   │
├───────────────────────┬───────────────────────────────┬───────────────────────────────────┤
│ Trust Tier            │ Visual UI Signal              │ Meaning & Provenance Context      │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 1. Verified Official  │ 🟢 موثق ميدانيًا              │ Confirmed by official field agent │
│                       │ (Green Badge + Shield)        │ or business owner with proof.     │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 2. Recently Confirmed │ 🔵 محدّث مؤخرًا               │ Re-confirmed by community/source  │
│                       │ (Blue Badge + Check)          │ within prototype timeframe.       │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 3. Community Reported │ 🟡 مساهمة مجتمعية             │ Reported by citizen contributor,  │
│                       │ (Amber Badge + User Icon)     │ pending formal field verification.│
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 4. Stale Information  │ 🟠 معلومات قديمة               │ Not re-confirmed for extended     │
│                       │ (Orange Badge + Clock)        │ period; needs verification.       │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 5. Conflicting Data   │ ⚠️ قيد المراجعة / بيانات متعارضة│ Multiple conflicting claims exist;│
│                       │ (Yellow Warning Badge)        │ undergoing administrative review. │
└───────────────────────┴───────────────────────────────┴───────────────────────────────────┘
```

> **TRUST TAXONOMY NOTE `[PROTOTYPE DECISION]`**: Visual badge choices, icon pairings, and sample freshness windows (e.g. 30–90 days for recently confirmed, >180 days for stale) represent prototype UX presentation choices `[PROTOTYPE DECISION]`. The backend evaluation of trust claims remains strictly server-authoritative (`[UX DECISION]`), and exact freshness thresholds will be tested during prototype evaluation (`[UX HYPOTHESIS]`). UI badges communicate provenance without implying permanent truth or numeric authority scores.

### 14.2 Strict Anti-Pattern Warning `[UX DECISION]`
WAYNAH UI MUST NEVER display:
* Fake percentage scores (e.g. "94% Trusted").
* Arbitrary numerical authority points.
* Single unverified boolean `verified: true` switches without source context.

---

## 15. UNCERTAINTY UX & HONEST COMMUNICATION

When information is incomplete, unverified, or conflicting, WAYNAH UI communicates uncertainty clearly without inducing panic or confusion `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             UNCERTAINTY UI PATTERNS                                       │
├───────────────────┬───────────────────────────────────────┬───────────────────────────────┤
│ Reality Context   │ Clear Arabic UI Microcopy             │ Visual Styling                │
├───────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ Hours Unknown     │ "أوقات العمل غير مؤكدة حاليًا — يُنصح │ Muted Grey Badge with Info    │
│                   │ بالاتصال هاتفياً قبل الزيارة"         │ Icon                          │
├───────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ Conflicting Phone │ "يوجد أكثر من رقم تواصل مسجل لهذا     │ Dual Button Display with      │
│                   │ المكان [رقم 1 (مؤكد)] [رقم 2 (مجتمعي)]"│ Source Badges                 │
├───────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ Relocated Site    │ "انتقل هذا المكان من موقعه السابق في  │ Amber Notice Card with Link to│
│                   │ (سوق الاثنين) إلى (دوار عبس)"        │ New Active Location           │
├───────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ Unverified Place  │ "مكان مدرج حديثاً — لم يتم التحقق     │ Subtle Informational Banner   │
│                   │ الميداني منه بعد"                     │ with "Confirm Data" CTA       │
└───────────────────┴───────────────────────────────────────┴───────────────────────────────┘
```

---

## 16. CONTACT UX & MULTI-CHANNEL ACTION

Contact channels are displayed as accessible, direct action buttons tailored to Yemen's mobile landscape `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTACT ACTION UI BLOCK                                      │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ 📞 اتصال هاتف جوال: 770123456 ]   [ 📞 هاتف ثابت: 07220000 ]                            │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ 💬 تواصل عبر واتساب (مباشر) ]   ← Pre-filled text: "السلام عليكم، استفسار من وينه..."   │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ ℹ️ ملاحظة: رقم الهاتف مشترك لعدة فروع — الفرع الحالي: عبس.                                │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. OPERATING STATUS UX

Operating status is calculated based on active schedule rules and exception states, displayed with temporal context `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              OPERATING STATUS UI PATTERNS                                 │
├───────────────────────┬───────────────────────────────┬───────────────────────────────────┤
│ Status State          │ Visual Indicator & Label      │ Temporal Subtext                  │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Active Open           │ 🟢 مفتوح الآن                 │ "يغلق عند الساعة 11:00 مساءً"     │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Split Shift (Interval)│ 🟡 مغلق حالياً (فترة استراحة)  │ "يفتح الفترة المسائية الساعة 4:00"│
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Closed                │ 🔴 مغلق                       │ "يفتح غداً الساعة 8:00 صباحاً"    │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Seasonal / Ramadan    │ 🌙 دوام شهر رمضان             │ "الفترة الأولى: 10ص - 4ع"         │
│                       │                               │ "الفترة الثانية: 8:30م - 1:00ص"   │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Status Unknown        │ ⚪ حالة التشغيل غير معلومة    │ "لم يتم تأكيد أوقات العمل مؤخراً" │
└───────────────────────┴───────────────────────────────┴───────────────────────────────────┘
```

---

## 18. REVIEWS VS FACTUAL CLAIMS (STRICT DECOUPLING)

WAYNAH UI strictly isolates personal experience reviews from objective attribute claims `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             DECOUPLED REVIEWS VS FACTS UX                                 │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│  LEFT COLUMN / SECTION: FACTUAL DATA        RIGHT COLUMN / SECTION: CITIZEN REVIEWS       │
│  (Authoritative & Source-Backed)           (Subjective Experience Sentiment)              │
│  ┌─────────────────────────────────────┐   ┌───────────────────────────────────────────┐  │
│  │ • Address: Abs Main Street          │   │ ★★★★☆ (4.2/5) — 18 تقييم                  │  │
│  │ • Status: Open 24/7 (Confirmed)     │   │ "تعامل ممتاز وخدمة سريعة في تغيير الزيت"  │  │
│  │ • Phone: 770123456 (Verified)       │   │ — أحمد الحجي (قبل أسبوعين)                │  │
│  │ • Services: Mechanical Repair       │   │ ⚠️ التقييم يعبر عن رأي صاحبه ولا يغير      │  │
│  │                                     │   │    البيانات الأساسية للمكان.              │  │
│  └─────────────────────────────────────┘   └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 19. CONTRIBUTION & CORRECTION UX

Citizen contributions enable community crowdsourcing while preserving governance control through moderation queues `[UX DECISION]`.

```text
                               CONTRIBUTION WORKFLOW UX
                                           │
  ┌────────────────────────────────────────┼────────────────────────────────────────┐
  ▼                                        ▼                                        ▼
[Report Incorrect Info]          [Suggest Relocation]                      [Add New Place]
 - Select field (Phone, Hours)    - Enter new landmark anchor               - Enter Place Name
 - Provide updated detail         - Set spatial pin on map                  - Select District
 - Optional proof/photo upload    - Specify move date                       - Provide Phone/Hours
  │                                │                                         │
  └────────────────────────────────┼─────────────────────────────────────────┘
                                   ▼
                       [Submission Confirmation]
                        - Instant Tracking Code
                        - "تم تسليم اقتراحك بنجاح — قيد المراجعة الميدانية"
                        - Status tracker viewable in "My Contributions"
```

---

## 20. ERROR, EMPTY & EDGE STATES

WAYNAH UX designs specifically for edge cases and infrastructure disruptions `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              EDGE STATE UX PATTERNS                                       │
├───────────────────────┬───────────────────────────────┬───────────────────────────────────┤
│ Edge Condition        │ Visual Display & Illustration │ Recovery Action & Text            │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ No Search Results     │ 🔍 Map Glass with Query Text   │ "لم نجد نتائج لـ 'X'. [عرض الأماكن│
│                       │                               │ القريبة] [إضافة مكان جديد]"       │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Network Drop / Offline│ 📡 No Network Icon            │ "أنت تعمل بدون اتصال. يتم عرض     │
│                       │                               │ الأماكن المحفوظة مؤخراً." [إعادة] │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Map Tiles Unavailable │ 🗺️ Text Placeholder Container │ "تعذر تحميل الخريطة. القائمة النصية│
│                       │                               │ تعمل بكفاءة كاملة."               │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Relocated Business    │ 🚚 Moving Truck Graphic       │ "هذا فرع سابق وانتقل إلى موقع جديد│
│                       │                               │ [الانتقال للموقع الجديد ←]"      │
└───────────────────────┴───────────────────────────────┴───────────────────────────────────┘
```

---

## 21. LOW-BANDWIDTH UX & PERFORMANCE OPTIMIZATION

Designed explicitly for mobile connectivity conditions in Yemen `[UX DECISION]`:

1. **Lightweight HTML Payload**: Initial page payload contains readable text before executing client JS.
2. **Progressive Image Loading**: Small WebP thumbnails; full-size images load strictly on demand.
3. **No Mandatory External Font Blocking**: System fallback Arabic fonts (`system-ui`, `Segoe UI`, `Tahoma`) prevent render-blocking delay.
4. **Client Read Cache `[PROTOTYPE DECISION]`**: Frequently accessed places and saved items cache locally in browser `localStorage`/IndexedDB for read-only offline viewing `[PROTOTYPE DECISION]`.

> **OFFLINE BOUNDARY NOTE `[UX DECISION]`**: Per Phase 4 System Architecture, WAYNAH does NOT support offline write synchronization or offline entity creation. All contributions, edits, and searches require server authorization when network connectivity is available. Local storage is strictly a read-only performance helper for saved shortcuts.

---

## 22. RTL & ARABIC-FIRST DESIGN SYSTEM

WAYNAH is engineered natively for Right-to-Left (RTL) Arabic interaction `[UX DECISION]`.

### 22.1 Typography & Layout Direction `[UX DECISION]`
* **Default Language**: Arabic (`dir="rtl"`, `lang="ar"`).
* **Typography Stack**: Modern clean Arabic display font (e.g. Outfit / Cairo / Inter for numbers) with robust fallback to system fonts.
* **Mixed Text & Phone Numbers**: Phone numbers (`+967 770 000 000`) and coordinates (`15.9382° N, 43.2011° E`) format with explicit Left-to-Right (`dir="ltr"`) isolators to prevent layout corruption.

---

## 23. ACCESSIBILITY (A11Y) REQUIREMENTS

WAYNAH UI specifies key accessibility requirements for the design system `[PROTOTYPE REQUIREMENT]`:
1. **Touch Targets**: All clickable action buttons target a minimum 48×48px thumb size on mobile `[PROTOTYPE REQUIREMENT]`.
2. **High Contrast**: Text contrast ratios target WCAG AA standards (minimum 4.5:1 for body text) `[PROTOTYPE REQUIREMENT]`.
3. **Non-Color Indicators**: Status flags (Open/Closed/Verified) always combine color with explicit text labels and visual icons `[UX DECISION]`.
4. **Keyboard Navigation**: Full tab navigation support with visible focus outlines on interactive controls `[PROTOTYPE REQUIREMENT]`.

> **VERIFICATION NOTE `[IMPLEMENTATION DETAIL — PHASE 6]`**: Technical accessibility testing (screen reader ARIA semantics, exact contrast calculations, automated audit passes) is an engineering compliance task for Phase 6 execution.

---

## 24. MOBILE-FIRST RESPONSIVE SYSTEM

Layouts are designed mobile-first and scale gracefully up to desktop screens `[UX DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              RESPONSIVE BREAKPOINT BEHAVIOR                               │
├───────────────────────┬───────────────────────────────┬───────────────────────────────────┤
│ Screen Size           │ Layout Structure              │ Key Component Transformations     │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Mobile (< 640px)      │ Single column, bottom bar nav,│ Filters open in Bottom Sheet;     │
│                       │ full-width cards.             │ Map toggles full-screen.          │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Tablet (640px–1024px) │ Dual column, collapsible side │ Split list/map view; horizontal   │
│                       │ filter drawer.                │ category bars.                    │
├───────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ Desktop (> 1024px)    │ Multi-column layout with fixed│ Sticky side search filters; dual  │
│                       │ header navigation.            │ side-by-side list + map container.│
└───────────────────────┴───────────────────────────────┴───────────────────────────────────┘
```

---

## 25. DESIGN SYSTEM DIRECTION

### 25.1 Brand Personality `[UX DECISION]`
WAYNAH visual identity reflects **trust, local clarity, calmness, and modern utility**—avoiding dark gaming aesthetics, hyper-saturated RGB gradients, or flashy promo banners.

### 25.2 Visual Palette Tokens `[PROTOTYPE DECISION]`

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              WAYNAH COLOR PALETTE SYSTEM                                  │
├───────────────────┬───────────────────────┬───────────────────────────────────────────────┤
│ Color Role        │ Hex Token / HSL       │ Intended UX Purpose                           │
├───────────────────┼───────────────────────┼───────────────────────────────────────────────┤
│ Primary Brand     │ #0F766E (Teal 700)    │ Primary headers, main action buttons, trust.  │
│ Secondary Brand   │ #0284C7 (Sky 600)     │ Interactive links, map highlights, info.      │
│ Surface Light     │ #F8FAFC (Slate 50)    │ Clean page backgrounds, light cards.          │
│ Surface Card      │ #FFFFFF (White)       │ Raised result cards, elevated modals.         │
│ Text Primary      │ #0F172A (Slate 900)   │ High-contrast headers and body text.          │
│ Text Muted        │ #64748B (Slate 500)   │ Secondary metadata, timestamps, captions.     │
│ Success Status    │ #16A34A (Green 600)   │ Open status, verified trust badges.           │
│ Warning Status    │ #D97706 (Amber 600)   │ Stale data, pending reviews, split shifts.    │
│ Error Status      │ #DC2626 (Red 600)     │ Closed status, reported errors.               │
└───────────────────┴───────────────────────┴───────────────────────────────────────────────┘
```

---

## 26. COMPONENT SYSTEM SPECIFICATION

Phase 5 defines 22 core UI component families required for the prototype `[PROTOTYPE DECISION]`:

```text
CORE UI COMPONENT FAMILIES (22 TOTAL)
├── Shell & Navigation: 1. App Header, 2. Mobile Bottom Bar, 3. Responsive Container
├── Search & Filtering: 4. Search Bar Input, 5. Search Suggestion Dropdown, 6. Category Chip Bar, 7. Filter Drawer
├── Result Presentation: 8. Result Card, 9. Map Marker Pin, 10. List/Map View Toggle, 11. Pagination/Infinite Loader
├── Place Detail Views: 12. Place Header Block, 13. Operational Status Badge, 14. Contact Action Button, 15. Service Item List
├── Trust & Provenance: 16. Trust Indicator Badge, 17. Data Provenance Summary Block, 18. Review Rating Card
├── Community Forms:   19. Contribution Form Modal, 20. Report Error Sheet
└── Feedback & Utility: 21. Empty State Placeholder, 22. Network/Offline Banner
```

---

## 27. USER FLOWS (PRIMARY USER JOURNEYS)

Phase 5 defines 9 complete end-to-end user flows `[UX DECISION]`:

### Flow A: Search → Results → Place Detail `[UX DECISION]`
1. **Entry**: User opens Home screen and types "صيدلية" into search bar.
2. **Suggestions**: Real-time dropdown suggests "صيدليات في عبس" and matching branch names.
3. **Results**: User taps enter, receiving a list of nearby pharmacy cards displaying Open status and primary phone numbers.
4. **Detail**: User clicks "صيدلية الأمل", transitioning to the Place Detail screen showing full schedule, landmark directions, and WhatsApp contact button.

### Flow B: Nearby → Map/List → Place Detail `[UX DECISION]`
1. **Entry**: User taps "ورش وصيانة" category chip on Home screen.
2. **View**: User toggles to Map View to see spatial distribution of repair workshops around Abs roundabout.
3. **Selection**: User taps pin #3, highlighting the card for "ورشة السلام للميكانيكا".
4. **Detail**: User taps card to view specific service offerings (oil change, engine repair) and operating hours.

### Flow C: Service Search → Relevant Results → Branch/Place `[UX DECISION]`
1. **Entry**: User searches for specific service "تغيير زيت ميكانيكي".
2. **Matching**: Search engine matches Service Offerings provided by Branches in Hajjah.
3. **Display**: Results highlight specific branches that actively offer oil change services.

### Flow D: Place → Direct Contact `[UX DECISION]`
1. **Entry**: User accesses a Place Detail page.
2. **Action**: User taps green "💬 واتساب مباشر" button.
3. **Execution**: System opens WhatsApp with a pre-filled Arabic query referencing the place name.

### Flow E: Place → Verification & Trust Context `[UX DECISION]`
1. **Entry**: User clicks the "🟢 موثق ميدانيًا" trust badge on a place card.
2. **Modal**: System opens a Data Provenance Modal showing data source ("مسح ميداني - فريق حجة"), confirmation date ("15 سبتمبر 2026"), and verified attributes list.

### Flow F: Wrong Information → Contribution → Confirmation `[UX DECISION]`
1. **Entry**: User notices an outdated phone number on a Place page.
2. **Action**: User taps "إبلاغ عن تصحيح".
3. **Form**: User selects "تحديث رقم الهاتف", enters new digit string `771111111`, and submits.
4. **Outcome**: Screen shows confirmation banner with tracking ID, stating suggestion is pending field reviewer triage.

### Flow G: Conflicting Information → Uncertainty Context `[UX DECISION]`
1. **Entry**: User views a Place with conflicting operating hours.
2. **Notice**: UI displays yellow warning banner: "يوجد تعارض في أوقات العمل المسجلة لهذا المكان".
3. **Clarity**: UI shows both reported schedules with source attributions, advising user to call ahead.

### Flow H: Relocated Place → Historical & Current Location `[UX DECISION]`
1. **Entry**: User searches for a shop at its old location in "سوق الاثنين".
2. **Redirect**: Result card displays amber tag: "انتقل للموقع الجديد".
3. **Context**: Detail page shows current active branch location in "دوار عبس" alongside historical record of old location.

### Flow I: Business Overview → Branches → Place `[UX DECISION]`
1. **Entry**: User views Place Detail for "فرع مؤسسة الخليج - عبس".
2. **Navigation**: User taps parent business link "شركة الخليج للتجارة".
3. **Overview**: Business Overview screen shows corporate info and a directory of all 4 active branches across Hajjah governorate.

---

## 28. PROTOTYPE FOUNDATION & SCOPE

Phase 5 establishes a clear, practical **Prototype Scope** to validate the UX model before Phase 6 engineering `[PROTOTYPE DECISION]`.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              PROTOTYPE SCOPE BOUNDARIES                                   │
├───────────────────────────────────────┬───────────────────────────────────────────────────┤
│ Included Prototype Screens (7 Total)  │ Explicitly Excluded from Prototype Scope          │
├───────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. Home Screen (Search & Categories)  │ Full Admin Verification Dashboard                 │
│ 2. Search Results List & Filter       │ User Registration / Complex Auth Flows            │
│ 3. Interactive Map / List Split View  │ E-Commerce Shopping Cart / Checkout               │
│ 4. Place Detail Screen                │ Direct In-App Peer Chat                           │
│ 5. Business & Branch Directory Screen │ Payment Gateway Integration                       │
│ 6. Data Provenance & Trust Modal      │ Live GPS Navigation Voice Guidance                │
│ 7. Contribution / Correction Sheet    │ Multi-tenant Business Analytics Portal            │
└───────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 29. PROTOTYPE SCREEN SPECIFICATIONS

Detailed functional specifications for the 7 prototype screens `[PROTOTYPE DECISION]`:

### Screen 1: Home Screen (`/`)
* **Purpose**: Primary discovery entry point.
* **Key Components**: Header with location selector, Search Bar with auto-complete, Horizontal Category Chips, Nearby Operational Highlights list, Trust banner.
* **Mobile Behavior**: Search bar sticky at top; categories scroll horizontally.
* **Desktop Behavior**: Categories expand into multi-column grid; wide search input.

### Screen 2: Search Results Screen (`/search`)
* **Purpose**: Present scannable place and service matches.
* **Key Components**: Search input header, Applied Filters bar, Result Cards list, View Toggle (List/Map), Pagination/Load More button.
* **Mobile Behavior**: Single column result cards; filter drawer button bottom right.
* **Desktop Behavior**: Sidebar filter panel on right; 2-column result card grid on left.

### Screen 3: Map / List Split View Screen (`/map`)
* **Purpose**: Spatial discovery and geographic orientation.
* **Key Components**: Full-screen interactive Leaflet map container, custom map pins (colored by category/status), drawer result card preview.
* **Mobile Behavior**: Full-screen map with bottom floating card sheet for active selection.
* **Desktop Behavior**: 50/50 side-by-side split screen (Left: Map, Right: Scrollable Result Cards).

### Screen 4: Place Detail Screen (`/place/[id]`)
* **Purpose**: Comprehensive information view for a specific location or branch.
* **Key Components**: Identity header, Operational status block, Descriptive landmark address block, Direct Contact action buttons (Phone, WhatsApp), Service offering tags, Provenance & Trust card, User reviews section, Edit contribution button.
* **Mobile Behavior**: Stacked single column layout; sticky bottom contact action bar.
* **Desktop Behavior**: Two-column layout (Left: Primary info & services; Right: Map preview & contact details).

### Screen 5: Business Overview Screen (`/business/[id]`)
* **Purpose**: Display corporate identity and multi-branch network.
* **Key Components**: Business header & brand overview, Verified ownership badge, List of operational branches with locations and statuses.

### Screen 6: Data Provenance Modal
* **Purpose**: Display transparent evidence and source lineage for data attributes.
* **Key Components**: Data source attribution, Timestamp of last field audit, Evidence summary list, Verification level classification.

### Screen 7: Contribution Sheet
* **Purpose**: Allow users to submit corrections or new observations.
* **Key Components**: Correction type selector, Input fields for updated values, Evidence description field, Submit button with tracking feedback.

---

## 30. PROTOTYPE TEST QUESTIONS

The prototype is designed to evaluate specific usability and comprehension hypotheses `[UX HYPOTHESIS]`:

1. **Discovery Speed**: Can users locate an open pharmacy in Abs within 15 seconds using Arabic search?
2. **Landmark Orientation**: Do users understand descriptive address anchors without street numbers?
3. **Trust Transparency**: Do users understand the difference between a "Verified Field Data" badge and an unverified community submission?
4. **Uncertainty Perception**: Does displaying an "Hours Unknown" notice increase user confidence compared to displaying inaccurate static hours?
5. **Business/Branch Clarity**: Do users distinguish between a commercial Business brand and its specific local Branch location?
6. **Low-Bandwidth Usability**: Can users locate contact information on slow networks when map rendering is disabled?

---

## 31. VISUAL DIRECTION OPTIONS

Phase 5 evaluates 3 distinct Visual Direction options for the prototype `[PROTOTYPE DECISION]`:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              VISUAL DIRECTION OPTIONS                                     │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────┤
│ Option A: Calm Geographic     │ Option B: Modern National     │ Option C: Vibrant Local   │
│ Utility (RECOMMENDED)         │ Digital Platform              │ Discovery                 │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────┤
│ • Slate & Deep Teal palette   │ • High-contrast Navy & Gold   │ • Warm Emerald & Orange   │
│ • Minimalist, high contrast   │ • Formal civic layout         │ • Card-heavy, high density│
│ • Focus on fast data reading  │ • Authoritative feel          │ • Consumer app style      │
│ • Low battery & data usage    │ • Heavy border framing        │ • Dynamic micro-animations│
└───────────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

> **PROTOTYPE SELECTION `[PROTOTYPE DECISION]`**: **Option A (Calm Geographic Utility)** is selected for the Phase 5 Prototype. It delivers maximum legibility, fast performance on low-bandwidth networks, and clear visual hierarchy.

---

## 32. UX ANTI-PATTERNS (WHAT MUST BE AVOIDED)

The following anti-patterns are strictly prohibited in WAYNAH UI `[UX DECISION]`:

* ❌ **Overloaded Result Cards**: Cramming dozens of badges, tags, and icons onto a single search card.
* ❌ **Fake Numeric Trust Scores**: Displaying ungrounded authority percentages (e.g. "98% Trust").
* ❌ **Map Dependency**: Blocking user access to information when map tiles fail to load.
* ❌ **Conflating Place & Business**: Showing corporate registration details when a user wants local branch hours.
* ❌ **Ignoring Uncertainty**: Forcing a definitive "Open" or "Closed" badge when the operational state is unknown.
* ❌ **Desktop-First Layouts**: Designing wide multi-column screens and shrinking them awkwardly for mobile screens.
* ❌ **Dark Gaming / RGB Aesthetic**: Using saturated neon colors or dark gamer interfaces unsuitable for local utility.

---

## 33. UX RISK REGISTER

| Risk ID | Risk Description | Impact | Likelihood `[UX HYPOTHESIS]` | Mitigation Strategy | Prototype Validation Method |
|---|---|---|---|---|---|
| **UXR-01** | Users mistake unverified community edits for official data. | High | Medium | Distinct visual badge styling (`🟡 مساهمة مجتمعية`) and provenance notices. | Test Question #3 |
| **UXR-02** | Users struggle to find places without formal street addresses. | High | High | Prominent display of descriptive landmark anchors (`جنوب دوار عبس`). | Test Question #2 |
| **UXR-03** | Low-bandwidth networks cause map rendering failure. | High | High | Text-first layout priority; list view remains 100% operational without map. | Low-bandwidth simulation test |
| **UXR-04** | Users confuse Business brand with local Branch location. | Medium | Medium | Clear visual hierarchy separating Business umbrella from Branch location. | Test Question #5 |
| **UXR-05** | Ambiguous Arabic search spellings yield zero results. | High | Medium | Character folding, alef/ta tolerance, and automatic fuzzy expansion. | Test Question #1 |

---

## 34. UX DEFERRED DECISIONS

To prevent premature lock-in prior to Phase 6 engineering, the following decisions remain explicitly deferred `[UX DECISION]`:

* `[DEFERRED]` Final production CSS font file provider (Google Fonts vs self-hosted font binary).
* `[DEFERRED]` Final map tile provider URL and tile rendering engine configuration.
* `[DEFERRED]` Exact pixel breakpoints for tablet CSS media queries.
* `[DEFERRED]` Native mobile application wrapper (PWA vs React Native).
* `[DEFERRED]` Final administrative dashboard UI layout for internal field agents.

---

## 35. DESIGN & DOMAIN INTEGRITY CHECK (PHASE 3 VERIFICATION)

This Phase 5 study was verified against Phase 3 Domain Model V1.2 `[UX DECISION]`:

* ✅ **Place ≠ Business**: Respected. Place Detail and Business Overview are distinct UI experiences.
* ✅ **Business ≠ Branch**: Respected. Branch is presented as the operational unit hosted at a Place.
* ✅ **Provider Mobility**: Respected. Independent field service providers are not forced into fixed site cards.
* ✅ **Claim ≠ Truth**: Respected. UI displays multi-sourced attribute claims with provenance context.
* ✅ **Review ≠ Fact**: Respected. Subjective user reviews are strictly isolated from objective factual data.
* ✅ **Phone ≠ Identity**: Respected. Phone is presented as a contact action, not a primary entity key.
* ✅ **Uncertainty Represented**: Respected. Stale data, unknown hours, and conflicting claims have clear UI notices.

---

## 36. ARCHITECTURE INTEGRITY CHECK (PHASE 4 VERIFICATION)

This Phase 5 study was verified against Phase 4 System Architecture V1.0 `[UX DECISION]`:

* ✅ **Low-Bandwidth First**: Respected. UI supports text-first rendering and graceful map degradation.
* ✅ **Modular Monolith Compatibility**: Respected. UI components consume REST API endpoints cleanly.
* ✅ **Server-Authoritative Trust**: Respected. UI renders trust classifications calculated by backend domain services.
* ✅ **PostgreSQL-Native Search**: Respected. UI search tolerances match `pg_trgm` and PostGIS spatial capabilities.

---

## 37. CODEBASE REALITY CHECK

Physical inspection of existing web client codebase (`apps/web`) reveals:
* Next.js 16 App Router is installed and operational (`apps/web/app/`) `[CODEBASE FACT]`.
* Leaflet 1.9 map package is present (`apps/web/package.json`) `[CODEBASE FACT]`.
* Basic search and place components exist as prototype stubs (`apps/web/components/`) `[CODEBASE FACT]`.
* **Conclusion**: Existing codebase provides a suitable foundation for building the Phase 5 Prototype without requiring architectural changes (`[UX FACT]`). Existing stub components represent implementation artifacts and do not dictate final UX design system rules (`[UX DECISION]`).

---

## 38. ONE-PASS REMEDIATION & CONSISTENCY SWEEP

A comprehensive internal audit was performed across all sections of this document:
* Verified taxonomy consistency across all sections (`[UX FACT]`, `[UX DECISION]`, `[UX HYPOTHESIS]`, `[PROTOTYPE DECISION]`, `[IMPLEMENTATION DETAIL — PHASE 6]`).
* Confirmed complete alignment with Phase 3 Domain Model and Phase 4 System Architecture.
* Ensured zero source code, database, schema, or API modifications were introduced.
* Confirmed all 9 user flows and 7 prototype screens are fully specified.
* Normalized all trust freshness intervals, navigation layouts, accessibility target goals, and read-only cache helpers to appropriate prototype and hypothesis taxonomy tags.

---

## 39. FINAL REPORT SUMMARY

### 1. Final Status
`PHASE 5 — CLOSED`

### 2. Next Step
`NEXT: PROTOTYPE DESIGN & INTERACTION MODEL`

### 3. Study Scope
Comprehensive UX/UI system study covering user research model, 11 core user jobs, information architecture, 5-tier progressive disclosure, Arabic search heuristics, result card & detail page designs, multi-layer trust & uncertainty UX, contact actions, mobile-first responsive system, visual direction, 22 component families, 9 user flows, and 7 prototype screen specifications.

### 4. Key Remediation Findings

| Finding ID | Identified Issue / Risk | Severity | Corrective Action Taken |
|---|---|---|---|
| **REM-01** | Risk of conflating Place and Business in search cards. | High | Explicitly separated Business identity from Branch operational site in card hierarchy. |
| **REM-02** | Potential map rendering dependency on slow 2G/3G networks. | High | Enforced text-first fallback layout priority and map-independent list discovery. |
| **REM-03** | Potential confusion between subjective reviews and factual state. | Medium | Enforced visual and layout isolation of user reviews from factual attribute blocks. |
| **REM-04** | Normalization of trust freshness & navigation structure certainty. | Low | Classified freshness windows and tab layouts as `[PROTOTYPE DECISION]` / `[UX HYPOTHESIS]`. |
| **REM-05** | Clarification of low-bandwidth client cache vs offline write sync. | Medium | Explicitly bounded `localStorage` as read-only cache, affirming zero offline write sync per Phase 4. |

### 5. Major UX Decisions Locked
* Mobile-first RTL Arabic layout with strict LTR handling for phone numbers & coordinates.
* Multi-layered provenance trust visual signals (No fake percentage trust scores).
* Honest uncertainty UI patterns for stale, unknown, or conflicting data.
* Direct contact actions (Phone, WhatsApp) prioritized on search result cards.
* Visual Direction Option A (Calm Geographic Utility) selected for prototype.

### 6. Phase 3 Domain Model Integrity
100% compliant. Place ≠ Business, Business ≠ Branch, Provider mobility, Claim ≠ Truth, and Review ≠ Fact are strictly preserved.

### 7. Phase 4 Architecture Integrity
100% compliant. Low-bandwidth awareness, server-authoritative trust, and PostgreSQL search compatibility strictly preserved.

### 8. Prototype Scope Prepared
7 Core Prototype Screens defined: Home, Search Results, Map/List View, Place Detail, Business Directory, Provenance Modal, Contribution Sheet.

### 9. Deferred UX Decisions
CSS font provider binaries, map tile server URL, exact tablet media breakpoints, and native application wrappers remain deferred to Phase 6 implementation.

### 10. Code Changes Executed
`NONE` (Document-only study).

### 11. Final Handoff Statement
`NEXT: PROTOTYPE DESIGN & INTERACTION MODEL`

---
