export interface TimelineActor {
  id: string | null;
  type: 'USER' | 'ADMIN' | 'SYSTEM' | 'UNKNOWN';
}

export interface TimelineRelatedEntity {
  type: string;
  id: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  actor: TimelineActor;
  title: string;
  description: string;
  status?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  metadata?: Record<string, any>;
  relatedEntity?: TimelineRelatedEntity;
}

/**
 * Pure, read-only domain timeline aggregator for Place knowledge history.
 * Aggregates existing database records (Place, PlaceObservation, DataConflict, BranchClaim)
 * into a chronological, deterministic, source-traceable timeline.
 * 
 * Strict architectural guarantees:
 * - Read-only: 0 DB writes or mutations.
 * - Non-destructive: Does not fabricate historical events from state snapshots.
 * - Deterministic: Stable event IDs and tie-breaking sort order.
 */
export function aggregatePlaceTimeline(place: any): TimelineEvent[] {
  if (!place) return [];

  const events: TimelineEvent[] = [];

  // 1. PLACE_CREATED Event (Place.createdAt)
  if (place.createdAt) {
    events.push({
      id: `place-created:${place.id}`,
      type: 'PLACE_CREATED',
      timestamp: new Date(place.createdAt).toISOString(),
      source: 'CANONICAL_DATABASE',
      actor: { id: null, type: 'UNKNOWN' },
      title: 'إنشاء المكان',
      description: `تم إنشاء سجل المكان (${place.nameAr}) في النظام`,
      severity: 'INFO',
      metadata: {
        placeId: place.id,
        nameAr: place.nameAr,
        nameEn: place.nameEn || null,
        verificationStatus: place.verificationStatus,
      },
      relatedEntity: { type: 'Place', id: place.id },
    });
  }

  // 2. OBSERVATION Events (PlaceObservation records)
  if (place.observations && Array.isArray(place.observations)) {
    for (const obs of place.observations) {
      const ts = obs.discoveredAt || obs.createdAt;
      const isCommunity =
        obs.dataSource?.type === 'COMMUNITY_OBSERVATION' ||
        obs.dataSource?.name === 'WAYNAH Community Reports';

      events.push({
        id: `observation:${obs.id}`,
        type: 'OBSERVATION_RECORDED',
        timestamp: new Date(ts).toISOString(),
        source: obs.dataSource?.name || 'SYSTEM_INGESTION',
        actor: { id: null, type: isCommunity ? 'USER' : 'SYSTEM' },
        title: isCommunity ? 'ملاحظة مجتمعية جديدة' : 'رصد ملاحظة بيانات',
        description: `رصد بيانات لموقع المكان: ${obs.name || place.nameAr}`,
        status: obs.status,
        severity: obs.status === 'CONFLICTED' ? 'WARNING' : 'INFO',
        metadata: {
          observationId: obs.id,
          dataSourceId: obs.dataSourceId,
          dataSourceType: obs.dataSource?.type || 'SYSTEM_INGESTION',
          reliabilityWeight: obs.dataSource?.reliabilityWeight ?? 1.0,
          confidenceScore: obs.confidenceScore,
          phone: obs.phone || null,
          coordinates:
            obs.latitude !== null && obs.latitude !== undefined && obs.longitude !== null && obs.longitude !== undefined
              ? { latitude: obs.latitude, longitude: obs.longitude }
              : null,
        },
        relatedEntity: { type: 'PlaceObservation', id: obs.id },
      });
    }
  }

  // 3. CONFLICT Events (DataConflict records)
  if (place.conflicts && Array.isArray(place.conflicts)) {
    for (const conf of place.conflicts) {
      // CONFLICT_CREATED
      events.push({
        id: `conflict-created:${conf.id}`,
        type: 'CONFLICT_CREATED',
        timestamp: new Date(conf.createdAt).toISOString(),
        source: 'DATA_RECONCILIATION',
        actor: { id: null, type: 'SYSTEM' },
        title: 'تعارض بيانات مكتشف',
        description: conf.description || 'تم اكتشاف تعارض بين ملاحظتين للبيانات',
        status: conf.status || 'OPEN',
        severity: 'WARNING',
        metadata: {
          conflictId: conf.id,
          baseObservationId: conf.baseObservationId,
          conflictingObservationId: conf.conflictingObservationId,
        },
        relatedEntity: { type: 'DataConflict', id: conf.id },
      });

      // CONFLICT_RESOLVED (ONLY when resolvedAt is present)
      if (conf.resolvedAt) {
        events.push({
          id: `conflict-resolved:${conf.id}`,
          type: 'CONFLICT_RESOLVED',
          timestamp: new Date(conf.resolvedAt).toISOString(),
          source: 'ADMIN_MODERATION',
          actor: { id: null, type: 'ADMIN' },
          title: 'تم حل تعارض البيانات',
          description: 'تم حسم تعارض البيانات وتسويته بنجاح',
          status: 'RESOLVED',
          severity: 'SUCCESS',
          metadata: {
            conflictId: conf.id,
          },
          relatedEntity: { type: 'DataConflict', id: conf.id },
        });
      }
    }
  }

  // 4. BRANCH CLAIM Events (BranchClaim records)
  if (place.branchClaims && Array.isArray(place.branchClaims)) {
    for (const claim of place.branchClaims) {
      const subTs = claim.submittedAt || claim.createdAt;

      // BRANCH_CLAIM_SUBMITTED
      events.push({
        id: `branch-claim-submitted:${claim.id}`,
        type: 'BRANCH_CLAIM_SUBMITTED',
        timestamp: new Date(subTs).toISOString(),
        source: 'BRANCH_CLAIM',
        actor: { id: claim.claimantId || null, type: 'USER' },
        title: 'تقديم طلب ربط الفرع',
        description: `تم تقديم طلب ربط الفرع بالنشاط التجاري (${claim.business?.name || claim.businessId})`,
        status: claim.status,
        severity: 'INFO',
        metadata: {
          claimId: claim.id,
          businessId: claim.businessId,
          businessName: claim.business?.name || null,
          claimantId: claim.claimantId,
          notes: claim.notes || null,
        },
        relatedEntity: { type: 'BranchClaim', id: claim.id },
      });

      // BRANCH_CLAIM_REVIEWED (when reviewedAt is present)
      if (claim.reviewedAt) {
        let eventType = 'BRANCH_CLAIM_REVIEWED';
        let title = 'مراجعة طلب ربط الفرع';
        let severity: 'SUCCESS' | 'WARNING' | 'INFO' = 'INFO';
        let description = `تمت مراجعة طلب الربط بحالة: ${claim.status}`;

        if (claim.status === 'APPROVED') {
          eventType = 'BRANCH_CLAIM_APPROVED';
          title = 'الموافقة على طلب ربط الفرع';
          severity = 'SUCCESS';
          description = `تمت الموافقة على ربط الفرع بالنشاط التجاري (${claim.business?.name || claim.businessId})`;
        } else if (claim.status === 'REJECTED') {
          eventType = 'BRANCH_CLAIM_REJECTED';
          title = 'رفض طلب ربط الفرع';
          severity = 'WARNING';
          description = `تم رفض طلب ربط الفرع: ${claim.rejectionReason || 'بدون سبب مسبب'}`;
        }

        events.push({
          id: `branch-claim-reviewed:${claim.id}`,
          type: eventType,
          timestamp: new Date(claim.reviewedAt).toISOString(),
          source: 'ADMIN_MODERATION',
          actor: { id: claim.reviewerId || null, type: 'ADMIN' },
          title,
          description,
          status: claim.status,
          severity,
          metadata: {
            claimId: claim.id,
            businessId: claim.businessId,
            businessName: claim.business?.name || null,
            reviewerId: claim.reviewerId || null,
            rejectionReason: claim.rejectionReason || null,
            linkedBusinessId: claim.status === 'APPROVED' ? claim.businessId : undefined,
          },
          relatedEntity: { type: 'BranchClaim', id: claim.id },
        });
      }
    }
  }

  // 5. Deterministic Chronological Sorting (timestamp DESC, with tie-breakers)
  events.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }
    return a.id.localeCompare(b.id);
  });

  return events;
}
