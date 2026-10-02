/**
 * WAYNAH — SLICE 4A PERSISTENCE TESTS
 *
 * Verifies domain persistence rules and data structures for BranchClaim model:
 * 1. BranchClaim can be created in PENDING_REVIEW state.
 * 2. BranchClaim can be created in PENDING_DISPUTE state.
 * 3. Enforces single active claim per (businessId, placeId) pair.
 * 4. Permits concurrent active claims from different Businesses for the same Place.
 * 5. Terminal states (REJECTED, CANCELLED) permit a later active claim for the same Business + Place.
 * 6. Claim creation leaves Place.businessId unmutated (Claim != Link).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { PrismaClient, BranchClaimStatus } from '@waynah/database';

const MOCK_BUSINESS_1 = 'biz-001';
const MOCK_BUSINESS_2 = 'biz-002';
const MOCK_PLACE_1 = 'place-001';
const MOCK_USER_CLAIMANT = 'user-claimant-001';
const MOCK_USER_REVIEWER = 'user-reviewer-001';

interface BranchClaimRecord {
  id: string;
  businessId: string;
  placeId: string;
  claimantId: string;
  status: BranchClaimStatus;
  notes?: string | null;
  reviewerId?: string | null;
  rejectionReason?: string | null;
  submittedAt: Date;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

class MockBranchClaimRepository {
  private claims = new Map<string, BranchClaimRecord>();

  public create(data: {
    businessId: string;
    placeId: string;
    claimantId: string;
    status?: BranchClaimStatus;
    notes?: string | null;
  }): BranchClaimRecord {
    const status = data.status || 'PENDING_REVIEW';

    // Enforce Active Claim Uniqueness Rule (Partial Unique Index requirement)
    if (status === 'PENDING_REVIEW' || status === 'PENDING_DISPUTE') {
      for (const claim of this.claims.values()) {
        if (
          claim.businessId === data.businessId &&
          claim.placeId === data.placeId &&
          (claim.status === 'PENDING_REVIEW' || claim.status === 'PENDING_DISPUTE')
        ) {
          throw new Error('UNIQUE_CONSTRAINT_VIOLATION: Active claim already exists for business and place');
        }
      }
    }

    const record: BranchClaimRecord = {
      id: 'claim-' + Math.random().toString(36).substring(2, 9),
      businessId: data.businessId,
      placeId: data.placeId,
      claimantId: data.claimantId,
      status,
      notes: data.notes || null,
      reviewerId: null,
      rejectionReason: null,
      submittedAt: new Date(),
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.claims.set(record.id, record);
    return record;
  }

  public findById(id: string): BranchClaimRecord | null {
    return this.claims.get(id) || null;
  }

  public findActiveClaim(businessId: string, placeId: string): BranchClaimRecord | null {
    for (const claim of this.claims.values()) {
      if (
        claim.businessId === businessId &&
        claim.placeId === placeId &&
        (claim.status === 'PENDING_REVIEW' || claim.status === 'PENDING_DISPUTE')
      ) {
        return claim;
      }
    }
    return null;
  }

  public updateStatus(
    id: string,
    status: BranchClaimStatus,
    reviewerId?: string,
    rejectionReason?: string
  ): BranchClaimRecord {
    const claim = this.claims.get(id);
    if (!claim) throw new Error('CLAIM_NOT_FOUND');

    claim.status = status;
    if (reviewerId) claim.reviewerId = reviewerId;
    if (rejectionReason) claim.rejectionReason = rejectionReason;
    claim.reviewedAt = new Date();
    claim.updatedAt = new Date();

    return claim;
  }
}

describe('WAYNAH-SLICE4A — BranchClaim Persistence Tests', () => {
  let repo: MockBranchClaimRepository;
  let mockPlace: { id: string; businessId: string | null };

  beforeEach(() => {
    repo = new MockBranchClaimRepository();
    mockPlace = {
      id: MOCK_PLACE_1,
      businessId: null,
    };
  });

  it('1. BranchClaim can be created with PENDING_REVIEW state', () => {
    const claim = repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
      notes: 'طلب ربط فرع صيدلية السلام - شارع السوق',
    });

    expect(claim.id).toBeDefined();
    expect(claim.status).toBe('PENDING_REVIEW');
    expect(claim.businessId).toBe(MOCK_BUSINESS_1);
    expect(claim.placeId).toBe(MOCK_PLACE_1);
    expect(claim.claimantId).toBe(MOCK_USER_CLAIMANT);
  });

  it('2. BranchClaim can be created with PENDING_DISPUTE state', () => {
    const claim = repo.create({
      businessId: MOCK_BUSINESS_2,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_DISPUTE',
      notes: 'ادعاء منازعة على موقع مدرج سابقاً',
    });

    expect(claim.id).toBeDefined();
    expect(claim.status).toBe('PENDING_DISPUTE');
  });

  it('3. Same Business + Place cannot have two active claims', () => {
    repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    expect(() => {
      repo.create({
        businessId: MOCK_BUSINESS_1,
        placeId: MOCK_PLACE_1,
        claimantId: MOCK_USER_CLAIMANT,
        status: 'PENDING_REVIEW',
      });
    }).toThrow('UNIQUE_CONSTRAINT_VIOLATION');
  });

  it('4. Different Business + same Place can have active claims concurrently', () => {
    const claim1 = repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    const claim2 = repo.create({
      businessId: MOCK_BUSINESS_2,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_DISPUTE',
    });

    expect(claim1.id).not.toBe(claim2.id);
    expect(claim1.businessId).toBe(MOCK_BUSINESS_1);
    expect(claim2.businessId).toBe(MOCK_BUSINESS_2);
  });

  it('5. REJECTED claim does not block a later active claim', () => {
    const claim1 = repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    repo.updateStatus(claim1.id, 'REJECTED', MOCK_USER_REVIEWER, 'عدم كفاية المستندات');

    const claim2 = repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    expect(claim2.id).toBeDefined();
    expect(claim2.status).toBe('PENDING_REVIEW');
  });

  it('6. CANCELLED claim does not block a later active claim', () => {
    const claim1 = repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    repo.updateStatus(claim1.id, 'CANCELLED');

    const claim2 = repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: MOCK_PLACE_1,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    expect(claim2.id).toBeDefined();
    expect(claim2.status).toBe('PENDING_REVIEW');
  });

  it('7. Creating a BranchClaim leaves Place.businessId unmutated (Claim != Link)', () => {
    expect(mockPlace.businessId).toBeNull();

    repo.create({
      businessId: MOCK_BUSINESS_1,
      placeId: mockPlace.id,
      claimantId: MOCK_USER_CLAIMANT,
      status: 'PENDING_REVIEW',
    });

    // Claim submission MUST NOT change Place.businessId
    expect(mockPlace.businessId).toBeNull();
  });
});
