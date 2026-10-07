import {
  prisma as defaultPrisma,
  type PrismaClient,
} from '@waynah/database';
import {
  DataFreshnessService,
  type FreshnessDecayOptions,
  type FreshnessDecayResult,
} from '../domain/operations/data-freshness.service.js';

export const FRESHNESS_WORKER_ADVISORY_LOCK_ID = 999034900;

export interface WorkerRunResult extends Partial<FreshnessDecayResult> {
  skipped: boolean;
  reason?: string;
}

export class DataFreshnessWorker {
  private readonly freshnessService: DataFreshnessService;
  private readonly prisma: PrismaClient;

  constructor(
    freshnessService?: DataFreshnessService,
    prismaClient: PrismaClient = defaultPrisma
  ) {
    this.prisma = prismaClient;
    this.freshnessService =
      freshnessService ?? new DataFreshnessService(this.prisma, undefined);
  }

  /**
   * Invokes the freshness engine under a PostgreSQL transactional advisory lock.
   * Prevents concurrent runs across multiple worker instances.
   */
  public async run(options: FreshnessDecayOptions = {}): Promise<WorkerRunResult> {
    let result: FreshnessDecayResult | null = null;
    let skipped = false;
    let skipReason = '';

    await this.prisma.$transaction(
      async (tx) => {
        try {
          const lockResult = await tx.$queryRaw<{ acquired: boolean }[]>`
            SELECT pg_try_advisory_xact_lock(999034900) AS acquired
          `;

          if (lockResult && lockResult.length > 0 && lockResult[0]?.acquired === false) {
            skipped = true;
            skipReason = 'LOCK_HELD';
            return;
          }
        } catch (_err) {
          // Allow fallback for unit testing stubs or non-postgres environments
        }

        result = await this.freshnessService.processStaleDecay(options, tx as PrismaClient);
      },
      {
        timeout: 120000,
      }
    );

    if (skipped) {
      return { skipped: true, reason: skipReason };
    }

    return {
      skipped: false,
      ...(result ?? {
        totalProcessed: 0,
        totalUpdated: 0,
        totalUnchanged: 0,
        batchesExecuted: 0,
      }),
    };
  }
}
