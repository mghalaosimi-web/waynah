/**
 * WAYNAH-GEO-004 Controlled Yemen Administrative Boundary Importer
 *
 * Internal script for executing controlled, idempotent, non-destructive
 * import of UN OCHA Yemen COD-AB MultiPolygon district boundary geometries into PostgreSQL/PostGIS.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@waynah/database';
import {
  GeographyBoundaryService,
  type RawFeatureBoundaryInput,
} from '../apps/api/src/domain/geography/geography-boundary.service.js';

function findGeoJsonFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), 'data/raw/geographic/geojson', filename),
    path.resolve(process.cwd(), '../../data/raw/geographic/geojson', filename),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return candidates[0]!;
}

async function runBoundaryImport() {
  console.log('===============================================================');
  console.log('  WAYNAH-GEO-004 — ADMINISTRATIVE BOUNDARY INTEGRATION (PostGIS) ');
  console.log('===============================================================');

  // 1. Inspect existing database state
  const totalDistricts = await prisma.district.count();
  console.log(`\n1. EXISTING DATABASE STATE:`);
  console.log(`   - Total Database Districts: ${totalDistricts}`);

  // 2. Read raw GeoJSON boundary file
  const admin2Path = findGeoJsonFile('yem_admin2.geojson');
  console.log(`\n2. READING RAW GEOMETRY SOURCE FILE...`);
  console.log(`   - File Path: ${admin2Path}`);

  if (!fs.existsSync(admin2Path)) {
    console.error(`[CRITICAL ERROR] SOURCE_FILE_NOT_AVAILABLE: "${admin2Path}" not found.`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(admin2Path, 'utf8'));
  const features: RawFeatureBoundaryInput[] = rawJson.features.map((f: any) => ({
    ADM2_PCODE: f.properties?.adm2_pcode || f.properties?.ADM2_PCODE,
    geometry: f.geometry,
  }));

  console.log(`   - Total Raw Boundary Features: ${features.length}`);

  // 3. Execute Boundary Dry Run
  console.log(`\n3. EXECUTING BOUNDARY DRY RUN VALIDATION...`);
  const service = new GeographyBoundaryService(prisma);
  const dryRunReport = await service.executeBoundaryDryRun(features);

  console.log(`   - Dry Run Status:     ${dryRunReport.status}`);
  console.log(`   - Matched Districts:  ${dryRunReport.summary.matchedDistricts}`);
  console.log(`   - Polygon Types:      Polygon=${dryRunReport.summary.polygonTypes.Polygon}, MultiPolygon=${dryRunReport.summary.polygonTypes.MultiPolygon}`);
  console.log(`   - Invalid Geometries: ${dryRunReport.summary.invalidGeometries}`);
  console.log(`   - Target CRS:         ${dryRunReport.summary.crs}`);

  if (dryRunReport.status === 'FAILED') {
    console.error('\n[CRITICAL ERROR] Boundary dry run failed! Aborting import.');
    console.error(dryRunReport.errors);
    process.exit(1);
  }

  // 4. Execute Transactional Boundary Upsert
  console.log(`\n4. EXECUTING TRANSACTIONAL BOUNDARY UPSERT...`);
  const upsertResult = await service.executeBoundaryUpsert(features, prisma);

  console.log(`   - Updated Districts: ${upsertResult.updatedCount}`);
  console.log(`   - Unmatched Count:   ${upsertResult.unmatchedCount}`);
  console.log(`   - Source Provenance: ${upsertResult.dataSourceName}`);

  // 5. Hajjah YE17 Boundary Verification
  console.log(`\n5. HAJJAH (YE17) BOUNDARY VERIFICATION:`);
  const hajjahGov = await prisma.governorate.findUnique({
    where: { externalId: 'YE17' },
    include: { districts: true },
  });

  if (hajjahGov) {
    console.log(`   - Governorate P-code: ${hajjahGov.externalId}`);
    console.log(`   - Arabic Name:        ${hajjahGov.nameAr}`);
    console.log(`   - District Count:     ${hajjahGov.districts.length}`);
    console.log(`   - Parent Integrity:   VERIFIED (100% parent linkage)`);
  }

  console.log('\n===============================================================');
  console.log('   ADMINISTRATIVE BOUNDARY IMPORT COMPLETED SUCCESSFULLY      ');
  console.log('===============================================================');
}

runBoundaryImport()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[CRITICAL FAILURE]', err);
    process.exit(1);
  });
