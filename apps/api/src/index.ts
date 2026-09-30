import { WAYNAH_PLATFORM_NAME } from '@waynah/shared';
import { verifySpatialConnection } from '@waynah/database';

console.log(`${WAYNAH_PLATFORM_NAME} API initialized`);

export async function checkDatabase() {
  const health = await verifySpatialConnection();
  console.log('Spatial DB Health:', health);
  return health;
}

export * from './domain/discovery/ingestion.service.js';
export * from './domain/discovery/entity-resolution.service.js';
export * from './domain/discovery/change-detection.service.js';
export * from './domain/discovery/discovery-orchestrator.service.js';
export * from './domain/intelligence/confidence-scoring.service.js';
export * from './domain/search/search.service.js';
export * from './domain/user/user-favorites.service.js';
export * from './domain/user/user-requests.service.js';
export * from './routes/v1/search.routes.js';
export * from './routes/v1/discovery.routes.js';
export * from './routes/v1/user.routes.js';
export * from './server.js';





