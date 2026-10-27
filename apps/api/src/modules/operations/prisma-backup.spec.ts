import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaBackupRepository } from './prisma-backup.repository.js';

const baseBackup = {
  organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' as string | null,
  scope: 'TENANT' as const,
  status: 'COMPLETED' as const,
  description: 'پشتیبان کامل شبانه',
  version: '1.0.0',
  algorithm: 'aes-256-gcm',
  iv: 'iv-vector',
  authTag: 'auth-tag',
  checksumSha256: 'checksum-1',
  encryptedData: 'encrypted-payload',
  sizeBytes: 1024,
  recordCounts: { Task: 10 },
  rpoTargetMinutes: 60,
  rtoEstimatedSeconds: 300,
  retentionDays: 30,
  expiresAt: '2026-11-26T00:00:00.000Z',
  createdBy: '22222222-2222-2222-2222-222222222222',
  completedAt: '2026-10-27T03:00:00.000Z',
  metadata: undefined,
};

describe('PrismaBackupRepository Persistence (GAP-001 slice 4)', () => {
  let repository: PrismaBackupRepository;
  let mockPrisma: any;
  let backupsTable: any[];
  let drillsTable: any[];

  beforeEach(() => {
    backupsTable = [];
    drillsTable = [];
    mockPrisma = {
      backupRecord: {
        create: async ({ data }: any) => {
          const row = {
            ...data,
            id: data.id ?? 'bak-new',
            createdAt: data.createdAt ?? new Date('2026-10-27T03:00:00.000Z'),
          };
          backupsTable.push(row);
          return row;
        },
        findUnique: async ({ where }: any) => backupsTable.find((b) => b.id === where.id) ?? null,
        findMany: async ({ where }: any) =>
          backupsTable.filter((b) => {
            if (where.organizationId && b.organizationId !== where.organizationId) return false;
            if (where.scope && b.scope !== where.scope) return false;
            if (where.expiresAt?.gte && new Date(b.expiresAt) < where.expiresAt.gte) return false;
            return true;
          }),
        update: async ({ where, data }: any) => {
          const row = backupsTable.find((b) => b.id === where.id);
          if (!row) { const e: any = new Error('Record not found'); e.code = 'P2025'; throw e; }
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = backupsTable.findIndex((b) => b.id === where.id);
          if (idx === -1) throw new Error('P2025');
          backupsTable.splice(idx, 1);
        },
      },
      restoreDrill: {
        create: async ({ data }: any) => {
          const row = { ...data, id: 'drill-new', executedAt: new Date('2026-10-27T04:00:00.000Z') };
          drillsTable.push(row);
          return row;
        },
        findMany: async ({ where }: any) =>
          drillsTable.filter((d) => !where?.backupId || d.backupId === where.backupId),
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaBackupRepository(mockPrisma as any);
  });

  it('creates with BigInt size round-trip and optional id', async () => {
    const created = await repository.create({ ...baseBackup });
    expect(created.id).toBe('bak-new');
    expect(created.sizeBytes).toBe(1024);
    expect(backupsTable[0]!.sizeBytes).toBe(1024n);
  });

  it('findByOrg filters org + scope and hides expired by default', async () => {
    await repository.create({ ...baseBackup });
    await repository.create({
      ...baseBackup,
      organizationId: null,
      scope: 'SYSTEM' as const,
      description: 'سیستمی',
      expiresAt: '2026-10-01T00:00:00.000Z',
    });
    const rows = await repository.findByOrg('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(rows).toHaveLength(1);
    const withExpired = await repository.findByOrg('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', {
      includeExpired: true,
    });
    expect(withExpired).toHaveLength(1); // the platform backup has organizationId=null
    const all = await repository.findAll({ includeExpired: true });
    expect(all).toHaveLength(2);
  });

  it('updates partial fields and reports not-found as null', async () => {
    const created = await repository.create({ ...baseBackup });
    const updated = await repository.update(created.id, { status: 'EXPIRED' });
    expect(updated?.status).toBe('EXPIRED');
    expect(await repository.update('missing', { status: 'EXPIRED' })).toBeNull();
  });

  it('records restore drills and lists them per backup', async () => {
    const created = await repository.create({ ...baseBackup });
    const drill = await repository.recordDrill({
      backupId: created.id,
      organizationId: created.organizationId,
      executedBy: '22222222-2222-2222-2222-222222222222',
      success: true,
      integrityVerified: true,
      checksumMatched: true,
      decryptionSuccessful: true,
      versionCompatible: true,
      schemaCompatible: true,
      simulatedRecordsRestored: 10,
      rtoActualMs: 280000,
      rpoActualMinutes: 45,
      rpoTargetMinutes: 60,
      rtoEstimatedSeconds: 300,
      meetsRpoTarget: true,
      meetsRtoTarget: true,
      details: 'تمرین موفق بازیابی',
      validationErrors: undefined,
    });
    expect(drill.id).toBe('drill-new');
    expect((await repository.findDrills(created.id))).toHaveLength(1);
    expect((await repository.findDrills())).toHaveLength(1);
  });
});
