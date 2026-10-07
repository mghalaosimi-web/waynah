import {
  prisma as defaultPrisma,
  type PrismaClient,
  DuplicateCandidateStatus,
} from '@waynah/database';

export interface PlaceMergeResult {
  sourcePlaceId: string;
  targetPlaceId: string;
  mergedAt: Date;
  observationsReassigned: number;
  reviewsReassigned: number;
  requestsReassigned: number;
  favoritesReassigned: number;
  conflictsReassigned: number;
  candidatesUpdated: number;
}

export class PlaceMergeService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Performs an administrative Merge of a source Place into a canonical target Place.
   *
   * Required Invariants:
   * 1. No physical deletion of source Place or PlaceLocation records.
   * 2. Source Place verificationStatus becomes 'CLOSED' (non-public).
   * 3. Canonical target Place remains public.
   * 4. Observations, Reviews, Requests, Favorites, and DataConflicts are reassigned preserving history/provenance.
   * 5. Candidate pair (sourcePlaceId, targetPlaceId) becomes MERGED.
   * 6. Other candidate pairs involving sourcePlaceId become IGNORED.
   * 7. Lexicographic lock order [sourcePlaceId, targetPlaceId].sort() for deadlock prevention.
   */
  public async mergePlaces(
    sourcePlaceId: string,
    targetPlaceId: string,
    _actorId: string,
    prismaClient?: PrismaClient
  ): Promise<PlaceMergeResult> {
    if (!sourcePlaceId || !targetPlaceId) {
      throw new Error('INVALID_MERGE_PARAMETERS');
    }

    if (sourcePlaceId === targetPlaceId) {
      throw new Error('INVALID_MERGE_SAME_PLACE');
    }

    const db = prismaClient ?? this.prisma;

    // Lexicographic ordering for deadlock prevention
    const lockOrder = [sourcePlaceId, targetPlaceId].sort();

    return await db.$transaction(async (tx) => {
      // 1. Lock places in deterministic order
      for (const id of lockOrder) {
        await tx.$queryRaw`SELECT id FROM places WHERE id = ${id} FOR UPDATE`;
      }

      const sourcePlace = await tx.place.findUnique({
        where: { id: sourcePlaceId },
        include: { location: true },
      });

      const targetPlace = await tx.place.findUnique({
        where: { id: targetPlaceId },
        include: { location: true },
      });

      if (!sourcePlace || !targetPlace) {
        throw new Error('PLACE_NOT_FOUND');
      }

      if (sourcePlace.verificationStatus === 'CLOSED') {
        throw new Error('CANNOT_MERGE_CLOSED_PLACE');
      }

      if (targetPlace.verificationStatus === 'CLOSED') {
        throw new Error('CANNOT_MERGE_INTO_CLOSED_TARGET');
      }

      // 2. Reassign PlaceObservations (preserves original metadata & discoveredAt timestamps)
      const obsUpdate = await tx.placeObservation.updateMany({
        where: { placeId: sourcePlaceId },
        data: { placeId: targetPlaceId },
      });

      // 3. Reassign Reviews
      const revUpdate = await tx.review.updateMany({
        where: { placeId: sourcePlaceId },
        data: { placeId: targetPlaceId },
      });

      // 4. Reassign ServiceRequests
      const reqUpdate = await tx.serviceRequest.updateMany({
        where: { placeId: sourcePlaceId },
        data: { placeId: targetPlaceId },
      });

      // 5. Reassign DataConflicts (preserves original status, resolution notes, timestamps & metadata)
      const conflictUpdate = await tx.dataConflict.updateMany({
        where: { placeId: sourcePlaceId },
        data: { placeId: targetPlaceId },
      });

      // 6. Reassign Favorites with unique (userId, placeId) handling
      const sourceFavorites = await tx.favorite.findMany({
        where: { placeId: sourcePlaceId },
      });

      let favoritesReassigned = 0;
      for (const fav of sourceFavorites) {
        const targetFav = await tx.favorite.findUnique({
          where: {
            userId_placeId: {
              userId: fav.userId,
              placeId: targetPlaceId,
            },
          },
        });

        if (targetFav) {
          // User already favorited target place, remove duplicate source favorite
          await tx.favorite.delete({ where: { id: fav.id } });
        } else {
          // Reassign favorite to targetPlace
          await tx.favorite.update({
            where: { id: fav.id },
            data: { placeId: targetPlaceId },
          });
          favoritesReassigned++;
        }
      }

      // 7. Reassign BranchClaims if target place has no active claim
      const targetHasClaim = await tx.branchClaim.findFirst({
        where: {
          placeId: targetPlaceId,
          status: { in: ['PENDING_REVIEW', 'APPROVED'] },
        },
      });

      if (!targetHasClaim) {
        await tx.branchClaim.updateMany({
          where: { placeId: sourcePlaceId },
          data: { placeId: targetPlaceId },
        });
      }

      // 8. Update source Place status to CLOSED (No physical deletion!)
      await tx.place.update({
        where: { id: sourcePlaceId },
        data: {
          verificationStatus: 'CLOSED',
          description: sourcePlace.description
            ? `[MERGED into ${targetPlaceId}] ${sourcePlace.description}`
            : `[MERGED into ${targetPlaceId}]`,
        },
      });

      // 9. Update Duplicate Candidates:
      // a) Pair between (sourcePlaceId, targetPlaceId) becomes MERGED
      const isSourceFirst = sourcePlaceId < targetPlaceId;
      const canonicalSource = isSourceFirst ? sourcePlaceId : targetPlaceId;
      const canonicalTarget = isSourceFirst ? targetPlaceId : sourcePlaceId;

      await tx.duplicateCandidate.updateMany({
        where: {
          sourcePlaceId: canonicalSource,
          targetPlaceId: canonicalTarget,
        },
        data: {
          status: DuplicateCandidateStatus.MERGED,
        },
      });

      // b) All other remaining PENDING candidates involving sourcePlaceId become IGNORED
      const otherCandidates = await tx.duplicateCandidate.updateMany({
        where: {
          OR: [
            { sourcePlaceId: sourcePlaceId },
            { targetPlaceId: sourcePlaceId },
          ],
          status: DuplicateCandidateStatus.PENDING,
        },
        data: {
          status: DuplicateCandidateStatus.IGNORED,
        },
      });

      return {
        sourcePlaceId,
        targetPlaceId,
        mergedAt: new Date(),
        observationsReassigned: obsUpdate.count,
        reviewsReassigned: revUpdate.count,
        requestsReassigned: reqUpdate.count,
        favoritesReassigned,
        conflictsReassigned: conflictUpdate.count,
        candidatesUpdated: 1 + otherCandidates.count,
      };
    });
  }
}
