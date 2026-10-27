import { Logger } from '@nestjs/common';

const logger = new Logger('ProductionReadiness');

/**
 * Domains that still resolve to an InMemory repository even with
 * USE_DATABASE=true (GAP-001 / GATE-003). Shrink this list as Prisma
 * repositories land; when it is empty the gate below passes by itself.
 * `pnpm audit:persistence` reports the same reality from app.module.ts.
 */
export const DOMAINS_WITHOUT_DURABLE_REPOSITORY: readonly string[] = [
  'documents',
  'webhook',
];

export function assertProductionReadiness(env: Record<string, string | undefined> = process.env): void {
  const isProd = env.NODE_ENV === 'production';
  if (!isProd) {
    return;
  }

  const errors: string[] = [];

  // 1. Persistence Gate (AUDIT-2026-001 / RA-005): Must not use in-memory database in production
  if (env.USE_DATABASE !== 'true') {
    errors.push(
      'USE_DATABASE=true is required in production. Running with InMemory repositories in production is strictly forbidden.',
    );
  } else if (DOMAINS_WITHOUT_DURABLE_REPOSITORY.length > 0) {
    // Fail-closed even in "database mode": silent InMemory fallback for any
    // domain would fake durability (GAP-001). Refusing to start with the
    // exact gap named beats silently losing data.
    errors.push(
      `Durable persistence incomplete (GATE-003 / GAP-001): domains [${DOMAINS_WITHOUT_DURABLE_REPOSITORY.join(
        ', ',
      )}] still resolve to InMemory repositories. Implement their Prisma repositories before production startup.`,
    );
  }

  if (env.ALLOW_IN_MEMORY_REPOSITORIES === 'true') {
    errors.push(
      'ALLOW_IN_MEMORY_REPOSITORIES must not be enabled in production. All enterprise domains require database-backed persistence.',
    );
  }

  // 2. Authentication Secrets Gate (RA-001 / RA-002): Must have dedicated secure secret
  const defaultSecret = 'crm-platform-secure-jwt-hmac-sha256-secret-key-32-chars-minimum';
  if (!env.JWT_SECRET || env.JWT_SECRET === defaultSecret) {
    errors.push(
      'JWT_SECRET must be configured with a unique, cryptographically strong secret in production.',
    );
  }

  // 3. Insecure Development Bypass Gate (RA-001): Insecure auth bypass cannot be active in prod
  if (env.ALLOW_INSECURE_DEV_AUTH === 'true') {
    errors.push(
      'ALLOW_INSECURE_DEV_AUTH must not be enabled in production environments.',
    );
  }

  if (errors.length > 0) {
    logger.error('CRITICAL: Production readiness validation failed:');
    for (const err of errors) {
      logger.error(` - ${err}`);
    }
    throw new Error(
      `[FATAL] Production startup failed due to security/persistence gates:\n${errors.join('\n')}`,
    );
  }

  logger.log('✓ Production readiness verification passed: Security and persistence gates validated.');
}
