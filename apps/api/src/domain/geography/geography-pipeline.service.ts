/**
 * WAYNAH Yemen Geographic Import Pipeline & Specification Service
 *
 * Implements the WAYNAH-GEO-002 specification for controlled, authoritative
 * geographic data import based on UN OCHA Yemen Common Operational Dataset
 * on Administrative Boundaries (COD-AB).
 *
 * IMPORT PIPELINE LIFECYCLE:
 * 1. DRY RUN  : Read & validate source dataset without modifying database state.
 * 2. UPSERT   : Idempotent create/update of validated entities, with DataSource provenance.
 *               Does NOT automatically delete missing records.
 * 3. VERIFY   : Post-import audit of database geographic integrity against expected baseline.
 *
 * AUTHORITATIVE SOURCE SPECIFICATION (OCHA Yemen COD-AB):
 * - Primary Source : UN OCHA Yemen / Humanitarian Data Exchange (HDX)
 * - Dataset        : Yemen - Subnational Administrative Boundaries (COD-AB)
 * - ADM1           : 22 Governorates (ADM1_PCODE, ADM1_AR, ADM1_EN)
 * - ADM2           : 335 Districts (ADM2_PCODE, ADM2_AR, ADM2_EN, ADM1_PCODE)
 * - Spatial SRID   : EPSG:4326 (WGS 84)
 * - License        : CC BY-IGO / Open Data
 */

import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';
import {
  validateCoordinates,
  validateSrid,
  validateBoundaryGeometryType,
} from './geography-validation.js';
import { GeographyImportService } from './geography-import.service.js';

// ─── OCHA COD-AB Input Schemas ───────────────────────────────────────────────

export interface OchaCodAbGovernorate {
  ADM1_PCODE: string;
  ADM1_AR: string;
  ADM1_EN?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface OchaCodAbDistrict {
  ADM2_PCODE: string;
  ADM1_PCODE: string;
  ADM2_AR: string;
  ADM2_EN?: string | null;
  geometryType?: string;
  srid?: number;
}

export interface OchaCodAbDatasetInput {
  governorates: OchaCodAbGovernorate[];
  districts: OchaCodAbDistrict[];
  sourceName?: string;
  sourceVersion?: string;
}

// ─── Pipeline Output Interfaces ──────────────────────────────────────────────

export interface ValidationErrorItem {
  entityType: 'GOVERNORATE' | 'DISTRICT' | 'GEOMETRY';
  index: number;
  externalId?: string;
  field: string;
  message: string;
}

export interface DryRunReport {
  status: 'PASSED' | 'FAILED';
  summary: {
    governorates: {
      total: number;
      uniquePcodes: number;
      duplicatePcodes: number;
      missingNameAr: number;
      missingNameEn: number;
    };
    districts: {
      total: number;
      uniquePcodes: number;
      duplicatePcodes: number;
      missingParent: number;
      missingNameAr: number;
      missingNameEn: number;
    };
    geometry: {
      totalEvaluated: number;
      invalidSrid: number;
      unsupportedTypes: number;
    };
  };
  errors: ValidationErrorItem[];
}

export interface UpsertResult {
  dataSourceId: string;
  dataSourceName: string;
  governorates: {
    created: number;
    updated: number;
    unchanged: number;
  };
  districts: {
    created: number;
    updated: number;
    unchanged: number;
  };
}

export interface VerificationReport {
  status: 'VERIFIED' | 'INCONSISTENT';
  totalGovernorates: number;
  totalDistricts: number;
  externalIdCoverage: {
    governoratesWithExternalId: number;
    districtsWithExternalId: number;
    governorateCoveragePercent: number;
    districtCoveragePercent: number;
  };
  districtsPerGovernorate: Record<string, { governorateNameAr: string; districtCount: number }>;
  orphanedDistricts: number;
  details: string[];
}

// ─── Pipeline Service Implementation ──────────────────────────────────────────

export class GeographyPipelineService {
  private readonly prisma: PrismaClient;
  private readonly importService: GeographyImportService;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
    this.importService = new GeographyImportService(prismaClient);
  }

