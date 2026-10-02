# WAYNAH — PHASE 3 DOMAIN MODEL MASTER STUDY (V1.1)

> **PROJECT:** WAYNAH (وينه؟ — Geographic Discovery & Local Trust Platform)  
> **BRAND UMBRELLA:** M.GH.AL  
> **OPERATIONAL GEOGRAPHY:** Hajjah Governorate, Yemen (Initial Operational Geography) — Extensible Across Yemen  
> **DOCUMENT ID:** WAYNAH_PHASE_3_DOMAIN_MODEL_STUDY_V1_1  
> **REFERENCE DATE:** 1 October 2026  
> **PHASE STATUS:** PHASE 3 — READY FOR FINAL INDEPENDENT REVIEW  
> **PREVIOUS PHASES:** PHASE 1 — CLOSED | PHASE 2 — CLOSED  
> **BOUNDARIES:** ZERO Source Code Changes | ZERO Schema/Database Changes | ZERO API Changes | ZERO Implementation  
> **AUDIT TRAIL & LINEAGE:**  
> This V1.1 document represents a formal structural normalization pass over V1.0 (`WAYNAH_PHASE_3_DOMAIN_MODEL_STUDY_V1.md`). It harmonizes entity definitions, value concepts, domain events, relationship cardinalities, claim dimensions, lifecycle semantics, aggregate candidates, and bounded context boundaries while strictly eliminating architectural and technical lock-in.

---

## 1. EXECUTIVE SUMMARY

This document constitutes the normalized **Phase 3 Domain Model Master Study (V1.1)** for the WAYNAH platform.

Building directly upon the closed foundations of **Phase 1 (Security & Codebase Safety Gate)** and **Phase 2 (Domain, Real-World, and Operational Logic Validation Study V1.1)**, this study translates domain realities, operational patterns, and business logic into a formal, systematic **Domain Model**.

The primary objective of Phase 3 is to establish pure conceptual domain boundaries, entity definitions, value concepts, relationship matrices, domain invariants, lifecycle concepts, domain events, aggregate candidates, and candidate bounded contexts. 

WAYNAH is a **geographic discovery and local trust platform** tailored to the socio-geographic, infrastructure, and operational realities of **Hajjah Governorate, Yemen**, while remaining fully extensible across all 22 governorates of Yemen.

### 1.1 Core Domain Thesis Preserved in Phase 3
WAYNAH models the real world as it exists on the ground in Hajjah, Yemen:
* Physical locations exist independently of commercial businesses (`Place ≠ Business`).
* Commercial entities operate through distinct physical or virtual operational units (`Business ≠ Branch`).
* Service providers execute work across physical or field areas (`Provider ≠ Business`, `Provider ≠ Place`).
* Service offerings represent intangible execution capabilities, not physical commodities (`Service Offering ≠ Product`).
* Truth is not a static boolean flag; it consists of scoped, temporal claims backed by evidence and provenance (`Claim ≠ Truth`, `Verification ≠ Permanent Truth`).
* Human experience and subjective ratings are strictly decoupled from objective factual data (`Review ≠ Factual Truth`).
* Real-world identity and location descriptions are grounded in physical landmarks and local vernacular, not hard-coded database keys (`Address Description ≠ Single Text Field`, `Phone Number ≠ Immutable Identity`).

---

## 2. PHASE SCOPE & PROJECT ALIGNMENT

### 2.1 Project Phase Sequence
WAYNAH strictly adheres to a sequential, gated domain and system engineering process:

```
Phase 1: Security & Codebase Safety Gate ──► [CLOSED]
  └── Phase 2: Domain / Real-World Logic Validation (V1.1) ──► [CLOSED]
       └── Phase 3: Domain Model Master Study (V1.1) ──► [CURRENT PHASE - READY FOR FINAL INDEPENDENT REVIEW]
            └── Phase 4: System Architecture (Tech Stack, Storage, APIs) ──► [NEXT PHASE - NOT STARTED]
                 └── Phase 5: UX/UI Design System ──► [FUTURE PHASE]
                      └── Phase 6+: Engineering, Implementation & Validation ──► [FUTURE PHASE]
```

> **HARD ARCHITECTURAL BOUNDARY**: Phase 3 is strictly a conceptual domain modeling phase. It does NOT define database tables, Prisma models, SQL types, API routes, UI components, storage boundaries, or search engine indexes. Phase 4 (System Architecture) remains a completely separate future phase.

### 2.2 Functional Scope Definition `[DOMAIN DECISION]`

| System Scope Dimension | Included in WAYNAH Domain Scope | Explicitly Excluded from Scope | Classification |
|---|---|---|---|
| **Core Purpose** | Spatial discovery, local operational presence, multi-source trust verification. | E-Commerce inventory, shopping carts, checkout engines. | `[DOMAIN DECISION]` |
| **Geographic Model** | Administrative hierarchy, landmark anchors, dual-layer descriptive addressing. | Global generic address standardization (postal codes/street numbers). | `[DOMAIN DECISION]` |
| **Operational Model** | Storefronts, shared market stalls, mobile technicians, duty services, field areas. | Platform-managed delivery driver fleets or freight carrier liability. | `[DOMAIN DECISION]` |
| **Trust Model** | Scoped attribute claims, source provenance, evidence audit logs, dispute tracking. | Single boolean `verified: true` flags or unverified instant overwrites. | `[DOMAIN DECISION]` |
| **Community Model** | Moderated citizen reports, experience reviews, verified field observations. | Unmoderated social feeds, public messaging forums, direct peer chat. | `[DOMAIN DECISION]` |

---

## 3. MODELING PRINCIPLES

Phase 3 is governed by 12 mandatory real-world domain modeling principles:

1. **Real-World Reality First `[DOMAIN DECISION]`**: The domain model reflects physical geography, local operating habits, and field conditions in Hajjah, Yemen—not software framework convenience.
2. **Place ≠ Business `[DOMAIN DECISION]`**: A physical place is a spatial location; a business is an operating organization. Places exist without businesses; businesses exist without public places.
3. **Business ≠ Branch `[DOMAIN DECISION]`**: A business is an organizational umbrella; a branch is an operational unit with specific hours, staff, contact, and location.
4. **Provider ≠ Business `[DOMAIN DECISION]`**: A provider is an individual or team executing services; a business is a commercial entity. Independent providers operate without commercial storefronts.
5. **Provider ≠ Place `[DOMAIN DECISION]`**: Human providers move between locations or operate across field areas; they are not fixed buildings.
6. **Service Offering ≠ Product `[DOMAIN DECISION]`**: A service offering is an intangible action performed under temporal and spatial conditions; a product is a physical commodity unit.
7. **Claim ≠ Truth `[DOMAIN DECISION]`**: Information consists of asserted attributes from specific sources. Claims may be conflicting, outdated, or unverified.
8. **Claim ≠ Review `[DOMAIN DECISION]`**: Factual attribute claims (e.g. "Open 24/7") are distinct from subjective opinion reviews (e.g. "Great customer service").
9. **Review ≠ Factual Truth `[DOMAIN DECISION]`**: User reviews express personal experience sentiment and must never automatically alter factual data attributes.
10. **Current State ≠ History `[DOMAIN DECISION]`**: System entities mutate over time. Current state is the active view; historical state events are preserved immutably.
11. **Address Description ≠ Single Text Field `[DOMAIN DECISION]`**: Addressing combines administrative context, coordinates, spatial landmarks, and local directional descriptions.
12. **Phone Number ≠ Immutable Identity `[DOMAIN DECISION]`**: Phone numbers are mutable contact attributes; they can be ported, transferred, or shared.

