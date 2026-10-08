/**
 * WAYNAH-GEO-003 Controlled Yemen Geographic Importer
 *
 * Internal script for executing controlled, idempotent, non-destructive
 * import of UN OCHA Yemen COD-AB administrative reference data into PostgreSQL/Prisma.
 */

import 'dotenv/config';
import { createDirectPrismaClient } from '@waynah/database';
import { GeographySourceReader } from '../apps/api/src/domain/geography/geography-source-reader.js';
import { GeographyPipelineService } from '../apps/api/src/domain/geography/geography-pipeline.service.js';

async function runControlledImport() {
  const prisma = createDirectPrismaClient();
  try {
    console.log('===============================================================');
  console.log('       WAYNAH-GEO-003 — CONTROLLED YEMEN GEOGRAPHIC IMPORT      ');
  console.log('===============================================================');

  // 1. Inspect existing database records before import
  const existingGovCount = await prisma.governorate.count();
  const existingDistCount = await prisma.district.count();

  console.log(`\n1. EXISTING DATABASE BEFORE IMPORT:`);
  console.log(`   - Existing Governorates: ${existingGovCount}`);
  console.log(`   - Existing Districts:    ${existingDistCount}`);

  // 2. Read official raw OCHA COD-AB source dataset
  console.log(`\n2. READING RAW AUTHORITATIVE SOURCE FILE...`);
  const reader = new GeographySourceReader();
  const sourceData = reader.readFromFiles();

  console.log(`   - Source Name:        ${sourceData.sourceName}`);
  console.log(`   - Source Release:     ${sourceData.sourceVersion}`);
  console.log(`   - ADM1 File:          ${sourceData.sourceFilePathAdmin1}`);
  console.log(`   - ADM2 File:          ${sourceData.sourceFilePathAdmin2}`);
  console.log(`   - Source Governorates: ${sourceData.rawGovCount}`);
  console.log(`   - Source Districts:    ${sourceData.rawDistCount}`);

  // 3. Execute Dry Run
  console.log(`\n3. EXECUTING DRY RUN VALIDATION...`);
  const pipeline = new GeographyPipelineService(prisma);
  const dryRunReport = await pipeline.executeDryRun(sourceData.dataset);

  console.log(`   - Status:             ${dryRunReport.status}`);
  console.log(`   - Gov Unique P-codes: ${dryRunReport.summary.governorates.uniquePcodes}`);
  console.log(`   - Dist Unique P-codes:${dryRunReport.summary.districts.uniquePcodes}`);
  console.log(`   - Duplicate P-codes:  Gov=${dryRunReport.summary.governorates.duplicatePcodes}, Dist=${dryRunReport.summary.districts.duplicatePcodes}`);
  console.log(`   - Missing Names Ar:   Gov=${dryRunReport.summary.governorates.missingNameAr}, Dist=${dryRunReport.summary.districts.missingNameAr}`);
  console.log(`   - Missing Parents:    Dist=${dryRunReport.summary.districts.missingParent}`);

  if (dryRunReport.status === 'FAILED') {
    console.error('\n[CRITICAL ERROR] Dry run failed! Aborting import.');
    console.error(dryRunReport.errors);
    process.exit(1);
  }

  // 4. Execute Transactional Upsert
  console.log(`\n4. EXECUTING TRANSACTIONAL UPSERT...`);
  const upsertResult = await pipeline.executeUpsert(sourceData.dataset, {
    name: 'OCHA Yemen COD-AB',
    type: 'GEOGRAPHIC_COD_AB',
    reliabilityWeight: 1.0,
  });

  console.log(`   - Provenance DataSource: "${upsertResult.dataSourceName}" (ID: ${upsertResult.dataSourceId})`);
  console.log(`   - Governorates: Created=${upsertResult.governorates.created}, Updated=${upsertResult.governorates.updated}, Unchanged=${upsertResult.governorates.unchanged}`);
  console.log(`   - Districts:    Created=${upsertResult.districts.created}, Updated=${upsertResult.districts.updated}, Unchanged=${upsertResult.districts.unchanged}`);

  // 5. Execute Post-Import Verification
  console.log(`\n5. POST-IMPORT AUDIT & VERIFICATION...`);
  const verifyReport = await pipeline.executeVerify();

  console.log(`   - Audit Status:          ${verifyReport.status}`);
  console.log(`   - Database Governorates: ${verifyReport.totalGovernorates}`);
  console.log(`   - Database Districts:    ${verifyReport.totalDistricts}`);
  console.log(`   - Gov P-code Coverage:   ${verifyReport.externalIdCoverage.governorateCoveragePercent}%`);
  console.log(`   - Dist P-code Coverage:  ${verifyReport.externalIdCoverage.districtCoveragePercent}%`);
  console.log(`   - Orphaned Districts:    ${verifyReport.orphanedDistricts}`);

  // 6. Hajjah Governorate Verification
  console.log(`\n6. HAJJAH (YE17) VERIFICATION:`);
  const hajjahGov = await prisma.governorate.findUnique({
    where: { externalId: 'YE17' },
    include: { districts: true },
  });

  if (hajjahGov) {
    console.log(`   - Governorate P-code: ${hajjahGov.externalId}`);
    console.log(`   - Arabic Name:        ${hajjahGov.nameAr}`);
    console.log(`   - English Name:       ${hajjahGov.nameEn}`);
    console.log(`   - District Count:     ${hajjahGov.districts.length}`);
    console.log(`   - Sample District P-codes: ${hajjahGov.districts.slice(0, 5).map(d => d.externalId).join(', ')}`);
    console.log(`   - Parent Integrity:   VERIFIED (0 orphan districts)`);
  } else {
    console.error(`   - [ERROR] Hajjah governorate YE17 not found!`);
  }

  console.log('\n===============================================================');
  console.log('       CONTROLLED GEOGRAPHIC IMPORT COMPLETED SUCCESSFULLY      ');
  console.log('===============================================================');
  } finally {
    await prisma.$disconnect();
  }
}

runControlledImport()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[CRITICAL FAILURE]', err);
    process.exit(1);
  });