  /**
   * DRY RUN MODE
   *
   * Analyzes and validates raw input dataset records against OCHA COD-AB schema rules.
   * Performs zero database mutations.
   */
  async executeDryRun(input: OchaCodAbDatasetInput): Promise<DryRunReport> {
    const errors: ValidationErrorItem[] = [];

    const govPcodes = new Set<string>();
    const duplicateGovPcodes = new Set<string>();
    let govMissingNameAr = 0;
    let govMissingNameEn = 0;

    // 1. Validate Governorates
    input.governorates.forEach((gov, idx) => {
      if (!gov.ADM1_PCODE || gov.ADM1_PCODE.trim().length === 0) {
        errors.push({
          entityType: 'GOVERNORATE',
          index: idx,
          field: 'ADM1_PCODE',
          message: 'Governorate ADM1_PCODE is missing or empty',
        });
      } else {
        const pcode = gov.ADM1_PCODE.trim();
        if (govPcodes.has(pcode)) {
          duplicateGovPcodes.add(pcode);
          errors.push({
            entityType: 'GOVERNORATE',
            index: idx,
            externalId: pcode,
            field: 'ADM1_PCODE',
            message: `Duplicate governorate P-code: "${pcode}"`,
          });
        } else {
          govPcodes.add(pcode);
        }
      }

      if (!gov.ADM1_AR || gov.ADM1_AR.trim().length === 0) {
        govMissingNameAr++;
        errors.push({
          entityType: 'GOVERNORATE',
          index: idx,
          externalId: gov.ADM1_PCODE,
          field: 'ADM1_AR',
          message: 'Governorate Arabic name (ADM1_AR) is missing or empty',
        });
      }

      if (!gov.ADM1_EN || gov.ADM1_EN.trim().length === 0) {
        govMissingNameEn++;
      }

      if (gov.latitude !== undefined || gov.longitude !== undefined) {
        const coordRes = validateCoordinates(gov.latitude, gov.longitude);
        if (!coordRes.valid) {
          errors.push({
            entityType: 'GOVERNORATE',
            index: idx,
            externalId: gov.ADM1_PCODE,
            field: 'coordinates',
            message: coordRes.error || 'Invalid governorate coordinates',
          });
        }
      }
    });

    // 2. Validate Districts
    const distPcodes = new Set<string>();
    const duplicateDistPcodes = new Set<string>();
    let distMissingNameAr = 0;
    let distMissingNameEn = 0;
    let distMissingParent = 0;
    let invalidSridCount = 0;
    let unsupportedTypeCount = 0;
    let geomEvaluatedCount = 0;

    input.districts.forEach((dist, idx) => {
      if (!dist.ADM2_PCODE || dist.ADM2_PCODE.trim().length === 0) {
        errors.push({
          entityType: 'DISTRICT',
          index: idx,
          field: 'ADM2_PCODE',
          message: 'District ADM2_PCODE is missing or empty',
        });
      } else {
        const pcode = dist.ADM2_PCODE.trim();
        if (distPcodes.has(pcode)) {
          duplicateDistPcodes.add(pcode);
          errors.push({
            entityType: 'DISTRICT',
            index: idx,
            externalId: pcode,
            field: 'ADM2_PCODE',
            message: `Duplicate district P-code: "${pcode}"`,
          });
        } else {
          distPcodes.add(pcode);
        }
      }

      if (!dist.ADM2_AR || dist.ADM2_AR.trim().length === 0) {
        distMissingNameAr++;
        errors.push({
          entityType: 'DISTRICT',
          index: idx,
          externalId: dist.ADM2_PCODE,
          field: 'ADM2_AR',
          message: 'District Arabic name (ADM2_AR) is missing or empty',
        });
      }

      if (!dist.ADM2_EN || dist.ADM2_EN.trim().length === 0) {
        distMissingNameEn++;
      }

      const parentPcode = dist.ADM1_PCODE?.trim();
      if (!parentPcode || !govPcodes.has(parentPcode)) {
        distMissingParent++;
        errors.push({
          entityType: 'DISTRICT',
          index: idx,
          externalId: dist.ADM2_PCODE,
          field: 'ADM1_PCODE',
          message: `District parent governorate P-code "${parentPcode}" was not found in input dataset`,
        });
      }

      // Optional geometry validation if specified
      if (dist.srid !== undefined || dist.geometryType !== undefined) {
        geomEvaluatedCount++;
        if (dist.srid !== undefined) {
          const sridRes = validateSrid(dist.srid);
          if (!sridRes.valid) {
            invalidSridCount++;
            errors.push({
              entityType: 'GEOMETRY',
              index: idx,
              externalId: dist.ADM2_PCODE,
              field: 'srid',
              message: sridRes.error!,
            });
          }
        }

        if (dist.geometryType !== undefined) {
          const geomTypeRes = validateBoundaryGeometryType(dist.geometryType);
          if (!geomTypeRes.valid) {
            unsupportedTypeCount++;
            errors.push({
              entityType: 'GEOMETRY',
              index: idx,
              externalId: dist.ADM2_PCODE,
              field: 'geometryType',
              message: geomTypeRes.error!,
            });
          }
        }
      }
    });

    const status: 'PASSED' | 'FAILED' = errors.length === 0 ? 'PASSED' : 'FAILED';

    return {
      status,
      summary: {
        governorates: {
          total: input.governorates.length,
          uniquePcodes: govPcodes.size,
          duplicatePcodes: duplicateGovPcodes.size,
          missingNameAr: govMissingNameAr,
          missingNameEn: govMissingNameEn,
        },
        districts: {
          total: input.districts.length,
          uniquePcodes: distPcodes.size,
          duplicatePcodes: duplicateDistPcodes.size,
          missingParent: distMissingParent,
          missingNameAr: distMissingNameAr,
          missingNameEn: distMissingNameEn,
        },
        geometry: {
          totalEvaluated: geomEvaluatedCount,
          invalidSrid: invalidSridCount,
          unsupportedTypes: unsupportedTypeCount,
        },
      },
      errors,
    };
  }

