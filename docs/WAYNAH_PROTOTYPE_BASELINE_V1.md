# WAYNAH — PROTOTYPE V1 BASELINE SPECIFICATION

---

## A — Status

- **PROTOTYPE DESIGN & INTERACTION MODEL:** PASS
- **PROTOTYPE USABILITY REVIEW:** PASS (Internal / Simulated Review)
- **BASELINE STATUS:** FROZEN REFERENCE BASELINE V1

> **Note on Review Context:** The usability evaluation performed on Prototype V1 represents an internal simulated task review against target local user scenarios (Yemen / Abs / Hajjah context) and is not a clinical third-party field study.

---

## B — Prototype Screens (الشاشات المعتمدة)

1. **01 — Home Page (الرئيسية):**
   - Brand Header (`WaynahLogo` + `ThemePicker`).
   - Interactive SearchBar with live geographic query & GPS toggle.
   - Geographic context (`عبس — محافظة حجة / موقعك الحالي`).
   - Category Pills (صيدليات، مطاعم، طوارئ، مستشفيات، إلخ).
   - Nearby Discovery Cards with trust badge, distance, and category.
   - Calm Local Atlas SVG contour lines background pattern.

2. **02 — Search Results Page (نتائج البحث):**
   - Search query header and result count badge.
   - Collapsible SearchFilters drawer (Category, Radius, Status).
   - Result cards displaying operational state (مفتوح / مغلق / ساعات غير مؤكدة), phone contact button, distance, and address.
   - Full handling of empty, loading skeleton, and error states.

3. **03 — Map / List View Page (الخريطة / القائمة):**
   - List-first usability layout paired with Leaflet interactive map.
   - Synchronized Marker ↔ Result list selection (clicking card highlights marker, clicking marker highlights card).
   - Mobile view switcher (`🗺️ الخريطة` / `📋 القائمة`).
   - **Low-Bandwidth Mode Toggle:** Ability to disable map tiles via `isMapDisabled`, displaying an `UncertaintyNotice` (`MAP_OFFLINE`) while maintaining 100% text-first discovery and navigation.

4. **04 — Place Detail Page (تفاصيل المكان المكانية):**
   - Place identity title, category, district, and governorate metadata.
   - Branch / Business relationship context (`فرع تابع لـ: منشأة صيدليات السلام الوطنية`).
   - Operating status and contact details (`tel:` links with `dir-ltr` number formatting).
   - `TrustProvenanceCard` integration (verification source, date, confidence score).
   - `BusinessOverviewCard` integration (showing parent business entity & operational branch network).
   - `UncertaintyNotice` integration for stale or community-reported data.
   - Trigger button for `CorrectionModal` ("إبلاغ عن خطأ / اقترح تعديلاً").

5. **05 — Business Overview Card / Screen (ملف المنشأة والترابط):**
   - Displays Business identity, legal/brand status badge (`منشأة معتمدة / قيد التوثيق`).
   - List of operational branches (`Branch -> Place` link).

6. **06 — Trust & Provenance Card / Component (سجل التوثيق وموثوقية البيانات):**
   - Displays evidence summary, verification source, last confirmed date.
   - Displays explicit uncertainty alerts (conflicting phone numbers, stale data > 90 days).

7. **07 — Contribution & Correction Modal (المساهمة والتصحيح المجتمعي):**
   - Interactive modal for reporting incorrect information, suggesting spatial relocation, or updating phone/hours.
   - Simulated submission feedback state with green confirmation toast.

---

## C — Core User Flows

- **Flow 1 (Search & Discovery):** Home → SearchBar / Category → Search Results → Place Details.
- **Flow 2 (Spatial Map Navigation):** Home → Map → Marker Select / Card Highlight → Place Details.
- **Flow 3 (Low-Bandwidth Discovery):** Map → Toggle Low-Bandwidth Mode → Text-First List Discovery → Contact / Place Details.
- **Flow 4 (Business Hierarchy Exploration):** Place Details → Business Overview → Alternate Branch Navigation.
- **Flow 5 (Community Correction):** Place Details → Report Error Button → Correction Modal → Confirmation Toast.
- **Flow 6 (Theme Switcher):** Header Theme Picker → Select Accent Color / Mode → Instant UI Update → LocalStorage Persistence.

