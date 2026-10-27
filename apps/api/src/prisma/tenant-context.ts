import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request tenant identity store (SEC-001 / GATE-002 / GAP-006).
 *
 * A single AsyncLocalStorage carries the active organization for the whole
 * request chain. TenantContextMiddleware opens the store before guards run;
 * AuthGuard fills it after token verification; the Prisma tenant-scoper
 * extension reads it at query time (late binding), so the tenant identity is
 * never taken from request input.
 */
export type TenantContextStore = {
  /** Undefined until AuthGuard resolves an authenticated user. */
  organizationId: string | undefined;
  isPlatformAdmin: boolean;
  /** True once the request entered TenantContextMiddleware. */
  contextReady: boolean;
};

const tenantStorage = new AsyncLocalStorage<TenantContextStore>();

export function createTenantContextStore(): TenantContextStore {
  return { organizationId: undefined, isPlatformAdmin: false, contextReady: true };
}

export function runWithTenantContext<T>(store: TenantContextStore, fn: () => T): T {
  return tenantStorage.run(store, fn);
}

export function getTenantContextStore(): TenantContextStore | undefined {
  return tenantStorage.getStore();
}

export function setTenantIdentity(
  store: TenantContextStore,
  organizationId: string,
  isPlatformAdmin = false,
): void {
  store.organizationId = organizationId;
  store.isPlatformAdmin = isPlatformAdmin;
}

/**
 * Explicit escape hatch for non-HTTP execution paths (background jobs,
 * schedulers, seed scripts) that legitimately need unscoped access.
 * Never call this inside an HTTP request — there the middleware + guard
 * provide the real tenant identity.
 */
export function runAsSystemContext<T>(fn: () => T): T {
  return tenantStorage.run(
    { organizationId: undefined, isPlatformAdmin: true, contextReady: true },
    fn,
  );
}
