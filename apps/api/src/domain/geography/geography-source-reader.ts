/**
 * WAYNAH Yemen Geography Source Reader & Mapper
 *
 * Reads raw official UN OCHA Yemen COD-AB GeoJSON dataset files,
 * validates raw schema structure, and maps source properties to the
 * normalized OchaCodAbDatasetInput interface.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  OchaCodAbDatasetInput,
  OchaCodAbGovernorate,
  OchaCodAbDistrict,
} from './geography-pipeline.service.js';

export interface RawSourceReaderOptions {
  admin1FilePath?: string;
  admin2FilePath?: string;
}

export interface ReadSourceResult {
  dataset: OchaCodAbDatasetInput;
  sourceFilePathAdmin1: string;
  sourceFilePathAdmin2: string;
  sourceName: string;
  sourceVersion: string;
  rawGovCount: number;
  rawDistCount: number;
}

function findRawFile(relativePath: string): string {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), '..', relativePath),
    path.resolve(process.cwd(), '..', '..', relativePath),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return candidates[0]!;
}

export class GeographySourceReader {
  /**
   * Reads raw OCHA COD-AB GeoJSON files from disk and maps features into normalized pipeline input schema.
   */
  readFromFiles(options: RawSourceReaderOptions = {}): ReadSourceResult {
    const admin1Path =
      options.admin1FilePath || findRawFile('data/raw/geographic/geojson/yem_admin1.geojson');
    const admin2Path =
      options.admin2FilePath || findRawFile('data/raw/geographic/geojson/yem_admin2.geojson');

    if (!fs.existsSync(admin1Path)) {
      throw new Error(`Raw ADM1 source file not found at path: "${admin1Path}"`);
    }
    if (!fs.existsSync(admin2Path)) {
      throw new Error(`Raw ADM2 source file not found at path: "${admin2Path}"`);
    }

    const admin1Raw = JSON.parse(fs.readFileSync(admin1Path, 'utf8'));
    const admin2Raw = JSON.parse(fs.readFileSync(admin2Path, 'utf8'));

    if (!admin1Raw.features || !Array.isArray(admin1Raw.features)) {
      throw new Error(`Invalid GeoJSON structure in "${admin1Path}": missing features array`);
    }
    if (!admin2Raw.features || !Array.isArray(admin2Raw.features)) {
      throw new Error(`Invalid GeoJSON structure in "${admin2Path}": missing features array`);
    }

    const governorates: OchaCodAbGovernorate[] = admin1Raw.features.map((f: any) => {
      const props = f.properties || {};
      const pcode = (props.adm1_pcode || props.ADM1_PCODE || '').trim();
      const nameAr = (props.adm1_name1 || props.ADM1_AR || props.ADM1_NAME1 || '').trim();
      const nameEn = (props.adm1_name || props.ADM1_EN || props.ADM1_NAME || '').trim() || null;
      const lat = props.center_lat !== undefined ? Number(props.center_lat) : undefined;
      const lon = props.center_lon !== undefined ? Number(props.center_lon) : undefined;

      return {
        ADM1_PCODE: pcode,
        ADM1_AR: nameAr,
        ADM1_EN: nameEn,
        latitude: lat,
        longitude: lon,
      };
    });

    const districts: OchaCodAbDistrict[] = admin2Raw.features.map((f: any) => {
      const props = f.properties || {};
      const pcode = (props.adm2_pcode || props.ADM2_PCODE || '').trim();
      const parentPcode = (props.adm1_pcode || props.ADM1_PCODE || '').trim();
      const nameAr = (props.adm2_name1 || props.ADM2_AR || props.ADM2_NAME1 || '').trim();
      const nameEn = (props.adm2_name || props.ADM2_EN || props.ADM2_NAME || '').trim() || null;
      const geomType = f.geometry?.type;

      return {
        ADM2_PCODE: pcode,
        ADM1_PCODE: parentPcode,
        ADM2_AR: nameAr,
        ADM2_EN: nameEn,
        geometryType: geomType,
        srid: 4326,
      };
    });

    return {
      dataset: {
        governorates,
        districts,
        sourceName: 'OCHA Yemen COD-AB',
        sourceVersion: 'January 2026 Release',
      },
      sourceFilePathAdmin1: admin1Path,
      sourceFilePathAdmin2: admin2Path,
      sourceName: 'OCHA Yemen COD-AB',
      sourceVersion: 'January 2026 Release',
      rawGovCount: governorates.length,
      rawDistCount: districts.length,
    };
  }
}
