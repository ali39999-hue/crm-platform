import { describe, expect, it, beforeEach } from 'vitest';
import { SearchService } from './search.service.js';
import { SearchController } from './search.controller.js';
import { InMemoryTaskRepository } from '../tasks/task.repository.js';
import { InMemoryCrmRepository } from '../crm/crm.repository.js';
import { InMemorySupportRepository } from '../support/support.repository.js';
import type { UserContext } from '../../common/auth/auth.types.js';

describe('Global Search Module (F5-07) with Multi-Tenant and Role Scoping', () => {
  let searchService: SearchService;
  let searchController: SearchController;
  let taskRepo: InMemoryTaskRepository;
  let crmRepo: InMemoryCrmRepository;
  let supportRepo: InMemorySupportRepository;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const customerId = '33333333-3333-3333-3333-333333333333';
  const otherCustomerId = '99999999-9999-9999-9999-999999999999';

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    crmRepo = new InMemoryCrmRepository();
    supportRepo = new InMemorySupportRepository();
    searchService = new SearchService(taskRepo, crmRepo, supportRepo);
    searchController = new SearchController(searchService);
  });

  describe('1. Task Search (by title and key)', () => {
    it('finds tasks by title case-insensitively and returns correct metadata', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'قرارداد',
      );

      expect(res.totalHits).toBeGreaterThanOrEqual(1);
      const match = res.items.find((item) => item.entityType === 'TASK');
      expect(match).toBeDefined();
      expect(match?.title).toContain('بررسی قرارداد مشتری جدید');
      expect(match?.subtitle).toMatch(/^TSK-/);
      expect(match?.url).toBe(`/tasks/${match?.id}`);
      expect(match?.status).toBe('TODO');
      expect(match?.createdAt).toBeDefined();
    });

    it('finds tasks by task key (e.g. TSK-2) with case-insensitive matching', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'tsk-2',
      );

      expect(res.totalHits).toBeGreaterThanOrEqual(1);
      const taskItem = res.items.find((item) => item.entityType === 'TASK');
      expect(taskItem).toBeDefined();
      expect(taskItem?.subtitle).toBe('TSK-2');
      expect(taskItem?.title).toContain('پیاده‌سازی تست‌های امنیتی');
    });

    it('finds tasks by description substring', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'BOLA',
      );

      expect(res.totalHits).toBeGreaterThanOrEqual(1);
      const taskItem = res.items.find((item) => item.entityType === 'TASK');
      expect(taskItem).toBeDefined();
      expect(taskItem?.title).toContain('پیاده‌سازی تست‌های امنیتی');
    });
  });

  describe('2. Account Search (by name and phone)', () => {
    it('finds accounts by name substring', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'فولاد',
      );

      expect(res.totalHits).toBeGreaterThanOrEqual(1);
      const accountItem = res.items.find((item) => item.entityType === 'ACCOUNT');
      expect(accountItem).toBeDefined();
      expect(accountItem?.title).toBe('فولاد گستر آریا');
      expect(accountItem?.url).toBe(`/crm/accounts/${accountItem?.id}`);
      expect(accountItem?.status).toBe('ACTIVE');
    });

    it('finds accounts by phone number substring', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        '0218899',
      );

      expect(res.totalHits).toBeGreaterThanOrEqual(1);
      const accountItem = res.items.find((item) => item.entityType === 'ACCOUNT');
      expect(accountItem).toBeDefined();
      expect(accountItem?.title).toBe('فولاد گستر آریا');
    });
  });

  describe('3. Contact Search (by email)', () => {
    it('finds contacts by email substring case-insensitively', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'rezaei',
      );

      expect(res.totalHits).toBeGreaterThanOrEqual(1);
      const contactItem = res.items.find((item) => item.entityType === 'CONTACT');
      expect(contactItem).toBeDefined();
      expect(contactItem?.title).toBe('محمد رضایی');
      expect(contactItem?.subtitle).toBe('m.rezaei@foolad-arya.com');
      expect(contactItem?.url).toBe(`/crm/contacts/${contactItem?.id}`);
    });

    it('finds contacts by full email address', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'm.rezaei@foolad-arya.com',
      );

      const contactItem = res.items.find((item) => item.entityType === 'CONTACT');
      expect(contactItem).toBeDefined();
      expect(contactItem?.title).toBe('محمد رضایی');
    });
  });

  describe('4. Tenant Isolation (Multi-tenant Security)', () => {
    it('querying from Org Alpha does not return Org Beta entities', async () => {
      // Org Beta has "سازمان بتا پارتنر" (account), "پروژه محرمانه سازمان بتا" (task), "TKT-2001" (ticket)
      const resAlpha = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'محرمانه',
      );

      // Org Alpha should find NO results matching Org Beta's secret data
      expect(resAlpha.items.every((item) => !item.title.includes('سازمان بتا'))).toBe(true);
      expect(resAlpha.items.find((item) => item.title.includes('پروژه محرمانه سازمان بتا'))).toBeUndefined();

      // Querying by Beta phone number from Org Alpha returns empty
      const phoneRes = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        '02177665544',
      );
      expect(phoneRes.totalHits).toBe(0);

      // Querying by Beta ticket reference from Org Alpha returns empty
      const ticketRes = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'TKT-2001',
      );
      expect(ticketRes.totalHits).toBe(0);
    });

    it('querying from Org Beta returns Org Beta entities but not Org Alpha entities', async () => {
      const resBeta = await searchService.search(
        orgBeta,
        'Employee',
        '44444444-4444-4444-4444-444444444444',
        'بتا',
      );

      expect(resBeta.totalHits).toBeGreaterThanOrEqual(1);
      expect(resBeta.items.some((item) => item.title.includes('بتا'))).toBe(true);
      expect(resBeta.items.some((item) => item.title.includes('فولاد گستر'))).toBe(false);
    });
  });

  describe('5. Role-based Filter (CustomerPortalUser permissions)', () => {
    it('CustomerPortalUser NEVER sees internal tasks', async () => {
      // Searching for task keyword 'قرارداد' as CustomerPortalUser
      const res = await searchService.search(
        orgAlpha,
        'CustomerPortalUser',
        customerId,
        'قرارداد',
      );

      // Customer must not see tasks
      expect(res.items.some((item) => item.entityType === 'TASK')).toBe(false);
      expect(res.totalHits).toBe(0);
    });

    it('CustomerPortalUser CANNOT search Accounts or Leads or Contacts', async () => {
      const accountRes = await searchService.search(
        orgAlpha,
        'CustomerPortalUser',
        customerId,
        'فولاد',
      );
      expect(accountRes.items.some((item) => item.entityType === 'ACCOUNT')).toBe(false);
      expect(accountRes.totalHits).toBe(0);

      const contactRes = await searchService.search(
        orgAlpha,
        'CustomerPortalUser',
        customerId,
        'rezaei',
      );
      expect(contactRes.items.some((item) => item.entityType === 'CONTACT')).toBe(false);
      expect(contactRes.totalHits).toBe(0);

      const leadRes = await searchService.search(
        orgAlpha,
        'CustomerPortalUser',
        customerId,
        'داده‌ورز',
      );
      expect(leadRes.items.some((item) => item.entityType === 'LEAD')).toBe(false);
      expect(leadRes.totalHits).toBe(0);
    });

    it('CustomerPortalUser CAN search and find their own tickets', async () => {
      const res = await searchService.search(
        orgAlpha,
        'CustomerPortalUser',
        customerId,
        'TKT-1042',
      );

      expect(res.totalHits).toBe(1);
      const ticketItem = res.items[0];
      expect(ticketItem?.entityType).toBe('TICKET');
      expect(ticketItem?.subtitle).toBe('TKT-1042');
      expect(ticketItem?.title).toContain('گزارش‌گیری');
    });

    it('CustomerPortalUser NEVER sees other customers tickets', async () => {
      // Querying for TKT-1042 as otherCustomerId who is not associated with this ticket
      const res = await searchService.search(
        orgAlpha,
        'CustomerPortalUser',
        otherCustomerId,
        'TKT-1042',
      );

      // Should be empty because ticket belongs to customerId, not otherCustomerId
      expect(res.totalHits).toBe(0);
      expect(res.items.length).toBe(0);
    });

    it('Employee can search all entity types including all tickets', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'TKT-1042',
      );

      expect(res.totalHits).toBe(1);
      expect(res.items[0]?.entityType).toBe('TICKET');
    });
  });

  describe('6. Entity Type Filtering and Limits', () => {
    it('restricts results to specified entityTypes', async () => {
      // Employee searches 'گزارش' which might match both task description/title and ticket title
      const resOnlyTickets = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'گزارش‌گیری',
        ['TICKET'],
      );

      expect(resOnlyTickets.items.every((item) => item.entityType === 'TICKET')).toBe(true);

      const resOnlyTasks = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'گزارش‌گیری',
        ['TASK'],
      );
      expect(resOnlyTasks.items.every((item) => item.entityType === 'TASK')).toBe(true);
    });

    it('applies limit parameter and tracks totalHits accurately', async () => {
      const res = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        'ا', // Persian letter 'ا' appears in many entities
        undefined,
        1,
      );

      expect(res.totalHits).toBeGreaterThan(1);
      expect(res.items.length).toBe(1);
    });

    it('returns empty results when query is empty or blank', async () => {
      const res1 = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        '',
      );
      expect(res1.totalHits).toBe(0);
      expect(res1.items.length).toBe(0);

      const res2 = await searchService.search(
        orgAlpha,
        'Employee',
        employeeAlphaId,
        '   ',
      );
      expect(res2.totalHits).toBe(0);
      expect(res2.items.length).toBe(0);
    });
  });

  describe('7. Search Controller Integration', () => {
    it('delegates to search service using current user context', async () => {
      const userContext: UserContext = {
        id: employeeAlphaId,
        email: 'employee@org-alpha.com',
        displayName: 'کارمند عملیات',
        activeOrganization: {
          id: orgAlpha,
          name: 'شرکت آلفا',
          slug: 'alpha',
          role: 'Employee',
        },
        memberships: [],
      };

      const result = await searchController.search(userContext, {
        q: 'فولاد',
        types: 'ACCOUNT',
      });

      expect(result.totalHits).toBeGreaterThanOrEqual(1);
      expect(result.items[0]?.entityType).toBe('ACCOUNT');
      expect(result.items[0]?.title).toBe('فولاد گستر آریا');
    });

    it('handles comma-separated types and entityTypes alias', async () => {
      const userContext: UserContext = {
        id: employeeAlphaId,
        email: 'employee@org-alpha.com',
        displayName: 'کارمند عملیات',
        activeOrganization: {
          id: orgAlpha,
          name: 'شرکت آلفا',
          slug: 'alpha',
          role: 'Employee',
        },
        memberships: [],
      };

      const result = await searchController.search(userContext, {
        q: 'فولاد',
        entityTypes: ['ACCOUNT', 'TASK'],
      });

      expect(result.items.every((i) => i.entityType === 'ACCOUNT' || i.entityType === 'TASK')).toBe(true);
    });
  });
});