---

## 4. DOMAIN TAXONOMY — STRICT

Every material statement in this Phase 3 study strictly belongs to exactly one of the five normalized taxonomy categories:

* **`[FACT]`**: Verified or authoritative external or domain fact applicable to the stated reference period (e.g., administrative structure of Yemen, UN OCHA place code standards).
* **`[ASSUMPTION]`**: Working contextual assumption derived from local operational understanding (e.g., WhatsApp usage prevalence among commercial shops).
* **`[HYPOTHESIS]`**: Candidate domain model, rule, or heuristic requiring future empirical or technical validation (e.g., spatial duplicate candidate matching radius).
* **`[DOMAIN DECISION]`**: Locked conceptual domain rule for the WAYNAH platform model.
* **`[UNKNOWN / VALIDATION REQUIRED]`**: Unresolved decision or missing empirical dataset explicitly flagged for future validation (e.g., specific sub-district Uzlah gazetteer coverage).

---

## 5. FIVE MODELING LEVELS & CANONICAL DOMAIN ELEMENTS

To eliminate architectural ambiguity, Phase 3 strictly categorizes domain concepts into **Five Explicit Modeling Levels**:

```text
FIVE DOMAIN MODELING LEVELS
├── A. Domain Entities (Independent domain identity & continuity over time)
├── B. Value Concepts (Attribute structures describing entities; no independent identity)
├── C. Domain Events (Record of domain state change or real-world operational occurrence)
├── D. Candidate Aggregates (Candidate consistency boundaries grouping domain objects)
└── E. Candidate Bounded Contexts (Candidate domain language & responsibility boundaries)
```

### 5.1 Canonical List of 18 Core Domain Entities `[DOMAIN DECISION]`

Phase 3 defines exactly **18 Canonical Core Domain Entities**:

```
CANONICAL DOMAIN ENTITIES (18 TOTAL)
├── Geographic Cluster (5): Governorate, District, Uzlah, Village / Neighborhood, Landmark
├── Physical Place Cluster (1): Place
├── Operating Presence Cluster (3): Business, Branch, Provider
├── Service Capability Cluster (1): Service Offering
├── Trust & Provenance Cluster (4): Claim, Evidence, Verification Record, Data Source
└── Community & Identity Cluster (4): Review, User Contribution, Duplicate Candidate, Entity Alias
```

1. **Governorate (`[FACT]`)**: Top-level administrative region of Yemen establishing regional context (e.g., Hajjah Governorate).
2. **District (`[FACT]`)**: Primary municipal administrative division (31 districts in Hajjah).
3. **Uzlah / Sub-District (`[FACT]`)**: Administrative sub-division below district level (coverage dataset-dependent `[UNKNOWN / VALIDATION REQUIRED]`).
4. **Village / Neighborhood (`[FACT]`)**: Local settlement center or urban quarter (*قرية / حارة*).
5. **Landmark (`[DOMAIN DECISION]`)**: Physical reference anchor essential for human navigation (*دوار / صوامع / جامع*).
6. **Place (`[DOMAIN DECISION]`)**: Canonical, discoverable physical location with spatial coordinates and physical site presence.
7. **Business (`[DOMAIN DECISION]`)**: Commercial, institutional, or organizational entity possessing trade identity and governance authority.
8. **Branch (`[DOMAIN DECISION]`)**: Specific physical or operational unit of a Business managing local presence, schedules, and staff.
9. **Provider (`[DOMAIN DECISION]`)**: Individual skilled actor, professional team, or operator executing services.
10. **Service Offering (`[DOMAIN DECISION]`)**: Intangible capability offered by a Provider or Branch under specific spatial and temporal conditions.
11. **Claim (`[DOMAIN DECISION]`)**: Asserted statement regarding an attribute value of an entity, bound to a source, timestamp, and scope.
12. **Evidence (`[DOMAIN DECISION]`)**: Supporting proof artifact validating a Claim.
13. **Verification Record (`[DOMAIN DECISION]`)**: Formal decision artifact recording an evaluation of Claims against Evidence for a specific scope.
14. **Data Source (`[DOMAIN DECISION]`)**: Originator of data inputs (Official Import, Field Agent, Business Owner, Citizen Contributor).
15. **Review (`[DOMAIN DECISION]`)**: Subjective user evaluation reporting personal experience sentiment regarding an eligible target.
16. **User Contribution (`[DOMAIN DECISION]`)**: Suggested edit, new place submission, or operational status flag generated by a citizen.
17. **Duplicate Candidate (`[DOMAIN DECISION]`)**: Domain pair structure representing potential duplicate match between two candidate entities.
18. **Entity Alias (`[DOMAIN DECISION]`)**: Alternate historical, vernacular, or transliterated title linked to a canonical entity.

> **NORMALIZATION NOTE**: Concepts such as `Location Reference`, `Address Description`, `Contact Method`, `Schedule`, `Opening Interval`, and `Historical Event` are explicitly categorized as **Value Concepts** or **Domain Events**, NOT Core Domain Entities.

---

## 6. ENTITY RESPONSIBILITIES

| Core Entity | Primary Domain Responsibility | Entity Boundary & Scope | Lifecycle Owner |
|---|---|---|---|
| **Governorate** | Maintains top-level administrative regional boundary and context. | Authoritative regional reference context. | Official Reference Data `[FACT]` |
| **District** | Defines municipal boundary, administrative P-code, and discovery zone. | Official district context (31 in Hajjah). | Official Reference Data `[FACT]` |
| **Uzlah / Sub-District** | Provides sub-district administrative mapping where available. | Dataset-dependent sub-district layer. | Reference Data Ingestion `[FACT]` |
| **Village / Neighborhood** | Identifies local neighborhood or rural settlement center. | Descriptive settlement context. | Reference Data Ingestion `[FACT]` |
| **Landmark** | Serves as human navigation anchor for descriptive addressing. | Physical landmark reference point. | Community / Field Agent `[DOMAIN DECISION]` |
| **Place** | Maintains canonical physical location, spatial pin, and site history. | Physical location (decoupled from Business). | System / Field Data Triage `[DOMAIN DECISION]` |
| **Business** | Manages trade identity, brand, ownership claims, and overall policy. | Commercial / organizational identity. | Business Owner / Manager `[DOMAIN DECISION]` |
| **Branch** | Manages local storefront operation, operating hours, and local contacts. | Operational unit of a Business. | Branch Manager / Owner `[DOMAIN DECISION]` |
| **Provider** | Manages individual service execution capabilities and mobility coverage. | Human actor / execution team. | Provider Actor `[DOMAIN DECISION]` |
| **Service Offering** | Defines service scope, execution mode, availability, and pricing context. | Intangible execution capability. | Branch / Provider `[DOMAIN DECISION]` |
| **Claim** | Encapsulates single attribute assertion with source, time, and confidence. | Scoped attribute statement. | Data Source Originator `[DOMAIN DECISION]` |
| **Evidence** | Stores proof artifacts verifying attribute claims. | Verification proof metadata. | Field Agent / Reviewer `[DOMAIN DECISION]` |
| **Verification Record** | Records explicit verification decision, scope, reviewer, and expiry. | Scoped verification decision. | Verification Reviewer `[DOMAIN DECISION]` |
| **Data Source** | Tracks provenance authority, reliability tier, and source lineage. | Originating source identity. | System Governance `[DOMAIN DECISION]` |
| **Review** | Stores citizen subjective feedback, ratings, and experience reports. | Subjective sentiment (Review ≠ Fact).| Citizen Contributor `[DOMAIN DECISION]` |
| **User Contribution** | Captures crowdsourced submissions prior to verification triage. | Unverified edit candidate. | Citizen Contributor `[DOMAIN DECISION]` |
| **Duplicate Candidate** | Holds similarity signals pairing two candidate entities. | Potential duplicate pair record. | Resolution Engine / Triage `[DOMAIN DECISION]` |
| **Entity Alias** | Retains alternate names, vernacular titles, and historical titles. | Name lookup redirect alias. | System Resolution `[DOMAIN DECISION]` |

