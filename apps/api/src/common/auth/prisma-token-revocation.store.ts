import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Durable credential-revocation store (P02 session lifecycle): logout/
 * revocation entries survive restarts in database mode. In fixture mode the
 * in-memory map keeps dev/E2E behavior.
 *
 * One table for all three revocation kinds — token jti, session id, and
 * user-wide revocation — keyed by a string key with an expiry for cleanup.
 */
export type RevocationEntry = { key: string; kind: string; expiresAt: number };

export interface TokenRevocationPersistence {
  restore(): Promise<RevocationEntry[]>;
  persist(entry: RevocationEntry): Promise<void>;
  purgeExpired(now?: number): Promise<number>;
}

@Injectable()
export class PrismaTokenRevocationStore implements TokenRevocationPersistence {
  constructor(private readonly prisma: PrismaService) {}

  async persist(entry: RevocationEntry): Promise<void> {
    await (this.prisma.tenantClient as any).revokedCredential.upsert({
      where: { key: entry.key },
      create: { key: entry.key, kind: entry.kind, expiresAt: new Date(entry.expiresAt) },
      update: { expiresAt: new Date(entry.expiresAt) },
    });
  }

  async restore(): Promise<RevocationEntry[]> {
    const rows = await (this.prisma.tenantClient as any).revokedCredential.findMany({
      where: { expiresAt: { gt: new Date() } },
    });
    return rows.map((r: any) => ({
      key: r.key,
      kind: r.kind,
      expiresAt: r.expiresAt.getTime(),
    }));
  }

  async purgeExpired(now = Date.now()): Promise<number> {
    const result = await (this.prisma.tenantClient as any).revokedCredential.deleteMany({
      where: { expiresAt: { lte: new Date(now) } },
    });
    return result?.count ?? 0;
  }

  /** False when the key is unknown or its expiry has passed (lazy cleanup). */
  async isRevoked(key: string, now = Date.now()): Promise<boolean> {
    const row = await (this.prisma.tenantClient as any).revokedCredential.findUnique({
      where: { key },
    });
    if (!row) return false;
    if (row.expiresAt.getTime() <= now) {
      await (this.prisma.tenantClient as any).revokedCredential
        .delete({ where: { key } })
        .catch(() => undefined);
      return false;
    }
    return true;
  }

}
