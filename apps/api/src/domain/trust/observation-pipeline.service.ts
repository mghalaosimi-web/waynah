import {
  prisma as defaultPrisma,
  type PrismaClient,
} from '@waynah/database';
import { ConfidenceScoringService } from '../intelligence/confidence-scoring.service.js';

export interface SubmitObservationInput {
  placeId?: string | null;
  dataSourceId: string;
  name?: string | null;
  phone?: string | null;
  categoryId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export class ObservationPipelineService {
  private readonly prisma: PrismaClient;
  private readonly scoringService: ConfidenceScoringService;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
    this.scoringService = new ConfidenceScoringService(prismaClient);
  }

  /**
   * Submits a field or community observation, assigns attribution & calculates confidence score.
   */
  public async submitObservation(input: SubmitObservationInput) {
    const dataSource = await this.prisma.dataSource.findUnique({
      where: { id: input.dataSourceId },
    });

    if (!dataSource) {
      throw new Error('DATA_SOURCE_NOT_FOUND');
    }

    let relatedObservations: any[] = [];
    if (input.placeId) {
      relatedObservations = await this.prisma.placeObservation.findMany({
        where: { placeId: input.placeId },
      });
    }

    // Temporary PlaceObservation structure to compute initial score
    const tempObs = {
      id: 'temp',
      placeId: input.placeId || null,
      dataSourceId: input.dataSourceId,
      name: input.name || null,
      phone: input.phone || null,
      categoryId: input.categoryId || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      confidenceScore: 0,
      status: 'PENDING',
      discoveredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const initialScore = this.scoringService.calculateScore(
      tempObs,
      dataSource,
      relatedObservations
    );

    const observation = await this.prisma.placeObservation.create({
      data: {
        placeId: input.placeId || null,
        dataSourceId: input.dataSourceId,
        name: input.name || null,
        phone: input.phone || null,
        categoryId: input.categoryId || null,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        confidenceScore: initialScore,
        status: 'PENDING',
      },
      include: {
        dataSource: true,
        place: true,
      },
    });

    return observation;
  }

  /**
   * Lists observations with optional placeId or status filter.
   */
  public async listObservations(filter?: { placeId?: string; status?: string }) {
    const where: any = {};
    if (filter?.placeId) {
      where.placeId = filter.placeId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    return await this.prisma.placeObservation.findMany({
      where,
      include: {
        dataSource: true,
        place: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Moderates observation status (PENDING -> APPROVED / REJECTED).
   */
  public async moderateObservation(observationId: string, status: 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED') {
    const observation = await this.prisma.placeObservation.findUnique({
      where: { id: observationId },
    });

    if (!observation) {
      throw new Error('OBSERVATION_NOT_FOUND');
    }

    const updated = await this.prisma.placeObservation.update({
      where: { id: observationId },
      data: { status },
      include: {
        dataSource: true,
        place: true,
      },
    });

    return updated;
  }
}