---

## 7. IDENTITY MODEL

### 7.1 Stable Internal Domain Identifier `[DOMAIN DECISION]`
WAYNAH mandates that every domain entity possesses a **Stable Internal Domain Identifier**. 
* **Implementation Neutrality**: The identity is stable and unique within the domain. Technical serialization formats (e.g. UUID, ULID, bigint) are deferred to Phase 4 System Architecture (`[HYPOTHESIS]`).
* **Non-Identity Attributes (`[DOMAIN DECISION]`)**: Phone numbers, human-readable names, spatial coordinates, UN OCHA P-codes, and commercial registration numbers are mutable attributes or reference codes, NEVER immutable entity identities.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WAYNAH IDENTITY MODEL                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ STABLE DOMAIN IDENTIFIER                                                        │
│ • Internal Domain ID: Stable, implementation-neutral entity key                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MUTABLE ATTRIBUTES & REFERENCES (NEVER ENTITY IDENTITY)                         │
│ • Phone Number: Mutable contact channel (Can be ported, assigned, or shared)    │
│ • Human-Readable Name: Transliterated, local, or commercial name (Can mutate)   │
│ • Spatial Coordinates: Physical location (Can change on relocation)             │
│ • P-Code: UN OCHA geographic place code (External place code)                   │
│ • Commercial License: Government registration number (Attribute claim)           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Entity Type Identity Decoupling `[DOMAIN DECISION]`
* **Place Identity**: Identifies the physical spatial location. If a branch relocates, Place ID remains at the physical site; Branch receives a new Place link.
* **Business Identity**: Identifies the trade/corporate organization. Remains constant across re-branding or opening/closing branches.
* **Branch Identity**: Identifies a specific operational site of a Business. Tied to 1 Business and 0..1 Place.
* **Provider Identity**: Identifies a human service actor or team. Independent of physical storefronts.

### 7.3 Geographic Identification & P-Codes
* **P-codes (`[FACT]`)**: Standardized UN OCHA place identification codes represent geographic administrative place codes, NOT postal codes.
* **Specific P-Code Mappings (`[UNKNOWN / VALIDATION REQUIRED]`)**: Mappings of specific string codes to individual districts require verification against official COD-AB release files prior to dataset ingestion.

---

## 8. RELATIONSHIP MODEL

The matrix below defines all primary domain entity relationships, cardinalities, lifecycle implications, and classifications:

| Source Entity | Relationship | Target Entity | Cardinality | Business Meaning | Lifecycle & Provenance Implications | Classification |
|---|---|---|---|---|---|---|
| **Governorate** | Contains | **District** | 1 ── * | Governorate comprises administrative districts. | District cannot exist without Governorate. | `[FACT]` |
| **District** | Contains | **Uzlah** | 1 ── 0..* | District contains administrative sub-districts. | Uzlah coverage dataset-dependent. | `[FACT]` |
| **Uzlah** | Contains | **Village** | 1 ── 0..* | Uzlah contains villages/quarters. | Optional administrative level. | `[FACT]` |
| **Place** | Anchored in | **District** | 1 ── 1 | Place has primary administrative geographic context.| Boundary ambiguity preserved when applicable.| `[DOMAIN DECISION]` |
| **Place** | Refers to | **Landmark** | * ── 0..* | Place references nearby physical landmarks. | Landmark reference assists human navigation. | `[DOMAIN DECISION]` |
| **Place** | Hosts | **Business** | 1 ── 0..* | Place hosts 0, 1, or multiple Businesses. | Multi-tenant places (souk/building) supported. | `[DOMAIN DECISION]` |
| **Business** | Operates | **Branch** | 1 ── 0..* | Business operates 0 or more Branches. | Business can exist before local branch opens. | `[DOMAIN DECISION]` |
| **Branch** | Located at | **Place** | * ── 0..1 | Branch occupies a physical Place (if fixed). | Mobile branch has no fixed Place link (`0..1`).| `[DOMAIN DECISION]` |
| **Provider** | Associated with | **Business** | * ── 0..* | Provider operates independently or with Businesses.| Provider can be independent or employed actor.| `[DOMAIN DECISION]` |
| **Branch** | Offers | **Service Offering** | 1 ── 0..* | Branch provides specific service capabilities. | Deactivating Branch disables Branch services. | `[DOMAIN DECISION]` |
| **Provider** | Offers | **Service Offering** | 1 ── 0..* | Independent Provider offers field services. | Provider mobility defines service area. | `[DOMAIN DECISION]` |
| **Entity** | Subject of | **Claim** | 1 ── 0..* | Attributes of an entity are asserted via Claims. | Entity can exist prior to claim assertion (`0..*`).| `[DOMAIN DECISION]` |
| **Claim** | Backed by | **Evidence** | 1 ── 0..* | Claim supported by optional evidence proof artifacts.| Provenance mandatory; supporting evidence optional.| `[DOMAIN DECISION]` |
| **Claim** | Issued by | **Data Source** | * ── 1 | Claim traces directly to originating Source. | Source authority influences triage. | `[DOMAIN DECISION]` |
| **Eligible Target**| Evaluated by | **Review** | 1 ── 0..* | Place, Business, Branch, Service receive reviews. | Reviews NEVER modify factual claims directly. | `[DOMAIN DECISION]` |
| **Entity** | Contacted via | **Contact Method** | 1 ── 0..* | Entity reached via contact methods (Value Concept).| Phone is contact method, not entity ID. | `[DOMAIN DECISION]` |
| **Branch** | Operates on | **Schedule** | 1 ── 0..* | Branch operates under Schedule (Value Concept). | Schedule types handle split shifts/Ramadan. | `[DOMAIN DECISION]` |
| **Entity** | Known as | **Entity Alias** | 1 ── 0..* | Entity possesses vernacular/alternate titles. | Aliases preserved during record merges. | `[DOMAIN DECISION]` |
| **Duplicate Candidate**| Pairs | **Candidate Entity**| 1 ── 2 | Pairs candidate Entity A and candidate Entity B. | Duplicate resolution must be domain-reversible.| `[DOMAIN DECISION]` |

---

## 9. VALUE CONCEPTS

