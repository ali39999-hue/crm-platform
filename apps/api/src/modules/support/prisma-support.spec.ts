import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaSupportRepository } from './prisma-support.repository.js';

describe('PrismaSupportRepository Multi-Tenant Integration Tests (RA-004)', () => {
  let repository: PrismaSupportRepository;
  let mockPrisma: any;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const customerId = '33333333-3333-3333-3333-333333333333';
  const agentId = '55555555-5555-5555-5555-555555555555';

  let ticketsTable: any[] = [];
  let messagesTable: any[] = [];
  let macroTable: any[] = [];
  let seqTable: any[] = [];

  beforeEach(() => {
    macroTable = [];
    seqTable = [{ organizationId: orgAlphaId, lastValue: 1000 }];
    ticketsTable = [
      {
        id: 'tkt-1',
        organizationId: orgAlphaId,
        accountId: 'acc-1',
        assigneeId: agentId,
        reference: 'TKT-1042',
        title: 'عدم دسترسی به ماژول گزارش‌گیری',
        status: 'OPEN',
        priority: 'HIGH',
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-01'),
      },
      {
        id: 'tkt-beta',
        organizationId: orgBetaId,
        accountId: null,
        assigneeId: null,
        reference: 'TKT-2001',
        title: 'تیکت سازمان بتا',
        status: 'NEW',
        priority: 'NORMAL',
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-01'),
      },
    ];

    messagesTable = [
      {
        id: 'msg-1',
        ticketId: 'tkt-1',
        authorId: customerId,
        body: 'گزارش ماهانه برای ما باز نمی‌شود.',
        visibility: 'CUSTOMER_SHARED',
        createdAt: new Date('2026-10-01T10:00:00Z'),
      },
      {
        id: 'msg-2',
        ticketId: 'tkt-1',
        authorId: agentId,
        body: 'یادداشت داخلی محرمانه: سطح دسترسی کاربر در دیتابیس ارتقا یافت.',
        visibility: 'INTERNAL',
        createdAt: new Date('2026-10-01T11:00:00Z'),
      },
    ];

    mockPrisma = {
      ticket: {
        findMany: async ({ where }: any) => {
          return ticketsTable.filter((t) => t.organizationId === where.organizationId);
        },
        findUnique: async ({ where }: any) => {
          return ticketsTable.find((t) => t.id === where.id) ?? null;
        },
        create: async ({ data }: any) => {
          const created = {
            id: `tkt-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          ticketsTable.push(created);
          return created;
        },
        update: async ({ where, data }: any) => {
          const idx = ticketsTable.findIndex((t) => t.id === where.id);
          ticketsTable[idx] = { ...ticketsTable[idx], ...data, updatedAt: new Date() };
          return ticketsTable[idx];
        },
      },
      ticketMessage: {
        findMany: async ({ where }: any) => {
          return messagesTable.filter((m) => {
            if (m.ticketId !== where.ticketId) return false;
            if (where.visibility && m.visibility !== where.visibility) return false;
            return true;
          });
        },
        create: async ({ data }: any) => {
          const created = {
            id: `msg-${Date.now()}`,
            ...data,
            createdAt: new Date(),
          };
          messagesTable.push(created);
          return created;
        },
        count: async ({ where }: any) => {
          return messagesTable.filter((m) => m.ticketId === where.ticketId).length;
        },
      },
    };

    // See prisma-crm.spec.ts note: alias the tenant-scoped client to the mock.
    mockPrisma.supportSequence = {
      updateMany: async ({ where }: any) => {
        const row = seqTable.find((r) => r.organizationId === where.organizationId);
        if (!row) return { count: 0 };
        row.lastValue += 1;
        return { count: 1 };
      },
      findUnique: async ({ where }: any) =>
        seqTable.find((r) => r.organizationId === where.organizationId) ?? null,
      create: async ({ data }: any) => {
        const row = { ...data };
        seqTable.push(row);
        return row;
      },
    };
    mockPrisma.supportMacro = {
      findMany: async ({ where }: any) =>
        macroTable.filter(
          (m) => m.organizationId === where.organizationId && (!where.category || m.category === where.category),
        ),
      findFirst: async ({ where }: any) =>
        macroTable.find((m) => m.organizationId === where.organizationId && m.id === where.id) ?? null,
      create: async ({ data }: any) => {
        const row = { ...data, id: 'macro-new', createdAt: new Date(), updatedAt: new Date() };
        macroTable.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = macroTable.find((m) => m.id === where.id);
        if (!row) throw new Error('P2025');
        Object.assign(row, data);
        return row;
      },
      delete: async ({ where }: any) => {
        const idx = macroTable.findIndex((m) => m.id === where.id);
        if (idx === -1) throw new Error('P2025');
        macroTable.splice(idx, 1);
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaSupportRepository(mockPrisma as any);
  });

  describe('Tickets Multi-Tenant Scoping', () => {
    it('returns tickets strictly belonging to the requested organization', async () => {
      const alphaTickets = await repository.findTickets(orgAlphaId);
      expect(alphaTickets).toHaveLength(1);
      expect(alphaTickets[0]?.id).toBe('tkt-1');

      const betaTickets = await repository.findTickets(orgBetaId);
      expect(betaTickets).toHaveLength(1);
      expect(betaTickets[0]?.id).toBe('tkt-beta');
    });

    it('returns null if ticket belongs to another organization (anti-IDOR)', async () => {
      const crossOrg = await repository.findTicketById(orgAlphaId, 'tkt-beta');
      expect(crossOrg).toBeNull();
    });

    it('creates and updates a ticket', async () => {
      const created = await repository.createTicket({
        organizationId: orgAlphaId,
        accountId: 'acc-1',
        assigneeId: agentId,
        title: 'درخواست پشتیبانی تست پریزما',
        status: 'NEW',
        priority: 'URGENT',
        targetResolutionAt: new Date().toISOString(),
      });

      expect(created.id).toBeDefined();
      expect(created.reference).toMatch(/^TKT-/);

      const updated = await repository.updateTicket({
        ...created,
        status: 'RESOLVED',
      });
      expect(updated.status).toBe('RESOLVED');
    });
  });

  describe('Messages and Strict Privacy Filtering', () => {
    it('filters out INTERNAL notes when canViewInternal is false (Customer Portal)', async () => {
      const customerMessages = await repository.findMessages(orgAlphaId, 'tkt-1', false);
      expect(customerMessages).toHaveLength(1);
      expect(customerMessages[0]?.visibility).toBe('CUSTOMER_SHARED');
      expect(customerMessages.some((m) => m.visibility === 'INTERNAL')).toBe(false);
    });

    it('returns both internal notes and customer messages when canViewInternal is true (Support Agent)', async () => {
      const staffMessages = await repository.findMessages(orgAlphaId, 'tkt-1', true);
      expect(staffMessages).toHaveLength(2);
      expect(staffMessages.some((m) => m.visibility === 'INTERNAL')).toBe(true);
    });

    it('adds a new ticket message', async () => {
      const added = await repository.addMessage({
        organizationId: orgAlphaId,
        ticketId: 'tkt-1',
        authorId: agentId,
        body: 'پاسخ جدید کارشناس',
        visibility: 'CUSTOMER_SHARED',
      });

      expect(added.id).toBeDefined();
      expect(added.body).toBe('پاسخ جدید کارشناس');
    });
  });

  describe('Support Macros Canned Responses', () => {
    it('creates, retrieves, and deletes canned response macros', async () => {
      const macro = await repository.createMacro({
        organizationId: orgAlphaId,
        title: 'الگوی آزمایشی پریزما',
        shortcut: 'test-macro',
        category: 'عمومی',
        content: 'متن الگوی تستی',
        tags: ['تست'],
      });

      expect(macro.id).toBeDefined();
      expect(macro.shortcut).toBe('test-macro');

      const found = await repository.findMacroById(orgAlphaId, macro.id);
      expect(found?.title).toBe('الگوی آزمایشی پریزما');

      const deleted = await repository.deleteMacro(orgAlphaId, macro.id);
      expect(deleted).toBe(true);
    });
  });
});
