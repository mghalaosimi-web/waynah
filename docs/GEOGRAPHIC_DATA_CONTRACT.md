# WAYNAH Geographic Data Contract

## Overview

This document defines the authoritative geographic data contract for the WAYNAH platform.

Yemen's administrative geography is organized as:

```
Yemen
 └── Governorate (محافظة)
      └── District (مديرية)
           └── Place (موقع)
                └── PlaceLocation (موقع جغرافي PostGIS)
```

Business remains separate and does not merge with the geographic hierarchy:

```
Business → operates/provides → Place
                                └── PlaceLocation (coordinates)
                                └── District (administrative context)
```

---

## Entities

### Governorate

| Field        | Type      | Constraint       | Purpose                                                     |
|-------------|-----------|-----------------|-------------------------------------------------------------|
| `id`         | UUID      | Primary Key      | Internal WAYNAH stable identifier                           |
| `externalId` | String?   | Unique (partial) | Stable identifier from authoritative source (e.g. OCHA pcode) |
| `nameAr`     | String    | Required         | Arabic name (Arabic-first platform)                         |
| `nameEn`     | String?   | Nullable         | English name — only set when source data provides it       |
| `code`       | String?   | Unique (partial) | Optional ISO/administrative code                            |
| `createdAt`  | DateTime  | Auto             | Record creation timestamp                                   |
| `updatedAt`  | DateTime  | Auto             | Last update timestamp                                       |

**Uniqueness**: `externalId` is globally unique when non-null.

### District

| Field          | Type      | Constraint                    | Purpose                                                    |
|---------------|-----------|------------------------------|------------------------------------------------------------|
| `id`           | UUID      | Primary Key                   | Internal WAYNAH stable identifier                          |
| `externalId`   | String?   | Unique (partial)              | Stable identifier from authoritative source                |
| `governorateId`| UUID      | Foreign Key → Governorate     | Parent governorate                                         |
| `nameAr`       | String    | Required                      | Arabic name                                                |
| `nameEn`       | String?   | Nullable                      | English name — only set when source data provides it      |
| `code`         | String?   | Optional                      | Optional administrative code                               |
| `createdAt`    | DateTime  | Auto                          | Record creation timestamp                                  |
| `updatedAt`    | DateTime  | Auto                          | Last update timestamp                                      |

**Uniqueness**:
- `(governorateId, nameAr)` — District names must be unique within a governorate.  
  District names are **NOT** globally unique across Yemen (two governorates can have same-named districts).
- `externalId` — Globally unique when non-null.

### Place

A Place is the canonical geographic entity representing a real-world location.

| Field               | Purpose                                            |
|--------------------|-----------------------------------------------------|
| `id`                | Internal stable identifier                          |
| `nameAr`            | Arabic name (primary)                               |
| `nameEn`            | English name (optional)                             |
| `districtId`        | Geographic administrative context                   |
| `categoryId`        | Business category                                   |
| `verificationStatus`| Data quality level (UNVERIFIED → VERIFIED)         |
| `businessId`        | Optional business ownership link                   |

**Geographic context**: A Place knows its District (and through it, its Governorate).  
**Coordinates**: Stored in `PlaceLocation` (PostGIS geography(Point, 4326)).

### PlaceLocation

| Field       | Purpose                                                         |
|------------|------------------------------------------------------------------|
| `placeId`   | One-to-one link to Place                                        |
| `latitude`  | Scalar latitude (WGS84)                                         |
| `longitude` | Scalar longitude (WGS84)                                        |
| `geom`      | PostGIS `geography(Point, 4326)` — GiST indexed for ST_DWithin |

**Axis order**: `ST_MakePoint(longitude, latitude)` — PostGIS convention (X=longitude, Y=latitude).

---

## Coordinate Validation

All geographic coordinates must pass the following validation before persistence:

