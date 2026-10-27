import { Prisma } from '../generated/prisma/client.js';
import { getTenantContextStore, type TenantContextStore } from './tenant-context.js';

export const TENANT_SCOPED_MODELS = [
  'Task',
  'TaskComment',
  'Account',
  'Contact',
  'Lead',
  'Deal',
  'Ticket',
  'TicketMessage',
  'Project',
  'Milestone',
  'WorkLog',
  'Team',
  'Activity',
  'AuditEvent',
  'Notification',
];

/**
 * Operations whose `where` argument receives a mandatory `organizationId`
 * equality. With extendedWhereUnique (GA since Prisma 5) this also applies to
 * unique-argument operations (findUnique/update/delete/upsert), so a
 * cross-tenant id degrades to a not-found/P2025 instead of succeeding.
 */
const WHERE_SCOPED_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
  'update',
  'delete',
]);

export type TenantScopeArgs = Record<string, any>;

export type TenantScopeResult =
  | { ok: true; args: TenantScopeArgs }
  | { ok: false; reason: string };

/**
 * Pure decision core of the tenant scoper — unit-testable without a database.
 * Reads and mutations on tenant-scoped models are forced to the active
 * organization; writes carrying a foreign organizationId are rejected.
 */
export function applyTenantScope(
  model: string,
  operation: string,
  args: TenantScopeArgs | undefined,
  ctx: TenantContextStore,
): TenantScopeResult {
  if (!TENANT_SCOPED_MODELS.includes(model) || ctx.isPlatformAdmin) {
    return { ok: true, args: args ?? {} };
  }

  if (!ctx.organizationId) {
    return {
      ok: false,
      reason: `SECURITY_ERROR: Missing tenant organization context for model ${model} (${operation})`,
    };
  }

  const organizationId = ctx.organizationId;
  const scoped: TenantScopeArgs = { ...(args ?? {}) };

  if (operation === 'create') {
    const data = { ...(scoped.data ?? {}) };
    if (data.organizationId && data.organizationId !== organizationId) {
      return {
        ok: false,
        reason: `SECURITY_ERROR: Cross-tenant write blocked. Organization ${organizationId} cannot create resource for ${data.organizationId}`,
      };
    }
    if (!data.organizationId) {
      data.organizationId = organizationId;
    }
    scoped.data = data;
    return { ok: true, args: scoped };
  }

  if (operation === 'upsert') {
    const createData = { ...(scoped.create ?? {}) };
    if (createData.organizationId && createData.organizationId !== organizationId) {
      return {
        ok: false,
        reason: `SECURITY_ERROR: Cross-tenant write blocked. Organization ${organizationId} cannot create resource for ${createData.organizationId}`,
      };
    }
    if (!createData.organizationId) {
      createData.organizationId = organizationId;
    }
    scoped.create = createData;
    scoped.where = { ...(scoped.where ?? {}), organizationId };
    return { ok: true, args: scoped };
  }

  if (WHERE_SCOPED_OPERATIONS.has(operation)) {
    scoped.where = { ...(scoped.where ?? {}), organizationId };
  }

  if (operation === 'update') {
    const data = { ...(scoped.data ?? {}) };
    if (data.organizationId && data.organizationId !== organizationId) {
      return {
        ok: false,
        reason: `SECURITY_ERROR: Cross-tenant write blocked. Organization ${organizationId} cannot re-assign resource to ${data.organizationId}`,
      };
    }
    scoped.data = data;
  }

  return { ok: true, args: scoped };
}

/**
 * Prisma Client Extension ($extends) for Strict Multi-Tenant Scoping
 * (SEC-001 / GATE-002). Applied once via PrismaService.tenantClient; the
 * active organization is read from the per-request AsyncLocalStorage store
 * at operation time, so a single extended client serves every request.
 *
 * Fail-closed semantics:
 * - No AsyncLocalStorage store at all (non-HTTP path without
 *   runAsSystemContext) -> tenant-model queries throw.
 * - Store present but no authenticated organization (public route, or guard
 *   has not run) -> tenant-model queries throw.
 */
export function createTenantScoper() {
  return Prisma.defineExtension({
    name: 'tenant-isolation-extension',
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model?: string;
          operation: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (!model) {
            return query(args);
          }

          const store = getTenantContextStore();
          if (!store) {
            if (TENANT_SCOPED_MODELS.includes(model)) {
              throw new Error(
                `SECURITY_ERROR: No tenant context is active for model ${model}. HTTP requests must pass TenantContextMiddleware; background jobs must wrap execution in runAsSystemContext().`,
              );
            }
            return query(args);
          }

          const result = applyTenantScope(model, operation, args, store);
          if (!result.ok) {
            throw new Error(result.reason);
          }
          return query(result.args);
        },
      },
    },
  });
}
