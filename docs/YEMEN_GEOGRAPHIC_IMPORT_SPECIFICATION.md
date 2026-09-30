# WAYNAH Yemen Geographic Data Source & Import Specification

## Executive Summary

This document specifies the authoritative geographic data source and import pipeline architecture for the WAYNAH platform.

To preserve database integrity and maintain WAYNAH's strict **NO FAKE / SYNTHETIC DATA** policy, production geographic imports are executed exclusively from verified, official Common Operational Datasets (COD-AB).

---

## 1. Primary Authoritative Source

| Parameter                  | Specification / Value                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| **Publisher / Owner**      | United Nations Office for the Coordination of Humanitarian Affairs (UN OCHA Yemen)               |
| **Dataset Name**           | Yemen - Subnational Administrative Boundaries (COD-AB)                                          |
| **Source Platform**        | Humanitarian Data Exchange (HDX)                                                                |
| **Primary Reference URL**  | `https://data.humdata.org/dataset/yemen-admin-boundaries`                                       |
| **Version / Last Release** | January 2026 Release (Fully P-coded)                                                            |
| **Administrative Levels**  | Level 0 (Country: YE), Level 1 (22 Governorates), Level 2 (335 Districts), Level 3 (Subdistricts) |
| **Available Formats**      | GeoJSON, Shapefile (SHP), Excel (XLSX), CSV                                                     |
| **Coordinate System / SRID**| WGS 84 (EPSG:4326)                                                                             |
| **License**                | Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO)                    |

---

## 2. Secondary Data Sources Comparison

| Source Source       | Publisher            | Coverage          | P-Code Support | Evaluation / Suitability for WAYNAH                                      |
| ------------------- | -------------------- | ----------------- | -------------- | ------------------------------------------------------------------------ |
| **OCHA COD-AB**     | UN OCHA Yemen        | 22 Gov / 335 Dist | **Official**   | **Primary Authoritative Standard**. Native P-codes & Arabic names.        |
| **geoBoundaries**   | Wm & Mary geoLab     | 22 Gov / 333 Dist | Partial        | Secondary reference for boundary topology verification only.             |
| **GADM**            | GADM Project         | 22 Gov / 333 Dist | None           | Secondary reference for geometry cross-checking; lacks official P-codes. |
| **Natural Earth**   | Natural Earth Vector | Admin 0/1 coarse  | None           | Unsuitable for district-level administrative precision.                  |

---

## 3. Source → WAYNAH Mapping Contract

### 3.1 Governorate Mapping (ADM1)

| OCHA Source Field | WAYNAH Field             | Type    | Required | Rule / Description                                              |
| ----------------- | ------------------------ | ------- | :------: | --------------------------------------------------------------- |
| `ADM1_PCODE`      | `Governorate.externalId` | String  | **YES**  | Stable UN P-code (e.g., `YE17` for Hajjah). Primary lookup key. |
| `ADM1_AR`         | `Governorate.nameAr`     | String  | **YES**  | Official Arabic name (e.g., `حجة`). Preserved verbatim.         |
| `ADM1_EN`         | `Governorate.nameEn`     | String  |    NO    | English name (e.g., `Hajjah`). Nullable if absent.              |
| Representative Pt | `Governorate.latitude`   | Float   |    NO    | WGS84 scalar latitude (validated `-90 ≤ lat ≤ 90`).             |
| Representative Pt | `Governorate.longitude`  | Float   |    NO    | WGS84 scalar longitude (validated `-180 ≤ lng ≤ 180`).          |

### 3.2 District Mapping (ADM2)

| OCHA Source Field | WAYNAH Field           | Type   | Required | Rule / Description                                                        |
| ----------------- | ---------------------- | ------ | :------: | ------------------------------------------------------------------------- |
| `ADM2_PCODE`      | `District.externalId`  | String | **YES**  | Stable UN P-code (e.g., `YE1703` for Abs). Unique constraint.            |
| `ADM1_PCODE`      | `District.governorateId`| String| **YES**  | Parent lookup key. Maps to internal WAYNAH `Governorate.id` via P-code.  |
| `ADM2_AR`         | `District.nameAr`      | String | **YES**  | Official Arabic name (e.g., `عبس`). Scoped unique in governorate.         |
| `ADM2_EN`         | `District.nameEn`      | String |    NO    | English name (e.g., `Abs`). Nullable if absent.                           |
| `geometry`        | `District.boundary`    | Spatial|    NO    | Deferred until GeoJSON polygon file is explicitly ingested (EPSG:4326).   |