| Constraint                     | Rule                                     |
|-------------------------------|------------------------------------------|
| Latitude range                 | `-90 ≤ latitude ≤ 90`                   |
| Longitude range                | `-180 ≤ longitude ≤ 180`               |
| Numeric type                   | Must be a finite JavaScript `number`    |
| NaN rejected                   | `NaN` is always invalid                 |
| Infinity rejected              | `Infinity` / `-Infinity` always invalid |
| SRID                           | Must be `4326` (WGS84)                 |

**Note**: Yemen-specific bounding box validation is NOT applied. Global bounds are sufficient at this stage.

---

## Source / Provenance

Geographic records should trace to an authoritative source.

The `externalId` field on `Governorate` and `District` encodes the stable identifier from the source system (e.g. OCHA Yemen pcodes, UN administrative codes).

When importing, the same `source + externalId` combination identifies an existing record:

```
same source + same externalId → update existing geographic entity
                               (NOT create a duplicate)
```

The platform's `DataSource` model (used for `PlaceObservation` provenance) is a candidate for geographic import provenance in a future extension. At this stage, `externalId` alone provides sufficient idempotency.

---

## Import Behavior

### Idempotency

Geographic imports are designed to be safely repeatable:

1. **Lookup**: Find existing record by `externalId`.
2. **No match**: Create new record → `CREATED`.
3. **Match, no changes**: Do nothing → `UNCHANGED`.
4. **Match, fields changed**: Update record → `UPDATED`.

### Validation Order

Before any database operation:
1. Validate required fields (`externalId`, `nameAr`).
2. Validate parent `governorateId` exists (for districts).
3. Validate coordinates if provided.
4. Reject with explicit error if any validation fails.

### No Invented Data

The import service **never**:
- Generates coordinates automatically.
- Creates placeholder polygon boundaries.
- Invents administrative relationships.
- Manufactures district names.

If authoritative data is not available: the record is simply not imported.

---

## Boundary Strategy (Deferred)

Administrative boundary data (district polygons) is **not** imported in this version.

**Reason**: No authoritative polygon dataset is currently available.

**Architecture readiness**: The schema and import service are designed to accept a future `District.boundary` field (`geography(MultiPolygon, 4326)`) via a clean, additive migration.

**Future capability**:
```sql
-- Future boundary-based geographic resolution (deferred)
SELECT d.id FROM districts d
WHERE ST_Contains(d.boundary::geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  AND d.boundary IS NOT NULL;
```

Until real boundary data exists, district assignment uses the existing nearest-Place spatial heuristic (CORE-002 pattern).

> **Documented decision**: Boundary-based geographic resolution is deferred until authoritative polygon data is imported.

---

## Hajjah Scope

The initial production scope targets Hajjah governorate first.

**Current status**: No Hajjah data exists in the database (no authoritative source has been imported).

**Readiness**: The system is ready to receive Hajjah and all 22 Yemen governorates with their districts as soon as authoritative data (e.g. OCHA Yemen Admin Boundaries) is made available.

**Do not manufacture**: Fake Hajjah district data must never be inserted to make the UI appear populated.

---

## API

| Endpoint                                    | Auth     | Description                                 |
|--------------------------------------------|---------|---------------------------------------------|
| `GET /v1/geography/governorates`            | Public   | List all governorates                       |
| `GET /v1/geography/governorates/:id`        | Public   | Get a single governorate                    |
| `GET /v1/geography/governorates/:id/districts` | Public | List districts in a governorate            |

**Import**: No public import endpoint. Geographic import is an internal admin-only operation performed via `GeographyImportService` directly (protected by admin authorization).

---

## Future Tasks

| Task                        | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| WAYNAH-ADMIN-002           | Geographic Data Management admin UI                                         |
| Boundary import             | Import OCHA Yemen admin boundary polygons (MultiPolygon)                    |
| ST_Contains resolution      | Replace heuristic district lookup with boundary-based ST_Contains/ST_Within |
| Source provenance extension | Link geographic imports to `DataSource` model                               |
| Hajjah population           | Import authoritative Hajjah governorate + 31 district records               |
| All Yemen population        | Import all 22 governorates + districts                                      |