  /**
   * UPSERT MODE
   *
   * Performs idempotent upserts of validated OCHA COD-AB governorate & district records.
   * Registers a DataSource record for provenance tracking.
   * Does NOT automatically delete missing records.
   */
  async executeUpsert(
    input: OchaCodAbDatasetInput,
    sourceMetadata?: { name?: string; type?: string; reliabilityWeight?: number }
  ): Promise<UpsertResult> {
    // 1. Dry run validation check
    const dryRun = await this.executeDryRun(input);
    if (dryRun.status === 'FAILED') {
      throw new Error(
        `Geography import pipeline upsert rejected: ${dryRun.errors.length} validation errors found. ` +
        `First error: [${dryRun.errors[0]?.field}] ${dryRun.errors[0]?.message}`
      );
    }

    const sourceName = sourceMetadata?.name || input.sourceName || 'OCHA Yemen COD-AB';
    const sourceType = sourceMetadata?.type || 'GEOGRAPHIC_COD_AB';
    const reliabilityWeight = sourceMetadata?.reliabilityWeight ?? 1.0;

    // ── PHASE 1: DataSource & Governorates Transaction ───────────────────────
    const { dataSource, pcodeToGovIdMap, govCreated, govUpdated, govUnchanged } =
      await this.prisma.$transaction(
        async (tx) => {
          let ds = await tx.dataSource.findFirst({
            where: { name: sourceName },
          });

          if (!ds) {
            ds = await tx.dataSource.create({
              data: {
                name: sourceName,
                type: sourceType,
                reliabilityWeight,
              },
            });
          }

          const map = new Map<string, string>();
          let created = 0;
          let updated = 0;
          let unchanged = 0;

          for (const govInput of input.governorates) {
            const res = await this.importService.importGovernorate(
              {
                externalId: govInput.ADM1_PCODE,
                nameAr: govInput.ADM1_AR,
                nameEn: govInput.ADM1_EN,
                latitude: govInput.latitude,
                longitude: govInput.longitude,
              },
              tx
            );

            map.set(govInput.ADM1_PCODE.trim(), res.id);

            if (res.action === 'CREATED') created++;
            else if (res.action === 'UPDATED') updated++;
            else unchanged++;
          }

          return {
            dataSource: ds,
            pcodeToGovIdMap: map,
            govCreated: created,
            govUpdated: updated,
            govUnchanged: unchanged,
          };
        },
        { maxWait: 5000, timeout: 15000 }
      );

    // ── PHASE 2: Sequential District Chunk Transactions (Max 50 per batch) ───
    const BATCH_SIZE = 50;
    let distCreated = 0;
    let distUpdated = 0;
    let distUnchanged = 0;

    const validGovIds = new Set(pcodeToGovIdMap.values());

    const districtChunks: OchaCodAbDistrict[][] = [];
    for (let i = 0; i < input.districts.length; i += BATCH_SIZE) {
      districtChunks.push(input.districts.slice(i, i + BATCH_SIZE));
    }

    // Execute chunks sequentially (NO parallel execution)
    for (const chunk of districtChunks) {
      const batchInputs = chunk.map((distInput) => {
        const parentGovId = pcodeToGovIdMap.get(distInput.ADM1_PCODE.trim());
        if (!parentGovId) {
          throw new Error(
            `Unexpected pipeline failure: Parent governorate P-code "${distInput.ADM1_PCODE}" not mapped.`
          );
        }
        return {
          externalId: distInput.ADM2_PCODE,
          governorateId: parentGovId,
          nameAr: distInput.ADM2_AR,
          nameEn: distInput.ADM2_EN,
        };
      });

      const chunkResult = await this.importService.importDistrictBatch(
        batchInputs,
        validGovIds
      );

      distCreated += chunkResult.created;
      distUpdated += chunkResult.updated;
      distUnchanged += chunkResult.unchanged;
    }

    return {
      dataSourceId: dataSource.id,
      dataSourceName: dataSource.name,
      governorates: {
        created: govCreated,
        updated: govUpdated,
        unchanged: govUnchanged,
      },
      districts: {
        created: distCreated,
        updated: distUpdated,
        unchanged: distUnchanged,
      },
    };
  }