Phase 3 explicitly identifies 13 **Value Concepts**—structured domain attributes that express specific properties without requiring independent aggregate identity:

1. **Coordinates `[DOMAIN DECISION]`**: Mathematical point (WGS84 Latitude, Longitude, Accuracy Radius in meters).
2. **Address Description `[DOMAIN DECISION]`**: Human-readable descriptive location string ("Near Abs Roundabout, South of Grain Silos").
3. **Contact Method `[DOMAIN DECISION]`**: Structured contact attribute (Type: Mobile/Landline/WhatsApp, Value, IsShared, Priority).
4. **Phone Number `[DOMAIN DECISION]`**: Standardized digit string, country code (`+967`), operator prefix context.
5. **Messaging Channel Contact `[DOMAIN DECISION]`**: Mobile contact identifier formatted for messaging applications (e.g. WhatsApp).
6. **Opening Interval `[DOMAIN DECISION]`**: Time window boundary (Start Time, End Time, Shift Index: Morning/Evening).
7. **Schedule Rule `[DOMAIN DECISION]`**: Structural schedule metadata (Schedule Type, Operating Days, Seasonal Window).
8. **Service Delivery Mode `[DOMAIN DECISION]`**: Execution mode enum (In-Branch, Customer Site, Mobile Field Area, Remote Digital).
9. **Verification Scope `[DOMAIN DECISION]`**: Attribute-level scope boundary (Attribute Name, Authority Tier Concept, Expiry Date).
10. **Evidence Locator `[DOMAIN DECISION]`**: Artifact locator reference (Collection Method, Collector Ref, Timestamp).
11. **Confidence Assessment Context `[DOMAIN DECISION]`**: Evaluated trust metadata (Confidence Context, Corroborating Sources, Conflict Flag).
12. **Local Vernacular Name `[DOMAIN DECISION]`**: Vernacular title (Language Code, Name Type: Official/Vernacular/Transliterated, String).
13. **Operating Status Descriptor `[DOMAIN DECISION]`**: Operational state descriptor (State Enum, Reason Code, Effective Timestamp).

---

## 10. GEOGRAPHIC MODEL

### 10.1 Administrative Hierarchy `[FACT]`
WAYNAH anchors discovery in the official administrative geography of Yemen:

$$\text{Yemen (الجمهورية اليمنية)} \longrightarrow \text{Governorate (محافظة)} \longrightarrow \text{District (مديرية)}$$

* **Governorate → District (`[FACT]`)**: Authoritative administrative relationship across official Yemen gazetteers (Hajjah Governorate contains 31 districts).
* **District → Uzlah → Village (`[FACT]`)**: Sub-district administrative structures exist in official gazetteers, but dataset completeness below district level varies and remains validation-dependent (`[UNKNOWN / VALIDATION REQUIRED]`).

### 10.2 Spatial Anchors & Gazetteers
* **P-codes (`[FACT]`)**: Standardized UN OCHA place identification codes provide geographic reference codes.
* **Landmark Anchors (`[DOMAIN DECISION]`)**: Major physical landmarks (mountain passes, market roundabouts, central mosques) serve as spatial anchors for human orientation.
* **Grid Codes (`[DOMAIN DECISION]`)**: Optional supplementary spatial codes used where formal street names are absent.

---

## 11. ADDRESS MODEL

### 11.1 Layered Address Architecture `[DOMAIN DECISION]`
Because formal street/building addressing is incomplete or absent across many Yemeni districts `[ASSUMPTION]`, WAYNAH mandates a **Layered Address Representation**:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LAYERED ADDRESS MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: MATHEMATICAL & ADMINISTRATIVE SPATIAL ANCHOR                           │
│ • Geographic Coordinates: WGS84 Latitude & Longitude (where available)          │
│ • Administrative Context: Governorate Name & District Administrative P-code    │
│ • Optional Spatial Grid Code: Alphanumeric location code                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: HUMAN-READABLE LOCAL DESCRIPTIVE ADDRESS                               │
│ • Administrative Hierarchy: Governorate, District, Uzlah/Village (if available) │
│ • Primary Landmark Reference: "50 meters South of the Central Grain Silos"      │
│ • Orientation Indicator: "Opposite Al-Hikmah Pharmacy, East side of main street"│
│ • Physical Access Description: "Unpaved road accessible by standard vehicles"   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. PLACE MODEL

### 12.1 Definition & Purpose `[DOMAIN DECISION]`
A **Place** is a canonical, discoverable, real-world physical location possessing spatial coordinates and physical site presence.

### 12.2 Decoupling Place from Business
```text
Place ≠ Business `[DOMAIN DECISION]`
```
* **Places Without Businesses**: Historic sites (*قلعة القاهرة*), public squares (*سوق ميدان*), municipal parks, public water points.
* **Businesses Without Public Places**: Mobile solar repair technicians, home-based bakeries, field towing services.
* **Multi-Tenant Places**: Commercial centers (*عمارة تجارية*) or souk grounds (*سوق عبس*) hosting dozens of independent shops.

### 12.3 Relocation Semantics `[DOMAIN DECISION]`
When an operational branch relocates:
$$\text{Business} \longrightarrow \text{Branch} \longrightarrow \text{Place}$$
1. The `Branch` entity updates its active relationship link to point to a new `Place` entity.
2. The `Business` identity and `Branch` identity remain completely stable.
3. The original `Place` entity remains unchanged in the spatial registry (it may later host a different business).
4. The historical transition is preserved in the domain audit event stream (`BranchMoved` event).

---

## 13. BUSINESS MODEL

### 13.1 Identity & Governance `[DOMAIN DECISION]`
A **Business** represents the commercial, trade, or organizational entity. It encapsulates brand identity, ownership authority, legal/informal registration, and overall operational policy.

### 13.2 Operating Patterns `[DOMAIN DECISION]`

```mermaid
graph TD
    Biz[Business Entity] --> Single[1. Single-Location Shop<br/>1 Business ── 1 Branch ── 1 Place]
    Biz --> Multi[2. Multi-Branch Enterprise<br/>1 Business ── N Branches ── N Places]
    Biz --> MobileBiz[3. Mobile / Field Business<br/>1 Business ── 1 Branch ── 0 Fixed Place]
    Biz --> Shared[4. Multi-Tenant Souk Stall<br/>N Businesses ── N Branches ── 1 Shared Place]
```

---

## 14. BRANCH MODEL

### 14.1 Why Branch is an Independent Entity `[DOMAIN DECISION]`
A **Branch** is a distinct operational unit of a Business. It is required as an independent domain concept because:
* A business with 3 branches in Hajjah City, Abs, and Haradh has 3 distinct operating schedules, local phone numbers, local managers, and physical locations.
* Closing one branch does not close the parent Business.
* Relocating one branch affects only that branch's Place link.

---

## 15. PROVIDER MODEL

### 15.1 Provider Definition & Profiles `[DOMAIN DECISION]`
A **Provider** is a service-capable actor (individual skilled technician or execution team). 

$$\text{Provider} \neq \text{Business} \quad \text{and} \quad \text{Provider} \neq \text{Place} \quad \text{`[DOMAIN DECISION]`}$$

