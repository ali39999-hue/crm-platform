import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaCrmRepository } from './prisma-crm.repository.js';

describe('PrismaCrmRepository Multi-Tenant Integration Tests (RA-003)', () => {
  let repository: PrismaCrmRepository;
  let mockPrisma: any;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const ownerId = '22222222-2222-2222-2222-222222222222';

  // In-memory backing tables simulating PostgreSQL
  let accountsTable: any[] = [];
  let contactsTable: any[] = [];
  let leadsTable: any[] = [];
  let dealsTable: any[] = [];

  beforeEach(() => {
    accountsTable = [
      {
        id: 'acc-1',
        organizationId: orgAlphaId,
        ownerId,
        name: 'پتروشیمی سپهر',
        type: 'COMPANY',
        status: 'ACTIVE',
        website: 'https://sepehr.ir',
        phone: '021-88776655',
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-01'),
      },
      {
        id: 'acc-beta',
        organizationId: orgBetaId,
        ownerId,
        name: 'سازمان بتا',
        type: 'COMPANY',
        status: 'ACTIVE',
        website: null,
        phone: null,
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-01'),
      },
    ];

    contactsTable = [
      {
        id: 'con-1',
        organizationId: orgAlphaId,
        accountId: 'acc-1',
        ownerId,
        firstName: 'رضا',
        lastName: 'کمالی',
        email: 'kamali@sepehr.ir',
        phone: '09121112233',
        createdAt: new Date('2026-10-02'),
        updatedAt: new Date('2026-10-02'),
      },
    ];

    leadsTable = [
      {
        id: 'lead-1',
        organizationId: orgAlphaId,
        ownerId,
        accountId: null,
        displayName: 'علیرضا حسینی',
        email: 'hosseini@client.com',
        phone: '09129876543',
        source: 'WEBSITE',
        status: 'NEW',
        createdAt: new Date('2026-10-03'),
        updatedAt: new Date('2026-10-03'),
      },
    ];

    dealsTable = [
      {
        id: 'deal-1',
        organizationId: orgAlphaId,
        accountId: 'acc-1',
        ownerId,
        name: 'قرارداد توسعه سالانه',
        stage: 'PROPOSAL',
        amountMinor: BigInt(450000000),
        currency: 'IRR',
        probability: 50,
        targetCloseAt: new Date('2026-11-30'),
        createdAt: new Date('2026-10-04'),
        updatedAt: new Date('2026-10-04'),
      },
    ];

    mockPrisma = {
      account: {
        findMany: async ({ where }: any) => {
          return accountsTable.filter((a) => a.organizationId === where.organizationId);
        },
        findUnique: async ({ where }: any) => {
          return accountsTable.find((a) => a.id === where.id) ?? null;
        },
        create: async ({ data }: any) => {
          const created = {
            id: `acc-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          accountsTable.push(created);
          return created;
        },
        update: async ({ where, data }: any) => {
          const idx = accountsTable.findIndex((a) => a.id === where.id);
          accountsTable[idx] = { ...accountsTable[idx], ...data, updatedAt: new Date() };
          return accountsTable[idx];
        },
        delete: async ({ where }: any) => {
          accountsTable = accountsTable.filter((a) => a.id !== where.id);
          return { id: where.id };
        },
      },
      contact: {
        findMany: async ({ where }: any) => {
          return contactsTable.filter(
            (c) =>
              c.organizationId === where.organizationId &&
              (!where.accountId || c.accountId === where.accountId),
          );
        },
        findUnique: async ({ where }: any) => {
          return contactsTable.find((c) => c.id === where.id) ?? null;
        },
        create: async ({ data }: any) => {
          const created = {
            id: `con-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          contactsTable.push(created);
          return created;
        },
        update: async ({ where, data }: any) => {
          const idx = contactsTable.findIndex((c) => c.id === where.id);
          contactsTable[idx] = { ...contactsTable[idx], ...data, updatedAt: new Date() };
          return contactsTable[idx];
        },
        delete: async ({ where }: any) => {
          contactsTable = contactsTable.filter((c) => c.id !== where.id);
          return { id: where.id };
        },
      },
      lead: {
        findMany: async ({ where }: any) => {
          return leadsTable.filter((l) => l.organizationId === where.organizationId);
        },
        findUnique: async ({ where }: any) => {
          return leadsTable.find((l) => l.id === where.id) ?? null;
        },
        create: async ({ data }: any) => {
          const created = {
            id: `lead-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          leadsTable.push(created);
          return created;
        },
        update: async ({ where, data }: any) => {
          const idx = leadsTable.findIndex((l) => l.id === where.id);
          leadsTable[idx] = { ...leadsTable[idx], ...data, updatedAt: new Date() };
          return leadsTable[idx];
        },
        delete: async ({ where }: any) => {
          leadsTable = leadsTable.filter((l) => l.id !== where.id);
          return { id: where.id };
        },
      },
      deal: {
        findMany: async ({ where }: any) => {
          return dealsTable.filter(
            (d) =>
              d.organizationId === where.organizationId &&
              (!where.accountId || d.accountId === where.accountId),
          );
        },
        findUnique: async ({ where }: any) => {
          return dealsTable.find((d) => d.id === where.id) ?? null;
        },
        create: async ({ data }: any) => {
          const created = {
            id: `deal-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dealsTable.push(created);
          return created;
        },
        update: async ({ where, data }: any) => {
          const idx = dealsTable.findIndex((d) => d.id === where.id);
          dealsTable[idx] = { ...dealsTable[idx], ...data, updatedAt: new Date() };
          return dealsTable[idx];
        },
        delete: async ({ where }: any) => {
          dealsTable = dealsTable.filter((d) => d.id !== where.id);
          return { id: where.id };
        },
      },
    };

    repository = new PrismaCrmRepository(mockPrisma as any);
  });

  describe('Accounts Multi-Tenant Persistence', () => {
    it('finds accounts strictly scoped to organization', async () => {
      const alphaAccounts = await repository.findAccounts(orgAlphaId);
      expect(alphaAccounts).toHaveLength(1);
      expect(alphaAccounts[0]?.id).toBe('acc-1');

      const betaAccounts = await repository.findAccounts(orgBetaId);
      expect(betaAccounts).toHaveLength(1);
      expect(betaAccounts[0]?.id).toBe('acc-beta');
    });

    it('returns null if account belongs to another organization (anti-IDOR)', async () => {
      const crossOrg = await repository.findAccountById(orgAlphaId, 'acc-beta');
      expect(crossOrg).toBeNull();
    });

    it('creates, updates and deletes account', async () => {
      const created = await repository.createAccount({
        organizationId: orgAlphaId,
        ownerId,
        name: 'شرکت جدید آزمایشی',
        type: 'COMPANY',
        status: 'ACTIVE',
        website: 'https://new.ir',
        phone: '021-99887766',
      });
      expect(created.id).toBeDefined();

      const updated = await repository.updateAccount({
        ...created,
        name: 'شرکت جدید (ویرایش)',
      });
      expect(updated.name).toBe('شرکت جدید (ویرایش)');

      const deleted = await repository.deleteAccount(orgAlphaId, created.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Deals BigInt Handling and Mapping', () => {
    it('correctly maps BigInt amountMinor to number without losing precision', async () => {
      const deals = await repository.findDeals(orgAlphaId);
      expect(deals).toHaveLength(1);
      expect(deals[0]?.amountMinor).toBe(450000000);
      expect(typeof deals[0]?.amountMinor).toBe('number');
    });

    it('creates deal with BigInt conversion', async () => {
      const newDeal = await repository.createDeal({
        organizationId: orgAlphaId,
        accountId: 'acc-1',
        ownerId,
        name: 'معامله با مبلغ بزرگ',
        stage: 'QUALIFICATION',
        amountMinor: 850000000,
        currency: 'IRR',
        probability: 30,
        targetCloseAt: '2026-12-15T00:00:00.000Z',
      });

      expect(newDeal.amountMinor).toBe(850000000);
      expect(dealsTable.find((d) => d.id === newDeal.id)?.amountMinor).toBe(BigInt(850000000));
    });
  });

  describe('Leads and Contacts Scoping', () => {
    it('finds leads and contacts scoped to organization', async () => {
      const leads = await repository.findLeads(orgAlphaId);
      expect(leads).toHaveLength(1);
      expect(leads[0]?.displayName).toBe('علیرضا حسینی');

      const contacts = await repository.findContacts(orgAlphaId);
      expect(contacts).toHaveLength(1);
      expect(contacts[0]?.firstName).toBe('رضا');
    });
  });
});
