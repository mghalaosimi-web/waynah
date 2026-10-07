/**
 * WAYNAH — Phase 9 Unit B — Place Merge & Domain Split Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaceMergeService } from '../src/domain/operations/place-merge.service.js';
import { DomainSplitService } from '../src/domain/operations/domain-split.service.js';
import { DuplicateCandidateStatus, type PrismaClient } from '@waynah/database';

function makeMockPrismaForUnitB() {
  const store = {
    places: new Map<string, any>(),
    locations: new Map<string, any>(),
    observations: new Map<string, any>(),
    reviews: new Map<string, any>(),
    requests: new Map<string, any>(),
    favorites: new Map<string, any>(),
    branchClaims: new Map<string, any>(),
    candidates: new Map<string, any>(),
    dataConflicts: new Map<string, any>(),
  };

  const mockPrisma: any = {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockPrisma)),
    $queryRaw: vi.fn().mockResolvedValue([]),

    place: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(store.places.get(where.id) || null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || `plc-${Math.random().toString(36).substring(2, 9)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.places.set(id, record);
        return Promise.resolve(record);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const p = store.places.get(where.id);
        if (p) Object.assign(p, data);
        return Promise.resolve(p || null);
      }),
      delete: vi.fn(), // Prohibited!
    },

    placeLocation: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `loc-${Math.random().toString(36).substring(2, 9)}`;
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.locations.set(id, rec);
        return Promise.resolve(rec);
      }),
      delete: vi.fn(), // Prohibited!
    },

    placeObservation: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const list: any[] = [];
        for (const obs of store.observations.values()) {
          if (where.id?.in && where.id.in.includes(obs.id) && obs.placeId === where.placeId) {
            list.push(obs);
          } else if (where.placeId && obs.placeId === where.placeId) {
            list.push(obs);
          }
        }
        return Promise.resolve(list);
      }),
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        if (where.id?.in) {
          for (const id of where.id.in) {
            const obs = store.observations.get(id);
            if (obs) {
              Object.assign(obs, data);
              count++;
            }
          }
        } else if (where.placeId) {
          for (const obs of store.observations.values()) {
            if (obs.placeId === where.placeId) {
              Object.assign(obs, data);
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      }),
      delete: vi.fn(), // Prohibited!
    },

    review: {
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const r of store.reviews.values()) {
          if (r.placeId === where.placeId) {
            Object.assign(r, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },

    serviceRequest: {
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const req of store.requests.values()) {
          if (req.placeId === where.placeId) {
            Object.assign(req, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },

    dataConflict: {
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const conflict of store.dataConflicts.values()) {
          if (conflict.placeId === where.placeId) {
            Object.assign(conflict, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
      delete: vi.fn(), // Prohibited!
    },

    favorite: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const list: any[] = [];
        for (const f of store.favorites.values()) {
          if (f.placeId === where.placeId) list.push(f);
        }
        return Promise.resolve(list);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
        return Promise.resolve(store.favorites.get(key) || null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        for (const [k, f] of store.favorites.entries()) {
          if (f.id === where.id) {
            Object.assign(f, data);
            store.favorites.delete(k);
            const newKey = `${f.userId}:${f.placeId}`;
            store.favorites.set(newKey, f);
            return Promise.resolve(f);
          }
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        for (const [k, f] of store.favorites.entries()) {
          if (f.id === where.id) {
            store.favorites.delete(k);
            return Promise.resolve(f);
          }
        }
        return Promise.resolve(null);
      }),
    },

    branchClaim: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        for (const c of store.branchClaims.values()) {
          if (c.placeId === where.placeId && where.status.in.includes(c.status)) {
            return Promise.resolve(c);
          }
        }
        return Promise.resolve(null);
      }),
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const c of store.branchClaims.values()) {
          if (c.placeId === where.placeId) {
            Object.assign(c, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },

    duplicateCandidate: {
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const cand of store.candidates.values()) {
          if (where.status && cand.status !== where.status) {
            continue;
          }

          const matchSourceTarget = cand.sourcePlaceId === where.sourcePlaceId && cand.targetPlaceId === where.targetPlaceId;
          const matchOR = where.OR && where.OR.some((cond: any) => {
            return cond.sourcePlaceId === cand.sourcePlaceId || cond.targetPlaceId === cand.sourcePlaceId;
          });

          if (matchSourceTarget || matchOR) {
            Object.assign(cand, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },

    _store: store,
  };

  return mockPrisma;
}

describe('WAYNAH Phase 9 Unit B — Place Merge & Domain Split Domain Tests', () => {
  let mockPrisma: ReturnType<typeof makeMockPrismaForUnitB>;
  let mergeService: PlaceMergeService;
  let splitService: DomainSplitService;

  beforeEach(() => {
    mockPrisma = makeMockPrismaForUnitB();
    mergeService = new PlaceMergeService(mockPrisma as unknown as PrismaClient);
    splitService = new DomainSplitService(mockPrisma as unknown as PrismaClient);

    // Seed test Places
    mockPrisma._store.places.set('plc-src', {
      id: 'plc-src',
      nameAr: 'مطعم السعادة الأصلي',
      verificationStatus: 'UNVERIFIED',
      categoryId: 'cat-1',
      districtId: 'dist-1',
      description: 'وصف قديم',
    });

    mockPrisma._store.places.set('plc-tgt', {
      id: 'plc-tgt',
      nameAr: 'مطعم السعادة الرئيسي',
      verificationStatus: 'UNVERIFIED',
      categoryId: 'cat-1',
      districtId: 'dist-1',
      description: 'وصف رئيسي',
    });

    // Seed Observation
    mockPrisma._store.observations.set('obs-1', {
      id: 'obs-1',
      placeId: 'plc-src',
      name: 'رصد السعادة',
      confidenceScore: 0.9,
    });

    // Seed DuplicateCandidate
    const candKey = 'plc-src:plc-tgt';
    mockPrisma._store.candidates.set(candKey, {
      id: 'cand-1',
      sourcePlaceId: 'plc-src',
      targetPlaceId: 'plc-tgt',
      candidateScore: 0.85,
      status: DuplicateCandidateStatus.PENDING,
    });
  });

  // B1: Successful Place Merge
  it('1. Successful Place Merge reassigns observations & updates statuses cleanly', async () => {
    const result = await mergeService.mergePlaces('plc-src', 'plc-tgt', 'usr-admin-1');

    expect(result).toBeDefined();
    expect(result.observationsReassigned).toBe(1);

    // Check source place status is CLOSED
    const sourcePlace = mockPrisma._store.places.get('plc-src');
    expect(sourcePlace.verificationStatus).toBe('CLOSED');

    // Check observation is reassigned to targetPlace
    const obs = mockPrisma._store.observations.get('obs-1');
    expect(obs.placeId).toBe('plc-tgt');

    // Check candidate status is MERGED
    const cand = mockPrisma._store.candidates.get('plc-src:plc-tgt');
    expect(cand.status).toBe(DuplicateCandidateStatus.MERGED);
  });

  // B2: Source Place Never Physically Deleted
  it('2. Source Place is NEVER physically deleted during merge', async () => {
    await mergeService.mergePlaces('plc-src', 'plc-tgt', 'usr-admin-1');

    expect(mockPrisma.place.delete).not.toHaveBeenCalled();
    expect(mockPrisma.placeLocation.delete).not.toHaveBeenCalled();
    expect(mockPrisma.placeObservation.delete).not.toHaveBeenCalled();
    expect(mockPrisma._store.places.has('plc-src')).toBe(true);
  });

  // B3: Cannot merge closed source place
  it('3. Attempting to merge an already CLOSED source Place throws CANNOT_MERGE_CLOSED_PLACE', async () => {
    mockPrisma._store.places.get('plc-src').verificationStatus = 'CLOSED';

    await expect(mergeService.mergePlaces('plc-src', 'plc-tgt', 'usr-admin-1')).rejects.toThrow('CANNOT_MERGE_CLOSED_PLACE');
  });

  // B4: Cannot merge place into itself
  it('4. Attempting to merge place into itself throws INVALID_MERGE_SAME_PLACE', async () => {
    await expect(mergeService.mergePlaces('plc-src', 'plc-src', 'usr-admin-1')).rejects.toThrow('INVALID_MERGE_SAME_PLACE');
  });

  // B5: Favorites Reassignment & Deduplication
  it('5. Favorites are reassigned to target place without duplicate constraint errors', async () => {
    // User 1 favorited source
    mockPrisma._store.favorites.set('usr-1:plc-src', {
      id: 'fav-1',
      userId: 'usr-1',
      placeId: 'plc-src',
    });

    // User 2 favorited BOTH source and target
    mockPrisma._store.favorites.set('usr-2:plc-src', {
      id: 'fav-2-src',
      userId: 'usr-2',
      placeId: 'plc-src',
    });
    mockPrisma._store.favorites.set('usr-2:plc-tgt', {
      id: 'fav-2-tgt',
      userId: 'usr-2',
      placeId: 'plc-tgt',
    });

    const result = await mergeService.mergePlaces('plc-src', 'plc-tgt', 'usr-admin-1');
    expect(result.favoritesReassigned).toBe(1); // Only fav-1 reassigned, fav-2-src deleted as duplicate

    expect(mockPrisma._store.favorites.has('usr-1:plc-tgt')).toBe(true);
    expect(mockPrisma._store.favorites.has('usr-2:plc-tgt')).toBe(true);
  });

  // B6: Domain Split Execution
  it('6. Domain Split creates a new canonical Place and reassigns designated observations', async () => {
    const splitInput = {
      sourcePlaceId: 'plc-src',
      newPlace: {
        nameAr: 'صيدلية السعادة الجانبية',
        categoryId: 'cat-pharma',
        districtId: 'dist-1',
        latitude: 15.35,
        longitude: 44.2,
      },
      observationIdsToMove: ['obs-1'],
    };

    const result = await splitService.splitDomain(splitInput, 'usr-admin-1');

    expect(result).toBeDefined();
    expect(result.newPlaceId).toBeDefined();
    expect(result.observationsMoved).toBe(1);

    const obs = mockPrisma._store.observations.get('obs-1');
    expect(obs.placeId).toBe(result.newPlaceId);

    const newPlace = mockPrisma._store.places.get(result.newPlaceId);
    expect(newPlace.nameAr).toBe('صيدلية السعادة الجانبية');
    expect(newPlace.verificationStatus).toBe('UNVERIFIED');
  });

  // B7: Unmerge Rejection
  it('7. Unmerge requests are rejected with UNMERGE_OUT_OF_SCOPE', async () => {
    const unmergeInput = {
      sourcePlaceId: 'plc-tgt',
      newPlace: {
        nameAr: 'مكان ملغي',
        categoryId: 'cat-1',
        districtId: 'dist-1',
        latitude: 15.35,
        longitude: 44.2,
      },
      observationIdsToMove: ['obs-1'],
      isUnmerge: true,
    };

    await expect(splitService.splitDomain(unmergeInput, 'usr-admin-1')).rejects.toThrow('UNMERGE_OUT_OF_SCOPE');
  });

  // B8: DataConflict Re-linking & Preservation During Merge
  it('8. DataConflict records linked to source place are re-linked to target place and preserved without deletion', async () => {
    mockPrisma._store.dataConflicts.set('conflict-1', {
      id: 'conflict-1',
      placeId: 'plc-src',
      description: 'تعارض اسم بين مصدرين',
      baseObservationId: 'obs-base-1',
      conflictingObservationId: 'obs-conf-1',
      status: 'OPEN',
      resolvedAt: null,
      createdAt: new Date('2026-01-01'),
    });

    const result = await mergeService.mergePlaces('plc-src', 'plc-tgt', 'usr-admin-1');

    expect(result.conflictsReassigned).toBe(1);

    // Verify DataConflict was NOT deleted
    expect(mockPrisma.dataConflict.delete).not.toHaveBeenCalled();

    // Verify DataConflict is re-linked to target place and history/metadata is intact
    const conflict = mockPrisma._store.dataConflicts.get('conflict-1');
    expect(conflict).toBeDefined();
    expect(conflict.placeId).toBe('plc-tgt');
    expect(conflict.status).toBe('OPEN');
    expect(conflict.description).toBe('تعارض اسم بين مصدرين');
    expect(conflict.baseObservationId).toBe('obs-base-1');
  });
});