The 6 provider types represent **illustrative operational profiles** `[DOMAIN DECISION]`, not a rigid mutually exclusive enum:
1. **Independent Freelancer**: Skilled technician operating without a storefront.
2. **Sole Proprietorship**: Owner-operated single workshop or shop.
3. **Multi-Branch Enterprise Profile**: Corporate chain operator.
4. **Government Entity Profile**: Public hospital or civil defense post.
5. **NGO / Humanitarian Profile**: Relief agency operating health units.
6. **Informal / Street Operator**: Mobile vendor or seasonal market seller.

---

## 16. SERVICE OFFERING MODEL

### 16.1 Service Offering Concept `[DOMAIN DECISION]`
A **Service Offering** is an intangible execution capability performed for a customer under specific spatial and temporal conditions.

$$\text{Service Offering} \neq \text{Product} \quad \text{`[DOMAIN DECISION]`}$$

### 16.2 Service Delivery Modes `[DOMAIN DECISION]`

```mermaid
graph TD
    Modes[Service Delivery Modes] --> Fixed[1. In-Branch / Fixed Site<br/>Customer visits Branch/Place]
    Modes --> Home[2. Customer Site / Home<br/>Provider travels to Customer]
    Modes --> Mobile[3. Mobile / Field Area<br/>Provider operates in District radius]
    Modes --> Remote[4. Remote / Digital<br/>Executed via Telecommunications]
```

---

## 17. CONTACT MODEL

### 17.1 Multi-Channel Contact Structure `[DOMAIN DECISION]`
Contact methods are modeled as multi-entry attribute collections:
* **Mobile Phone (`[DOMAIN DECISION]`)**: Primary voice channel (Yemeni mobile networks).
* **Landline Phone (`[FACT]`)**: Fixed regional landline (Historical ITU plan identifies Hajjah geographic area code as `7`). Local display or dialing formatting (e.g. `07`) is a display format, not the canonical numbering-plan value.
* **Messaging Channel (`[ASSUMPTION]`)**: Contact identifier for business messaging applications (e.g. WhatsApp).
* **Physical Contact Point (`[DOMAIN DECISION]`)**: Designated reception desk or physical inquiry point.

### 17.2 Telecom Operator Context & Numbering Plan
* **Historical Telecom Plan (`[FACT]`)**: 77x (Yemen Mobile), 73x (You/MTN), 71x (SabaFon), 70x (Y Telecom), Area code 7.
* **Current 2026 Prefix Assignments (`[UNKNOWN / VALIDATION REQUIRED]`)**: Active prefix routing and number portability rules require authoritative validation.
* **Prefix Identity Rule (`[DOMAIN DECISION]`)**: Phone numbers are contact attributes, NEVER immutable entity keys.

---

## 18. SCHEDULE MODEL

### 18.1 Schedule Structure Typology `[DOMAIN DECISION]`
Operating hours reflect Yemeni operational realities via 7 structured schedule types:

```mermaid
graph TD
    Sched[Schedule Typology] --> S1[1. 24/7 Continuous<br/>Hospitals, Duty Pharmacies]
    Sched --> S2[2. Split Shift<br/>Morning + Evening shifts]
    Sched --> S3[3. Ramadan Schedule<br/>Post-Iftar night shift]
    Sched --> S4[4. Seasonal / Weather<br/>Tihama summer hours]
    Sched --> S5[5. Appointment / On-Call<br/>Mobile technicians]
    Sched --> S6[6. Temporary Closure<br/>Fuel/Power interruption]
    Sched --> S7[7. Unknown / Fluid<br/>Informal market sellers]
```

> **DOMAIN RULE**: Universal opening times MUST NOT be hard-coded (`[DOMAIN DECISION]`). Exact hour strings (e.g. 08:00–12:30) are user/provider data claims (`[HYPOTHESIS]`), NOT system constants.

---

## 19. CLAIM / EVIDENCE / PROVENANCE MODEL

### 19.1 Provenance Model Architecture `[DOMAIN DECISION]`
Truth in WAYNAH is modeled as a multi-source, time-stamped, scoped claim structure:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      CLAIM / EVIDENCE / PROVENANCE FLOW                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Target Entity ──► Claim (Asserted Attribute + Scope + Value)                    │
│                    ├── Originating Data Source (Gov Import, Agent, Owner, User) │
│                    ├── Timestamp & Temporal Validity Window                     │
│                    ├── Optional Supporting Evidence Artifacts (Photos, Docs)    │
│                    └── Verification Decision (Scoped Authority Evaluation)      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 19.2 Dimensional Claim Status Model `[DOMAIN DECISION]`
Rather than a single mutually exclusive state enum, a Claim is evaluated across **Four Conceptual Dimensions**:
1. **Temporal Dimension**: `current` vs. `expired / outdated`.
2. **Resolution Dimension**: `active` vs. `superseded`.
3. **Conflict Dimension**: `uncontested` vs. `conflicting`.
4. **Evidence Dimension**: `supported` vs. `insufficient evidence`.

$$\text{Claim} \neq \text{Truth} \quad \text{and} \quad \text{Verification} \neq \text{Permanent Truth} \quad \text{`[DOMAIN DECISION]`}$$

> **PROVENANCE INVARIANT**: Claims require provenance/source attribution and temporal context (`[DOMAIN DECISION]`). Supporting evidence may be attached where available or required by specific verification policies (`[DOMAIN DECISION]`).

---

## 20. TRUST / VERIFICATION MODEL

### 20.1 Scoped Verification vs. Single Boolean `[DOMAIN DECISION]`
WAYNAH explicitly rejects the single boolean flag (`verified: true`). Verification is always **scoped to specific attributes, evidence quality, source authority, and temporal validity**:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SCOPED VERIFICATION RECORD                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Target Entity: Al-Shifa Pharmacy (Branch ID: BR-1042)                           │
│ Verified Attribute Scope: Physical Location Coordinates & 24/7 Duty Schedule   │
│ Evidence Artifact: Field Agent Inspection Photo + Health Syndicate List        │
│ Verification Authority: Level 2 Field Triage Reviewer                           │
│ Effective Date: 1 October 2026 | Expiry Date: 1 April 2027                      │
│ Unverified Attributes: WhatsApp Phone Number (Pending Owner Verification)        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 21. LIFECYCLE MODEL BY DOMAIN TYPE

### 21.1 Domain-Specific Candidate Lifecycles `[HYPOTHESIS]`
Because physical places do not "relocate" or "close" like commercial businesses, WAYNAH separates candidate lifecycles by domain object type:

```text
CANDIDATE LIFECYCLES BY DOMAIN TYPE:
├── 1. Place Lifecycle: discovered ──► active / reference ──► deprecated / retired
├── 2. Branch Lifecycle: discovered ──► unverified ──► active ──► temporarily unavailable ──► moved / closed
├── 3. Business Lifecycle: discovered ──► active ──► inactive / closed
└── 4. Service Offering Lifecycle: proposed ──► active ──► unavailable / retired
```

---

## 22. DOMAIN EVENTS

Phase 3 defines candidate domain events categorized by functional scope:

| Event Name | Event Category | Operational Description | Provenance & Audit Impact |
|---|---|---|---|
| **PlaceDiscovered** | Domain Event | New physical place observed or ingested. | Initializes spatial registry record. |
| **BusinessCreated** | Domain Event | New commercial/institutional entity registered. | Establishes trade identity umbrella. |
| **BranchOpened** | Domain Event | Operational branch established at a Place. | Links Business to physical site. |
| **BranchMoved** | Domain Event | Branch relocated to a new physical Place. | Updates active Place link; logs relocation.|
| **BranchTemporarilyClosed** | Operational Event | Branch temporarily paused operations. | Flags branch status; updates search. |
| **BranchReopened** | Operational Event | Branch resumed normal operations. | Restores active branch search status. |
| **BusinessPermanentlyClosed** | Operational Event | Business permanently ceased operations. | Archives business profile; preserves history.|
| **ServiceOfferingAdded** | Domain Event | New service capability attached to Branch/Provider.| Expands service availability index. |
| **ServiceOfferingRemoved** | Domain Event | Service capability retired or disabled. | Removes capability from active search. |
| **ContactUpdated** | Domain Event | Phone or contact attribute modified. | Generates attribute update Claim. |
| **ScheduleUpdated** | Domain Event | Operating hours or schedule type altered. | Generates schedule Claim update. |
| **ClaimSubmitted** | Workflow Event | Data claim submitted by source actor. | Enters verification triage queue. |
| **EvidenceAttached** | Workflow Event | Proof artifact associated with a Claim. | Associates additional supporting evidence.|
| **VerificationPerformed** | Workflow Event | Reviewer issued scoped verification decision.| Updates scoped verification record. |
| **ConflictDetected** | Audit Event | Divergent claims asserted for same attribute.| Flags conflict; triggers moderation queue. |
| **DuplicateDetected** | Audit Event | Engine flagged candidate duplicate pair. | Creates Duplicate Candidate record. |
| **EntityMerged** | Resolution Event | Deprecated record merged into Canonical Survivor.| Preserves aliases; redirects lookup. |
| **EntitySeparated** | Resolution Event | Incorrectly merged records split apart. | Domain-reversible unmerge operation. |

> **NOTE**: Domain Events represent conceptual candidate domain occurrences, NOT an event bus architecture implementation.

---

## 23. REVIEW / COMMUNITY MODEL

### 23.1 Strict Domain Separation `[DOMAIN DECISION]`
```text
Review ≠ Claim  and  Review ≠ Factual Truth `[DOMAIN DECISION]`
```
* **User Review**: Subjective user opinion reporting personal experience sentiment (e.g., waiting time, staff politeness, value perception).
* **Factual Claim**: Objective, verifiable data attribute (e.g., physical coordinates, emergency status, phone number).

### 23.2 Review Model Attributes `[HYPOTHESIS]`
A Review comprises: Target Entity Ref (`Place`, `Business`, `Branch`, `Service Offering`), Author Ref, Timestamp, Experience Date, Candidate Rating Scale `[HYPOTHESIS]`, Text Commentary, Moderation Status, and Eligibility Status.

---

## 24. DUPLICATE / RESOLUTION MODEL

### 24.1 Multi-Vector Duplicate Signals `[HYPOTHESIS]`
Duplicate candidate detection evaluates multi-vector similarity signals:
1. Spatial Proximity Vector (Geospatial distance between points).
2. Phonetic Name Vector (Arabic string distance & local transliteration similarity).
3. Contact Vector (Overlapping phone numbers or messaging contacts).
4. Category & Provider Vector (Shared parent organization or provider identity).

### 24.2 Domain Invariants for Entity Resolution `[DOMAIN DECISION]`
* **Reversible Merge (`[DOMAIN DECISION]`)**: Merging duplicate entities preserves the deprecated ID as an Entity Alias redirect. No historical observations are deleted.
* **Reversible Split (`[DOMAIN DECISION]`)**: If two adjacent distinct market stalls were incorrectly merged, an `EntitySeparated` operation restores both entities with full historical lineage intact.
* **Canonical Survivor Selection (`[UNKNOWN / VALIDATION REQUIRED]`)**: Specific policy criteria for selecting the survivor entity between candidate duplicates are deferred to Phase 3/4 validation.

---

## 25. SEARCH DOMAIN MODEL

### 25.1 Discovery Intent Dimensions `[DOMAIN DECISION]`
Citizens search WAYNAH across 6 real-world mental models:
* **Category Intent**: "Open pharmacy in Abs District"
* **Name Intent**: "Al-Shifa Hospital"
* **Proximity Intent**: "Auto repair shop near Abs Roundabout"
* **Service Intent**: "Solar inverter maintenance"
* **Phone Intent**: "Search entity by mobile number 771234567"
* **Local Vernacular Intent**: "وايت ماء" (Water tanker), "سطحة" (Towing truck)

### 25.2 Candidate Search Ranking Factors `[HYPOTHESIS]`
Search evaluation considers 6 candidate ranking factors: Query Relevance, Spatial Proximity, Operational State (Open/Duty), Verification Confidence, Data Freshness, and Category Match.

> **HARD BOUNDARY**: These ranking factors are conceptual inputs only; their priority, weighting, conflict resolution, and ranking algorithm are deferred to future product/engineering validation (`[HYPOTHESIS]`).

---

## 26. OWNERSHIP / CONTRIBUTION / MODERATION MODEL

### 26.1 Conceptual Actor Authority Matrix `[DOMAIN DECISION]`

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│              CONCEPTUAL CAPABILITIES & AUTHORITY RELATIONSHIPS                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ACTOR ROLE           │ READ │ SUBMIT CLAIM │ SUBMIT SELF-CLAIMS │ VERIFY │ GOVERN │
├──────────────────────┼──────┼──────────────┼────────────────────┼────────┼────────┤
│ 1. Public Visitor    │ YES  │ NO           │ NO                 │ NO     │ NO     │
│ 2. Citizen User      │ YES  │ YES          │ NO                 │ NO     │ NO     │
│ 3. Provider Actor    │ YES  │ YES          │ YES                │ NO     │ NO     │
│ 4. Small Shop Owner  │ YES  │ YES          │ YES                │ NO     │ NO     │
│ 5. Multi-Branch Mgr  │ YES  │ YES          │ YES                │ NO     │ NO     │
│ 6. Facility Admin    │ YES  │ YES          │ YES                │ NO     │ NO     │
│ 7. Field Data Agent  │ YES  │ YES          │ NO                 │ NO     │ NO     │
│ 8. Verification Rev  │ YES  │ YES          │ NO                 │ YES    │ NO     │
│ 9. Platform Admin    │ YES  │ YES          │ NO                 │ YES    │ YES    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

> **NOTE**: This matrix defines conceptual domain capabilities and authority relationships. It is NOT a technical RBAC software implementation or API authorization matrix.

---

## 27. DOMAIN INVARIANTS

Phase 3 locks 14 mandatory domain invariants:

1. **Place ≠ Business (`[DOMAIN DECISION]`)**: `Place` identity must remain distinct from `Business` identity.
2. **Provider ≠ Business (`[DOMAIN DECISION]`)**: `Provider` identity must remain distinct from `Business` identity.
3. **Service Offering ≠ Product (`[DOMAIN DECISION]`)**: `Service Offering` is an intangible capability, not a physical commodity unit.
4. **Review ≠ Fact (`[DOMAIN DECISION]`)**: `Review` represents subjective opinion and cannot establish factual data truth.
5. **Phone ≠ Identity (`[DOMAIN DECISION]`)**: A phone number is a contact attribute and cannot serve as immutable entity identity.
6. **Immutable History (`[DOMAIN DECISION]`)**: Historical entity events and observations must never be overwritten or deleted upon entity closure (retention/deletion policies for legal/privacy requirements deferred `[HYPOTHESIS]`).
7. **Reversible Resolution (`[DOMAIN DECISION]`)**: Entity merge operations must be domain-reversible without provenance data loss.
8. **Relocation Lineage (`[DOMAIN DECISION]`)**: Relocating a `Branch` updates its spatial Place link while preserving branch identity lineage.
9. **Claim Provenance (`[DOMAIN DECISION]`)**: Data claims require source attribution and temporal context (`[DOMAIN DECISION]`).
10. **Scoped Verification (`[DOMAIN DECISION]`)**: Verification applies to specific attribute scopes and temporal validity windows.
11. **Business Without Place (`[DOMAIN DECISION]`)**: A `Business` may exist without a public physical `Place`.
12. **Place Without Business (`[DOMAIN DECISION]`)**: A `Place` may exist without a commercial `Business`.
13. **Mandatory Administrative Context (`[DOMAIN DECISION]`)**: WAYNAH requires administrative geographic context in its domain model.
14. **Flexible Sub-Geography (`[DOMAIN DECISION]`)**: WAYNAH accommodates dataset variances in administrative levels below District.

---

## 28. CANDIDATE AGGREGATE ANALYSIS `[HYPOTHESIS]`

Phase 3 analyzes 9 Candidate Aggregates to establish conceptual consistency boundaries requiring Phase 4 architectural validation (`[HYPOTHESIS]`):

### 1. Place Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Place`
* **Candidate Consistency Boundary**: Physical coordinates, administrative district reference, landmark references, site status.
* **Why Candidate Aggregate**: Manages physical location identity and site lifecycle independently of businesses.

### 2. Business Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Business`
* **Candidate Consistency Boundary**: Trade name, corporate profile, ownership claims.
* **Why Candidate Aggregate**: Controls brand identity and organizational policy across all branches.

### 3. Branch Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Branch`
* **Candidate Consistency Boundary**: Branch identity, parent Business link, physical Place link, local contacts, operating schedules.
* **Why Candidate Aggregate**: Handles operational presence, operating hours, and local storefront state.

### 4. Provider Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Provider`
* **Candidate Consistency Boundary**: Provider identity, professional category, mobility status, service coverage area.
* **Why Candidate Aggregate**: Encapsulates human service actor capabilities and field area coverage.

### 5. Service Offering Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Service Offering`
* **Candidate Consistency Boundary**: Service identity, delivery mode, availability conditions, pricing context.
* **Why Candidate Aggregate**: Manages intangible execution capabilities independently of physical products.

### 6. Claim & Provenance Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Claim`
* **Candidate Consistency Boundary**: Target entity ref, attribute scope, asserted value, source ref, evidence refs, verification state.
* **Why Candidate Aggregate**: Encapsulates multi-source trust evaluation and provenance tracking.

### 7. User Contribution Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `User Contribution`
* **Candidate Consistency Boundary**: Contributor ref, target entity ref, suggested edit payload, triage status.
* **Why Candidate Aggregate**: Manages crowdsourced submission queues prior to claim integration.

### 8. Review Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Review`
* **Candidate Consistency Boundary**: Reviewer ref, target entity ref, rating, sentiment text, moderation status.
* **Why Candidate Aggregate**: Manages citizen experience feedback and anti-spam moderation workflows.

### 9. Geographic Context Candidate Aggregate `[HYPOTHESIS]`
* **Aggregate Root**: `Governorate`
* **Candidate Consistency Boundary**: Governorate ref, District collection, UN OCHA P-codes, boundary metadata.
* **Why Candidate Aggregate**: Protects administrative reference geographic boundaries.

---

## 29. CANDIDATE DOMAIN CONTEXTS `[HYPOTHESIS]`

Phase 3 organizes the domain model into 7 candidate conceptual Bounded Contexts requiring Phase 4 validation (`[HYPOTHESIS]`):

```text
CANDIDATE BOUNDED CONTEXTS FOR WAYNAH:
├── 1. Geographic Context (Geographic references, administrative context, spatial discovery concepts)
├── 2. Place Registry Context (Canonical physical locations, site lifecycle, multi-tenant places)
├── 3. Business & Operating Presence Context (Businesses, branches, providers, storefronts)
├── 4. Service Offerings Context (Service capabilities, execution delivery modes, service coverage areas)
├── 5. Trust & Provenance Context (Claims, evidence artifacts, scoped verification records, disputes)
├── 6. Community & Moderation Context (User contributions, reports, experience reviews, triage queues)
└── 7. Identity & Resolution Context (Duplicate candidate matching, entity aliases, reversible merge/split)
```

---

## 30. DEFERRED DECISIONS

Phase 3 explicitly defers 22 unresolved decisions to future phases:

1. **Specific P-Code String Mappings (`[UNKNOWN / VALIDATION REQUIRED]`)**: Direct string mapping of P-codes to individual districts requires verification against official UN OCHA COD-AB release files.
2. **Current 2026 Telecom Operator Assignments (`[UNKNOWN / VALIDATION REQUIRED]`)**: Active 2026 prefix routing and mobile number portability rules require authoritative telecom validation.
3. **Sub-District (Uzlah) & Village Gazetteer Coverage (`[UNKNOWN / VALIDATION REQUIRED]`)**: Complete sub-district mapping across all 31 districts of Hajjah requires data ingestion verification.
4. **Quantitative WhatsApp Adoption Rates (`[UNKNOWN / VALIDATION REQUIRED]`)**: Exact business adoption percentages in rural vs urban districts require field survey confirmation.
5. **Pharmacy Duty Rotation Verification (`[UNKNOWN / VALIDATION REQUIRED]`)**: Official syndicate data feeds for night duty pharmacies require operational verification.
6. **Canonical Survivor Selection Policy (`[UNKNOWN / VALIDATION REQUIRED]`)**: Rule criteria for choosing canonical survivor entity during duplicate merges deferred to field policy evaluation.
7. **Numeric Trust Authority Weights (`[HYPOTHESIS]`)**: Hard-coded numeric authority scores (`Gov = 100`) deferred to future confidence algorithm tuning.
8. **Search Ranking Formula Weights (`[HYPOTHESIS]`)**: Numeric scoring bonuses (`+25` for open now) deferred to product search tuning.
9. **Duplicate Spatial Distance Thresholds (`[HYPOTHESIS]`)**: Exact meter distance bounds (`<30m`) deferred to geospatial field testing.
10. **Data Freshness Decay Windows (`[HYPOTHESIS]`)**: Attribute freshness expiry windows deferred to empirical data decay analysis.
11. **Verification SLA & Triage SLA (`[HYPOTHESIS]`)**: Queue SLA turn-around targets deferred to field operations planning.
12. **Review Scoring & Sentiment Algorithms (`[HYPOTHESIS]`)**: Rating aggregation formulas deferred to UX/Moderation policy design.
13. **Internal Identifier Representation (`[HYPOTHESIS]`)**: Technical representation (UUID, ULID, etc.) deferred to Phase 4 System Architecture.
14. **Provider Taxonomy Dimensional Structure (`[HYPOTHESIS]`)**: Multi-dimensional provider classification structure deferred to future domain refinement.
15. **Claim Status Dimensional Model (`[HYPOTHESIS]`)**: Final claim state dimensional model deferred to trust engine design.
16. **Lifecycle Ownership & State Semantics (`[HYPOTHESIS]`)**: Detailed state machine semantics by entity type deferred to Phase 4.
17. **Candidate Aggregate Boundaries (`[HYPOTHESIS]`)**: Final aggregate boundaries deferred to Phase 4 System Architecture.
18. **Candidate Bounded Context Boundaries (`[HYPOTHESIS]`)**: Technical bounded context boundaries deferred to Phase 4 System Architecture.
19. **Review Rating Scale (`[HYPOTHESIS]`)**: Candidate rating scale deferred to UX/Moderation policy design.
20. **Business vs Branch Closure Semantics (`[HYPOTHESIS]`)**: Operational closure propagation rules deferred to future operational study.
21. **Messaging Channel Technical Representation (`[HYPOTHESIS]`)**: Messaging contact link structures deferred to technical design.
22. **Exact P-Code Example Mappings (`[UNKNOWN / VALIDATION REQUIRED]`)**: Specific district P-code mappings deferred to gazetteer ingestion.