---

## D — Brand Identity (الهوية النواجهية الثابتة)

- **Primary Product Name:** **وَيْنَه؟** (Arabic-first RTL)
- **Supporting Product Name:** **WAYNAH**
- **Brand Umbrella:** **M.GH.AL**
- **Brand Logo (`WaynahLogo`):** Fixed vector SVG symbol inspired by the abstract Arabic letter 'و' transitioning into a location coordinate node / direction path, with a subtle question mark `؟` dot accent.
- **Logo Invariant:** Changing the theme accent or light/dark mode **MUST NOT** alter the shape, geometry, or iconography of the logo.

---

## E — Multi-Theme Token System

Design tokens are driven by CSS custom properties `--color-primary-50` through `--color-primary-900` mapped to Tailwind `primary-*`:

### Supported Accent Palettes:
1. **WAYNAH Teal (Default):** `#0F766E`
2. **Ocean Blue:** `#0284C7`
3. **Indigo:** `#4F46E5`
4. **Emerald:** `#059669`
5. **Rose:** `#E11D48`
6. **Amber:** `#D97706`

### Supported Modes:
- **Light Mode (`data-theme="light"`):** Crisp, serene, high-contrast.
- **Dark Mode (`data-theme="dark"`):** Slate dark theme (`#0f172a` bg, `#1e293b` surface), preserving the **Calm Local Atlas** aesthetic without any gaming/neon aesthetics.
- **Persistence:** Selected theme accent and mode are persisted in `localStorage` under `waynah_theme_accent` and `waynah_theme_mode`.

---

## F — UX Principles

1. **Discovery First:** The user interface is designed for discovery of places and services, not data administration.
2. **Trust & Provenance:** Trust is built on explicit evidence and clear sources, avoiding arbitrary percentage scores.
3. **Explicit Uncertainty:** Uncertain, stale, or conflicting information is displayed calmly and clearly.
4. **Low-Bandwidth Fallback:** Text-first usability is primary; map tiles are supplementary.
5. **Calm Local Atlas Aesthetics:** Clean typography, subtle map contour patterns, clear hierarchy, zero decorative clutter.

---

## G — Domain UX Invariants (قواعد المجال الثابتة)

- **Place ≠ Business:** A Place is a physical spatial coordinate; a Business is a legal/commercial entity.
- **Business ≠ Branch:** A Business owns zero or more operational Branches.
- **Branch = Operational Presence:** A Branch links a Business to a physical Place.
- **Claim ≠ Truth:** Information provided by sources represents a claim until verified.
- **Review ≠ Factual Claim:** User feedback is separate from factual spatial verification.
- **Phone ≠ Identity Proof:** A phone number is a contact channel, not a proof of place identity.
- **P-Code ≠ Postal Code:** Geographic P-codes are spatial location identifiers, not postal mailing codes.
- **Current State ≠ History:** Historical confirmation context is preserved alongside current operational state.

---

## H — Low-Bandwidth Principle

- **Map = Supplementary.**
- **Text List & Search = Primary.**
- When map tiles are unavailable, disabled, or offline, the entire discovery experience remains 100% operational text-first.

---

## I — Prototype Scope & Limitations

- **Data Scope:** All data presented across the prototype is mock demo data (`[بيانات تجريبية]`) centered around Yemen (Abs, Hajjah, Sana'a, Aden).
- **Backend Scope:** UI state transitions and form submissions operate strictly in-memory / local React state.
- **Production Non-Interference:** Prototype V1 contains NO production database tables, Prisma migrations, Auth/RBAC logic, or production API backend implementations.

---

## PRODUCTION HANDOFF NOTE

> Prototype V1 has passed internal usability review and is now the visual and interaction reference for Production Engineering.
>
> Production implementation must preserve the approved UX principles and domain boundaries while allowing engineering decisions to be made independently where required.

---

**WAYNAH — PROTOTYPE V1 BASELINE ESTABLISHED**
