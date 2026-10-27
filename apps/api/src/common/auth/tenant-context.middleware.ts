import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createTenantContextStore, runWithTenantContext } from '../../prisma/tenant-context.js';

/**
 * Opens the per-request tenant AsyncLocalStorage scope for every route,
 * before guards run. AuthGuard fills the identity after token verification;
 * the Prisma tenant-scoper reads it at query time (SEC-001 / GATE-002).
 *
 * Tenant-model queries executed outside this scope fail closed, so background
 * work must use runAsSystemContext() explicitly.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction): void {
    runWithTenantContext(createTenantContextStore(), () => next());
  }
}