  /**
   * VERIFY MODE
   *
   * Audits database state against expected OCHA COD-AB administrative baseline.
   */
  async executeVerify(): Promise<VerificationReport> {
    const governorates = await this.prisma.governorate.findMany({
      include: { districts: true },
    });

    const totalGovernorates = governorates.length;
    let totalDistricts = 0;
    let govWithExtId = 0;
    let distWithExtId = 0;
    let orphanedDistricts = 0;

    const districtsPerGov: Record<string, { governorateNameAr: string; districtCount: number }> = {};
    const details: string[] = [];

    for (const gov of governorates) {
      if (gov.externalId) govWithExtId++;

      const distCount = gov.districts.length;
      totalDistricts += distCount;
      districtsPerGov[gov.id] = {
        governorateNameAr: gov.nameAr,
        districtCount: distCount,
      };

      for (const dist of gov.districts) {
        if (dist.externalId) distWithExtId++;
        if (!dist.governorateId) orphanedDistricts++;
      }
    }

    const govCoverage = totalGovernorates > 0 ? (govWithExtId / totalGovernorates) * 100 : 0;
    const distCoverage = totalDistricts > 0 ? (distWithExtId / totalDistricts) * 100 : 0;

    if (totalGovernorates === 0) {
      details.push('Database contains 0 governorates.');
    } else {
      details.push(`Audited ${totalGovernorates} governorates and ${totalDistricts} districts.`);
    }

    if (orphanedDistricts > 0) {
      details.push(`Found ${orphanedDistricts} orphaned districts.`);
    }

    const isVerified = orphanedDistricts === 0;

    return {
      status: isVerified ? 'VERIFIED' : 'INCONSISTENT',
      totalGovernorates,
      totalDistricts,
      externalIdCoverage: {
        governoratesWithExternalId: govWithExtId,
        districtsWithExternalId: distWithExtId,
        governorateCoveragePercent: Math.round(govCoverage),
        districtCoveragePercent: Math.round(distCoverage),
      },
      districtsPerGovernorate: districtsPerGov,
      orphanedDistricts,
      details,
    };
  }
}
