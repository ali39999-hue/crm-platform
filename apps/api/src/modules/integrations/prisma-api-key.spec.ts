import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaApiKeyRepository } from './prisma-api-key.repository.js';

describe('PrismaApiKeyRepository Multi-Tenant Persistence (GAP-001 slice 4)', () => {
  let repository: PrismaApiKeyRepository;
  let mockPrisma: any;
  let keysTable: any[];
  let providersTable: any[];

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    keysTable = [
      {
        id: 'key-1',
        organizationId: orgAlpha,
        name: 'کلید صدور فاکتور',
        keyPrefix: 'crm_live_ab12',
        hashedKey: 'sha256:deadbeef',
        scopes: ['export_data'],
        lastUsedAt: null,
        expiresAt: null,
        active: true,
        createdAt: new Date('2026-10-20T10:00:00.000Z'),
      },
      {
        id: 'key-beta',
        organizationId: orgBeta,
        name: 'کلید سازمان دیگر',
        keyPrefix: 'crm_live_zz99',
        hashedKey: 'sha256:cafe',
        scopes: [],
        lastUsedAt: null,
        expiresAt: null,
        active: true,
        createdAt: new Date('2026-10-20T09:00:00.000Z'),
      },
    ];
    providersTable = [
      {
        id: 'prov-1',
        organizationId: orgAlpha,
        providerKey: 'EMAIL_SMTP',
        name: 'SMTP',
        description: 'ارسال ایمیل',
        icon: 'mail',
        status: 'CONNECTED',
        configSummary: { host: 'smtp.company.com' },
        lastSyncedAt: new Date('2026-10-25T10:00:00.000Z'),
        errorMessage: null,
        updatedAt: new Date('2026-10-25T10:00:00.000Z'),
      },
    ];

    mockPrisma = {
      apiKey: {
        findMany: async ({ where }: any) =>
          keysTable.filter((k) => k.organizationId === where.organizationId),
        findFirst: async ({ where }: any) =>
          keysTable.find((k) => k.organizationId === where.organizationId && k.id === where.id) ?? null,
        create: async ({ data }: any) => {
          const row = { ...data, id: 'key-new', createdAt: new Date() };
          keysTable.unshift(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = keysTable.find((k) => k.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
      },
      integrationProvider: {
        findMany: async ({ where }: any) =>
          providersTable.filter((p) => p.organizationId === where.organizationId),
        findFirst: async ({ where }: any) =>
          providersTable.find(
            (p) => p.organizationId === where.organizationId && p.providerKey === where.providerKey,
          ) ?? null,
        update: async ({ where, data }: any) => {
          const row = providersTable.find((p) => p.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        create: async ({ data }: any) => {
          const row = { ...data, id: 'prov-new', updatedAt: new Date() };
          providersTable.push(row);
          return row;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaApiKeyRepository(mockPrisma as any);
  });

  it('never exposes another organization key', async () => {
    expect(await repository.findKeyById(orgBeta, 'key-1')).toBeNull();
    expect((await repository.findKeysByOrg(orgAlpha)).map((k) => k.id)).toEqual(['key-1']);
  });

  it('creates a key with hashed material and revokes inside org scope', async () => {
    const created = await repository.createKey({
      organizationId: orgAlpha,
      name: 'کلید جدید',
      keyPrefix: 'crm_live_cd34',
      hashedKey: 'sha256:beefcafe',
      scopes: ['view_crm'],
      lastUsedAt: null,
      expiresAt: null,
      active: true,
    });
    expect(created.active).toBe(true);
    expect(await repository.revokeKey(orgBeta, created.id)).toBe(false);
    expect(await repository.revokeKey(orgAlpha, created.id)).toBe(true);
    expect((await repository.findKeyById(orgAlpha, created.id))?.active).toBe(false);
  });

  it('upserts providers by organization + providerKey', async () => {
    const updated = await repository.saveProvider({
      id: 'prov-1',
      organizationId: orgAlpha,
      providerKey: 'EMAIL_SMTP',
      name: 'SMTP',
      description: 'ارسال ایمیل شرکتی',
      icon: 'mail',
      status: 'DISCONNECTED',
      configSummary: undefined,
      lastSyncedAt: null,
      errorMessage: 'auth failed',
      updatedAt: new Date().toISOString(),
    });
    expect(updated.status).toBe('DISCONNECTED');
    expect(providersTable).toHaveLength(1);

    const created = await repository.saveProvider({
      id: '',
      organizationId: orgAlpha,
      providerKey: 'SMS_KAVENEGAR',
      name: 'Telegram',
      description: 'اعلان تلگرام',
      icon: 'tg',
      status: 'CONNECTED',
      configSummary: undefined,
      lastSyncedAt: null,
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    });
    expect(created.id).toBe('prov-new');
    expect(providersTable).toHaveLength(2);
  });
});
