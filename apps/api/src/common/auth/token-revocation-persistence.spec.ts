import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TokenService } from './token.service.js';

function makePersistence() {
  const store: Array<{ key: string; kind: string; expiresAt: number }> = [];
  return {
    store,
    persistedCount: () => store.length,
    restore: vi.fn(async () => store.map((e) => ({ ...e }))),
    persist: vi.fn(async (entry: { key: string; kind: string; expiresAt: number }) => {
      const idx = store.findIndex((e) => e.key === entry.key);
      if (idx >= 0) store[idx] = { ...entry };
      else store.push({ ...entry });
    }),
    purgeExpired: vi.fn(async (now = Date.now()) => {
      const before = store.length;
      for (let i = store.length - 1; i >= 0; i--) {
        if (store[i]!.expiresAt <= now) store.splice(i, 1);
      }
      return before - store.length;
    }),
  };
}

describe('TokenService revocation persistence (P02 session lifecycle)', () => {
  it('writes through every revocation in database mode', async () => {
    const persistence = makePersistence();
    const service = new TokenService('test-secret-key-at-least-32-chars-long-12345', 900, 604800, persistence);
    process.env.USE_DATABASE = 'true';
    try {
      await service.onModuleInit();
      service.revokeToken('jti-1', 4_000_000_000);
      service.revokeSession('session-1');
      service.revokeAllForUser('user-1');
      await new Promise((r) => setTimeout(r, 10)); // flush fire-and-forget writes
      expect(persistence.persistedCount()).toBeGreaterThanOrEqual(3);
      expect(persistence.store.some((e) => e.key === 'jti-1' && e.kind === 'token')).toBe(true);
      expect(persistence.store.some((e) => e.key === 'session-1' && e.kind === 'session')).toBe(true);
      expect(persistence.store.some((e) => e.key === 'user-1' && e.kind === 'user')).toBe(true);
    } finally {
      delete process.env.USE_DATABASE;
    }
  });

  it('restores revocations at boot so restarts cannot resurrect logged-out tokens', async () => {
    const persistence = makePersistence();
    persistence.store.push(
      { key: 'jti-lost', kind: 'token', expiresAt: Date.now() + 3_600_000 },
      { key: 'session-lost', kind: 'session', expiresAt: Date.now() + 3_600_000 },
      { key: 'user-lost', kind: 'user', expiresAt: Date.now() + 3_600_000 },
      { key: 'expired-entry', kind: 'token', expiresAt: Date.now() - 1000 },
    );
    const service = new TokenService('test-secret-key-at-least-32-chars-long-12345', 900, 604800, persistence);
    process.env.USE_DATABASE = 'true';
    try {
      await service.onModuleInit();
      expect(service.isRevoked('jti-lost')).toBe(true);
      expect(service.isRevoked('session-lost')).toBe(true);
      expect(service.isRevoked('expired-entry')).toBe(false); // purged
      // user-wide revocation is consulted through the payload path
      expect(
        service.isRevoked({
          jti: 'fresh-jti',
          sub: 'user-lost',
          email: 'u@o.c',
          orgId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          role: 'Employee',
          type: 'access',
          sessionId: 'fresh-session',
          iat: 1,
          exp: 4_000_000_000,
        } as any),
      ).toBe(true);
    } finally {
      delete process.env.USE_DATABASE;
    }
  });

  it('does not persist in fixture mode (dev/E2E behavior unchanged)', async () => {
    const persistence = makePersistence();
    const service = new TokenService('test-secret-key-at-least-32-chars-long-12345', 900, 604800, persistence);
    delete process.env.USE_DATABASE;
    await service.onModuleInit();
    service.revokeToken('jti-fixture', 4_000_000_000);
    await new Promise((r) => setTimeout(r, 10));
    expect(persistence.persistedCount()).toBe(0);
    expect(service.isRevoked('jti-fixture')).toBe(true); // in-memory still works
  });
});
