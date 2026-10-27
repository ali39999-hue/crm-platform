import { describe, expect, it } from 'vitest';
import {
  applyTenantScope,
  TENANT_SCOPED_MODELS,
} from './tenant-scoper.js';
import {
  createTenantContextStore,
  getTenantContextStore,
  runAsSystemContext,
  runWithTenantContext,
  setTenantIdentity,
} from './tenant-context.js';
import { TenantContextMiddleware } from '../common/auth/tenant-context.middleware.js';

const ORG_A = 'org-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORG_B = 'org-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function ctxWith(orgId: string | undefined, isPlatformAdmin = false) {
  const store = createTenantContextStore();
  if (orgId) setTenantIdentity(store, orgId, isPlatformAdmin);
  return store;
}

describe('applyTenantScope (SEC-001 pure core)', () => {
  it('passes through non-tenant models untouched', () => {
    const result = applyTenantScope('SomePlatformModel', 'findMany', { where: { id: 'x' } }, ctxWith(ORG_A));
    expect(result).toEqual({ ok: true, args: { where: { id: 'x' } } });
  });

  it('bypasses scoping for platform admin (system context)', () => {
    const result = applyTenantScope('Task', 'findMany', {}, ctxWith(ORG_B, true));
    expect(result.ok).toBe(true);
  });

  it('fails closed when no organization is set', () => {
    const result = applyTenantScope('Task', 'findMany', {}, ctxWith(undefined));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('Missing tenant organization context');
  });

  it('merges organizationId into findMany where', () => {
    const result = applyTenantScope('Task', 'findMany', { where: { status: 'TODO' } }, ctxWith(ORG_A));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.where).toEqual({ status: 'TODO', organizationId: ORG_A });
  });

  it('merges organizationId into unique where for findUnique (extendedWhereUnique)', () => {
    const result = applyTenantScope('Task', 'findUnique', { where: { id: 't1' } }, ctxWith(ORG_A));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.where).toEqual({ id: 't1', organizationId: ORG_A });
  });

  it('merges organizationId into update and delete where (cross-tenant mutation becomes P2025)', () => {
    for (const op of ['update', 'delete', 'updateMany', 'deleteMany']) {
      const result = applyTenantScope('Task', op, { where: { id: 't1' }, data: { title: 'x' } }, ctxWith(ORG_A));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.args.where.organizationId).toBe(ORG_A);
    }
  });

  it('merges organizationId into aggregate and groupBy where', () => {
    for (const op of ['aggregate', 'groupBy', 'count']) {
      const result = applyTenantScope('Deal', op, { where: {} }, ctxWith(ORG_A));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.args.where.organizationId).toBe(ORG_A);
    }
  });

  it('fills missing organizationId on create and blocks foreign one', () => {
    const filled = applyTenantScope('Account', 'create', { data: { name: 'Acme' } }, ctxWith(ORG_A));
    expect(filled.ok).toBe(true);
    if (filled.ok) expect(filled.args.data.organizationId).toBe(ORG_A);

    const blocked = applyTenantScope('Account', 'create', { data: { name: 'Acme', organizationId: ORG_B } }, ctxWith(ORG_A));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toContain('Cross-tenant write blocked');
  });

  it('blocks foreign organizationId on update data (re-assign guard)', () => {
    const result = applyTenantScope('Task', 'update', { where: { id: 't1' }, data: { organizationId: ORG_B } }, ctxWith(ORG_A));
    expect(result.ok).toBe(false);
  });

  it('scopes upsert create data and where', () => {
    const result = applyTenantScope('Contact', 'upsert', { where: { email: 'a@b.c' }, create: { email: 'a@b.c' }, update: { email: 'a@b.c' } }, ctxWith(ORG_A));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.args.create.organizationId).toBe(ORG_A);
      expect(result.args.where.organizationId).toBe(ORG_A);
    }
  });

  it('does not mutate the caller-supplied args object', () => {
    const args = { where: { id: 't1' } };
    applyTenantScope('Task', 'findUnique', args, ctxWith(ORG_A));
    expect(args.where).toEqual({ id: 't1' });
  });

  it('covers every scoped model uniformly', () => {
    for (const model of TENANT_SCOPED_MODELS) {
      const result = applyTenantScope(model, 'findMany', {}, ctxWith(ORG_A));
      expect(result.ok).toBe(true);
    }
  });
});

describe('per-request tenant context wiring', () => {
  it('TenantContextMiddleware opens a store visible for the whole handler chain', () => {
    const middleware = new TenantContextMiddleware();
    let seen: ReturnType<typeof getTenantContextStore>;
    middleware.use({} as any, {} as any, () => {
      seen = getTenantContextStore();
    });
    expect(seen!.contextReady).toBe(true);
    expect(seen!.organizationId).toBeUndefined();
    // Outside the middleware chain the store is gone again.
    expect(getTenantContextStore()).toBeUndefined();
  });

  it('AuthGuard identity lands in the store opened by the middleware', () => {
    const middleware = new TenantContextMiddleware();
    let scoped: ReturnType<typeof applyTenantScope>;
    middleware.use({} as any, {} as any, () => {
      const store = getTenantContextStore()!;
      // Simulates AuthGuard after token verification:
      setTenantIdentity(store, ORG_A);
      scoped = applyTenantScope('Task', 'findMany', { where: {} }, store);
    });
    expect(scoped!.ok).toBe(true);
    if (scoped!.ok) expect(scoped!.args.where.organizationId).toBe(ORG_A);
  });

  it('unauthenticated request inside middleware fails closed for tenant models', () => {
    const middleware = new TenantContextMiddleware();
    let result: ReturnType<typeof applyTenantScope>;
    middleware.use({} as any, {} as any, () => {
      const store = getTenantContextStore()!;
      // No AuthGuard ran (public route): identity stays unset.
      result = applyTenantScope('Ticket', 'findMany', { where: {} }, store);
    });
    expect(result!.ok).toBe(false);
  });

  it('runAsSystemContext bypasses scoping for background jobs', () => {
    const outside = applyTenantScope('Task', 'findMany', { where: {} }, ctxWith(undefined));
    expect(outside.ok).toBe(false);

    runAsSystemContext(() => {
      const store = getTenantContextStore()!;
      expect(store.isPlatformAdmin).toBe(true);
      const result = applyTenantScope('Task', 'findMany', { where: {} }, store);
      expect(result.ok).toBe(true);
    });
  });

  it('store is request-local: sibling runs do not leak identity', () => {
    runWithTenantContext(createTenantContextStore(), () => {
      setTenantIdentity(getTenantContextStore()!, ORG_A);
      expect(getTenantContextStore()!.organizationId).toBe(ORG_A);
    });
    expect(getTenantContextStore()).toBeUndefined();
  });
});