---

## 4. Import Pipeline Lifecycle

The import pipeline is implemented in [geography-pipeline.service.ts](file:///f:/waynah/apps/api/src/domain/geography/geography-pipeline.service.ts) and operates across three controlled phases:

```
[ Raw OCHA COD-AB File ]
           │
           ▼
     ┌───────────┐
     │  DRY RUN  │  ── Validates P-codes, Names, Coords, Geometry & Parents.
     └─────┬─────┘     (ZERO database mutations)
           │
           ▼ Passed
     ┌───────────┐
     │  UPSERT   │  ── Idempotently upserts Governorates & Districts by externalId.
     └─────┬─────┘     Registers DataSource provenance. No automatic deletions.
           │
           ▼
     ┌───────────┐
     │  VERIFY   │  ── Audits database consistency, parent linkage & P-code coverage.
     └───────────┘
```

### Mode 1: DRY RUN
- Validates all records for missing required fields (`ADM1_PCODE`, `ADM1_AR`, `ADM2_PCODE`, `ADM2_AR`, `ADM1_PCODE` parent).
- Detects duplicate P-codes within the input payload.
- Verifies coordinate bounds (`-90 ≤ lat ≤ 90`, `-180 ≤ lng ≤ 180`, finite numbers).
- Validates spatial SRID (`4326`) and geometry types (`MultiPolygon` / `Polygon`).
- **Guarantees zero database modifications.**

### Mode 2: UPSERT
- Executed only after Dry Run validation passes.
- Ensures a `DataSource` record exists (e.g. `name: "OCHA Yemen COD-AB"`, `type: "GEOGRAPHIC_COD_AB"`).
- Upserts Governorates by `externalId` (`ADM1_PCODE`).
- Resolves parent `governorateId` and upserts Districts by `externalId` (`ADM2_PCODE`).
- **Never deletes missing records** (prevents unintended data loss if source snapshot is partial).

### Mode 3: VERIFY
- Audits total governorates, total districts, P-code coverage percentage, and orphan count.
- Returns status `VERIFIED` or `INCONSISTENT`.

---

## 5. Hajjah-First Scope Verification

Hajjah Governorate (`YE17`) serves as WAYNAH's initial operational focus.

- **Governorate P-code**: `YE17` (`حجة` / `Hajjah`)
- **District Count**: 31 Districts
- **Key Districts Verified**:
  - `YE1701`: Hajjah City (مدينة حجة)
  - `YE1703`: Abs (عبس)
  - `YE1704`: Haradh (حرض)
  - `YE1705`: Midi (ميدي)
  - `YE1706`: Khayran Al Muharraq (خيران المحرق)
  - `YE1711`: Al Mahabisha (المحابشة)

---

## 6. Update & Maintenance Policy

1. **Review Frequency**: OCHA COD-AB datasets are reviewed bi-annually.
2. **Snapshot Provenance**: Every import records `DataSource.name` and timestamp.
3. **Non-Destructive Reconciliation**: New P-codes are inserted; modified names are updated; deprecated P-codes are flagged via admin audit rather than deleted.

---

## 7. WAYNAH-GEO-003 Verified Import Record

- **Import Execution Timestamp**: `2026-09-30T00:41:00Z`
- **Source File**: `data/raw/geographic/geojson/yem_admin1.geojson` & `yem_admin2.geojson` (and `yem_admin_boundaries.xlsx`)
- **Source Publisher**: UN OCHA Yemen Information Management (HDX dataset `cod-ab-yem`)
- **Source Release**: January 2026 Release (Fully P-coded)
- **Import Scope & Counts**:
  - **Governorates (ADM1)**: 22 source governorates / 22 imported records (100% P-code coverage)
  - **Districts (ADM2)**: 335 source districts / 335 imported records (100% P-code coverage)
- **Parent Integrity**: 100% verified (0 orphaned districts)
- **Hajjah Verification**:
  - Governorate P-code: `YE17`
  - Arabic name: `حجه` (Ref: `حجة`)
  - English name: `Hajjah`
  - District count: 31 Districts (100% parent linkage verified)
- **Boundary Status**: DEFERRED for dedicated GIS boundary ingestion task.
- **DataSource Provenance**: `OCHA Yemen COD-AB` (type: `GEOGRAPHIC_COD_AB`, weight: `1.0`)

