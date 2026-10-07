import { prisma as defaultPrisma, PrismaClient, type PlaceObservation } from '@waynah/database';
import { createObservationSchema, type CreateObservationInput } from '@waynah/shared';

export class IngestionService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Ingests a raw place observation into the platform.
   * Validates input data with Zod, checks that the specified DataSource exists,
   * creates the PlaceObservation, and safely updates the PostGIS geography point (geom) if lat/lng are provided.
   *
   * @param input Raw observation data complying with CreateObservationInput schema
   * @returns Created PlaceObservation database record
   */
  async ingestObservation(input: CreateObservationInput): Promise<PlaceObservation> {
    const data = createObservationSchema.parse(input);

    const dataSource = await this.prisma.dataSource.findUnique({
      where: { id: data.dataSourceId },
    });

    if (!dataSource) {
      throw new Error(`DataSource with ID "${data.dataSourceId}" not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const observation = await tx.placeObservation.create({
        data: {
          dataSourceId: data.dataSourceId,
          placeId: data.placeId,
          name: data.name,
          phone: data.phone,
          categoryId: data.categoryId,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          // Domain-owned fields: never sourced from caller input.
          // confidenceScore is computed by ConfidenceScoringService after pipeline completion.
          // status transitions are owned by the discovery pipeline state machine.
          confidenceScore: 0.0,
          status: 'PENDING',
        },
      });

      if (data.latitude !== undefined && data.longitude !== undefined) {
        await tx.$executeRaw`
          UPDATE "place_observations"
          SET "geom" = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography
          WHERE "id" = ${observation.id}
        `;
      }

      return observation;
    });
  }
}