---

## 31. DOMAIN MODEL VALIDATION MATRIX

| Domain Question | Current Model Representation | Classification | Evidence / Reason | Needs Phase 3 Decision? | Deferred? |
|---|---|---|---|---|---|
| Are Places distinct from Businesses? | Model decouples `Place` (location) from `Business` (identity). | `[DOMAIN DECISION]` | Places exist without businesses; mobile businesses exist without places. | YES — Resolved | NO |
| Are Businesses distinct from Branches? | Model separates `Business` (umbrella) from `Branch` (operating site). | `[DOMAIN DECISION]` | Branches have distinct hours, staff, contacts, and locations. | YES — Resolved | NO |
| Are Providers distinct from Businesses? | Model separates `Provider` (human actor) from `Business` (company). | `[DOMAIN DECISION]` | Independent technicians operate without commercial companies. | YES — Resolved | NO |
| Are Services distinct from Products? | Model enforces `Service Offering` $\neq$ `Product`. | `[DOMAIN DECISION]` | Services depend on spatial/temporal execution conditions. | YES — Resolved | NO |
| Is `verified: true` sufficient for trust? | Replaced by attribute-scoped, time-stamped `Claims`. | `[DOMAIN DECISION]` | Attributes originate from diverse sources with varying evidence. | YES — Resolved | NO |
| Are Reviews equivalent to Factual Claims? | Strictly decoupled (`Review` $\neq$ `Claim`). | `[DOMAIN DECISION]` | Reviews express subjective opinion; claims state factual attributes. | YES — Resolved | NO |
| Can a Phone Number be Entity Identity? | Phone modeled as mutable contact attribute. | `[DOMAIN DECISION]` | Phone numbers can be ported, transferred, or shared. | YES — Resolved | NO |
| Is formal addressing required for places? | Layered Model (Coords + Co-located Landmarks). | `[DOMAIN DECISION]` | Formal street/building addressing is incomplete in Hajjah. | YES — Resolved | NO |
| Are duplicate merges reversible? | Reversible merge & split via alias preservation. | `[DOMAIN DECISION]` | Prevents data loss when adjacent shops are incorrectly merged. | YES — Resolved | NO |
| What are the specific P-code string mappings? | UN OCHA P-code place identifier concept locked. | `[UNKNOWN / VALIDATION REQUIRED]` | Official COD-AB file verification required during ingestion. | NO | YES |
| What are the current 2026 telecom prefix assignments? | Historical ITU plan documented; current routing open. | `[UNKNOWN / VALIDATION REQUIRED]` | Active 2026 operator routing requires authoritative check. | NO | YES |
| What is the canonical survivor selection policy? | Duplicate detection signals defined; survivor rule open. | `[UNKNOWN / VALIDATION REQUIRED]` | Policy criteria deferred to field triage validation. | NO | YES |
| What are the exact numeric search ranking weights? | Search intent dimensions locked; weights open. | `[HYPOTHESIS]` | Scoring formulas belong to future product/search tuning. | NO | YES |

---

## 32. ANTI-PATTERN VERIFICATION

Phase 3 verifies that the Domain Model successfully avoids all 14 dangerous anti-patterns:

1. **Place = Business**: Decoupled (`Place` = physical location, `Business` = operating identity).
2. **Provider = Place**: Decoupled (`Provider` = human actor, `Place` = physical site).
3. **Address = One Text Field**: Replaced by Layered Address Model (Coordinates + Landmarks).
4. **Verified = Single Boolean**: Replaced by Scoped Attribute Claims & Verification Records.
5. **Open/Closed = Static Boolean**: Replaced by Schedule + operational status + temporary exceptions.
6. **Phone = Immutable Identity**: Phone defined as mutable contact attribute collection.
7. **Category = One Fixed Enum**: Primary categories paired with candidate conceptual categorization.
8. **Rating = Factual Truth**: Reviews strictly decoupled from factual data claims.
9. **User Submission = Trusted Fact**: User submissions treated as unverified edit candidate claims.
10. **Duplicate = Same Name**: Multi-vector resolution (Spatial + Phonetic + Contact + Category).
11. **Location = Coordinates Only**: Coordinates paired with human-readable local landmark anchors.
12. **Closure = Record Deletion**: Operating presence transitions to explicit operational states; Place lifecycle separated.
13. **History = Overwritten Data**: Entity state mutations produce immutable domain audit events.
14. **Review = Factual Claim**: Distinct triage workflows for Reviews versus Attribute Claims.

---

## 33. PHASE 3 EXIT CRITERIA

Phase 3 is complete and ready for final independent review based on the following verified criteria:

- [x] Comprehensive Domain Model Master Study normalized and saved to `docs/WAYNAH_PHASE_3_DOMAIN_MODEL_STUDY_V1_1.md`.
- [x] Strict statement taxonomy (`FACT`, `ASSUMPTION`, `HYPOTHESIS`, `DOMAIN DECISION`, `UNKNOWN / VALIDATION REQUIRED`) enforced across all sections.
- [x] Core entity boundaries explicitly defined across 18 canonical core domain entities.
- [x] Five Modeling Levels explicitly separated (Entities, Value Concepts, Events, Candidate Aggregates, Candidate Contexts).
- [x] Entity responsibilities, identity model, and relationship matrix fully detailed and normalized.
- [x] Layered addressing, contact channels, operating schedules, and dimensional claim provenance modeled.
- [x] 14 domain invariants and 14 anti-patterns counter-verified.
- [x] 9 Candidate Aggregates and 7 Candidate Bounded Contexts classified as `[HYPOTHESIS]` without defining software architecture.
- [x] All 22 unresolved operational and technical decisions explicitly deferred to future phases.
- [x] Strict boundary enforced: ZERO source code changes, ZERO Prisma/schema changes, ZERO database migrations, ZERO API implementation.

---

## 34. PHASE 3 STATUS

`PHASE 3 — READY FOR FINAL INDEPENDENT REVIEW`
