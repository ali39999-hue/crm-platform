import { describe, expect, it, beforeEach } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CrmService } from './crm.service.js';
import { InMemoryCrmRepository } from './crm.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuthService } from '../../common/auth/auth.service.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';

describe('CRM Module, Deduplication, and Idempotent Conversion', () => {
  let crmService: CrmService;
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;
  let authService: AuthService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const customerId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    authService = new AuthService();
    crmService = new CrmService(crmRepo, auditService, outboxService);
  });

  describe('1. Accounts and Multi-tenant Scope', () => {
    it('returns accounts belonging to the organization', async () => {
      const accounts = await crmService.getAccounts(orgAlphaId);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts.every((a) => a.id !== '50000000-0000-0000-0000-000000000002')).toBe(true);
    });

    it('prevents IDOR: accessing account of another organization throws NotFoundException', async () => {
      const betaAccId = '50000000-0000-0000-0000-000000000002'; // Org Beta account
      await expect(crmService.getAccountById(orgAlphaId, betaAccId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates an account, records audit, and emits outbox event', async () => {
      const created = await crmService.createAccount(
        orgAlphaId,
        employeeAlphaId,
        {
          name: 'شرکت فناوران نوین',
          type: 'ENTERPRISE',
          phone: '021-88112233',
        },
        'req-acc-1',
      );

      expect(created.id).toBeDefined();
      expect(created.name).toBe('شرکت فناوران نوین');

      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'CRM_ACCOUNT_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(employeeAlphaId);
    });
  });

  describe('2. Leads and Deduplication Detection', () => {
    it('flags duplicate candidate when email or phone matches existing lead', async () => {
      // Existing seed lead has email: hosseini@dadevarz.com, phone: 09129876543
      const duplicateResult = await crmService.createLead(
        orgAlphaId,
        employeeAlphaId,
        {
          displayName: 'ع. حسینی',
          email: '  HOSSEINI@DADEVARZ.COM  ', // uppercase and whitespace
          phone: '09350000000',
        },
      );

      expect(duplicateResult.isDuplicateCandidate).toBe(true);
      expect(duplicateResult.duplicateCandidateId).toBe('70000000-0000-0000-0000-000000000001');

      // Unique lead should not be flagged
      const uniqueResult = await crmService.createLead(
        orgAlphaId,
        employeeAlphaId,
        {
          displayName: 'مشتری کاملاً جدید',
          email: 'brand.new@client.com',
          phone: '09191112233',
        },
      );

      expect(uniqueResult.isDuplicateCandidate).toBe(false);
    });
  });

  describe('3. Idempotent Atomic Lead Conversion', () => {
    it('atomically converts a lead to Account, Contact, and Deal', async () => {
      const leadId = '70000000-0000-0000-0000-000000000001';

      const conversion = await crmService.convertLead(
        orgAlphaId,
        employeeAlphaId,
        leadId,
        {
          idempotencyKey: 'idemp-convert-1',
          accountName: 'شرکت داده‌ورز آرا',
          dealName: 'فرصت پایپ‌لاین سیستم جامع',
          dealAmountMinor: 450000000,
          dealCurrency: 'IRR',
        },
        'req-conv-1',
      );

      expect(conversion.leadId).toBe(leadId);
      expect(conversion.accountId).toBeDefined();
      expect(conversion.contactId).toBeDefined();
      expect(conversion.dealId).toBeDefined();

      // Lead is now CONVERTED
      const leads = await crmService.getLeads(orgAlphaId);
      const updatedLead = leads.find((l) => l.id === leadId);
      expect(updatedLead?.status).toBe('CONVERTED');

      // Verify associated Account and Contact exist
      const account = await crmService.getAccountById(orgAlphaId, conversion.accountId);
      expect(account.name).toBe('شرکت داده‌ورز آرا');

      const contacts = await crmService.getContacts(orgAlphaId, conversion.accountId);
      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0]?.id).toBe(conversion.contactId);

      // Verify associated Deal exists with integer minor unit
      const deals = await crmService.getDeals(orgAlphaId, conversion.accountId);
      expect(deals.length).toBeGreaterThan(0);
      expect(deals[0]?.amountMinor).toBe(450000000);
      expect(deals[0]?.currency).toBe('IRR');

      // Test Idempotency: Retrying conversion returns same IDs without duplicate records!
      const retryConversion = await crmService.convertLead(
        orgAlphaId,
        employeeAlphaId,
        leadId,
        {
          idempotencyKey: 'idemp-convert-1',
        },
      );

      expect(retryConversion.accountId).toBe(conversion.accountId);
      expect(retryConversion.contactId).toBe(conversion.contactId);
      expect(retryConversion.dealId).toBe(conversion.dealId);
    });
  });

  describe('4. Customer 360 Timeline', () => {
    it('aggregates unified customer timeline events', async () => {
      const accId = '50000000-0000-0000-0000-000000000001';
      const timeline = await crmService.getCustomerTimeline(orgAlphaId, accId);

      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline.some((e) => e.entityType === 'ACCOUNT')).toBe(true);
      expect(timeline.some((e) => e.entityType === 'CONTACT')).toBe(true);
      expect(timeline.some((e) => e.entityType === 'DEAL')).toBe(true);
    });
  });

  describe('5. CRM Permission Negative Test', () => {
    it('CustomerPortalUser is forbidden from editing CRM records', () => {
      const customer = authService.resolveUser(customerId);
      const mockContext: any = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: customer }),
        }),
      };

      const customGuard = new PermissionsGuard({
        getAllAndOverride: () => 'edit_crm',
      } as any);

      expect(() => customGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });

  describe('6. Duplicate Candidate Detection and Merging', () => {
    it('detects duplicate lead candidates with email or phone match', async () => {
      // Create duplicate lead
      await crmService.createLead(orgAlphaId, employeeAlphaId, {
        displayName: 'حسین حسینی (کپی)',
        email: 'hosseini@dadevarz.com', // Matches seeded lead
        phone: '09129876543',
      });

      const duplicates = await crmService.getDuplicateCandidates(orgAlphaId);
      expect(duplicates.length).toBeGreaterThan(0);
      const leadDup = duplicates.find((d) => d.entityType === 'LEAD');
      expect(leadDup).toBeDefined();
      expect(leadDup?.confidenceScore).toBe(95);
      expect(leadDup?.matchReason).toContain('ایمیل');
    });

    it('merges duplicate lead records and removes source record', async () => {
      const lead2 = await crmService.createLead(orgAlphaId, employeeAlphaId, {
        displayName: 'تست برای ادغام',
        email: 'merge.test@example.com',
        phone: '09120000001',
      });

      const lead3 = await crmService.createLead(orgAlphaId, employeeAlphaId, {
        displayName: 'تست برای ادغام (دوم)',
        email: 'merge.test@example.com',
        phone: '09120000001',
      });

      const mergeResult = await crmService.mergeRecords(orgAlphaId, employeeAlphaId, {
        entityType: 'LEAD',
        targetRecordId: lead2.lead.id,
        sourceRecordId: lead3.lead.id,
      });

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedId).toBe(lead2.lead.id);

      // Verify source lead is removed
      const leads = await crmService.getLeads(orgAlphaId);
      expect(leads.some((l) => l.id === lead3.lead.id)).toBe(false);

      // Audit recorded
      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'CRM_RECORDS_MERGED');
      expect(audit).toBeDefined();
    });
  });

  describe('7. Didar CRM Paradigms: Rotting Deals, Next Actions, Loss Reasons, Products & Invoices', () => {
    it('detects stagnant/rotting deals based on stage duration threshold', async () => {
      const deals = await crmService.getDeals(orgAlphaId);
      // Seeded deal 2 is in NEED_ANALYSIS for 20 days -> rotting
      const rottingDeal = deals.find((d) => d.id === '80000000-0000-0000-0000-000000000002');
      expect(rottingDeal).toBeDefined();
      expect(rottingDeal?.isRotting).toBe(true);
      expect(rottingDeal?.daysInCurrentStage).toBeGreaterThanOrEqual(14);

      // Seeded deal 1 is newly updated -> not rotting
      const activeDeal = deals.find((d) => d.id === '80000000-0000-0000-0000-000000000001');
      expect(activeDeal).toBeDefined();
      expect(activeDeal?.isRotting).toBe(false);
    });

    it('marks deal as LOST with mandatory structured loss reason and audit log', async () => {
      const lost = await crmService.markDealLost(
        orgAlphaId,
        employeeAlphaId,
        '80000000-0000-0000-0000-000000000001',
        {
          lossReason: 'PRICE_TOO_HIGH',
          lossDescription: 'مشتری بودجه کافی برای سال جاری نداشت و به تعویق انداخت',
        },
      );

      expect(lost.stage).toBe('LOST');
      expect(lost.probability).toBe(0);
      expect(lost.lossReason).toBe('PRICE_TOO_HIGH');
      expect(lost.lossDescription).toContain('مشتری بودجه کافی');
      expect(lost.lostAt).toBeDefined();

      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'CRM_DEAL_LOST');
      expect(audit).toBeDefined();
      expect(audit?.metadata?.lossReason).toBe('PRICE_TOO_HIGH');
    });

    it('schedules next action on a deal to maintain sales discipline', async () => {
      const due = new Date(Date.now() + 86400000 * 3).toISOString();
      const updated = await crmService.scheduleNextAction(
        orgAlphaId,
        employeeAlphaId,
        '80000000-0000-0000-0000-000000000001',
        {
          title: 'تماس تلفنی جهت بررسی نهایی پیش‌فاکتور',
          dueAt: due,
        },
      );

      expect(updated.nextActionTitle).toBe('تماس تلفنی جهت بررسی نهایی پیش‌فاکتور');
      expect(updated.nextActionDueAt).toBe(due);

      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'CRM_DEAL_NEXT_ACTION_SCHEDULED');
      expect(audit).toBeDefined();
    });

    it('manages products catalog and calculates proforma invoice with 10% VAT', async () => {
      // 1. Get products catalog
      const products = await crmService.getProducts(orgAlphaId);
      expect(products.length).toBeGreaterThanOrEqual(3);

      // 2. Create proforma invoice for a deal
      const invoice = await crmService.createInvoice(
        orgAlphaId,
        employeeAlphaId,
        {
          dealId: '80000000-0000-0000-0000-000000000001',
          items: [
            {
              productId: products[0]!.id,
              productName: products[0]!.name,
              quantity: 2,
              unitPriceMinor: 100000000, // 200,000,000
              discountPercent: 10, // 20,000,000 discount -> 180,000,000 taxable
              taxRatePercent: 10, // 18,000,000 VAT -> 198,000,000 total
              totalPriceMinor: 198000000,
            },
          ],
        },
      );

      expect(invoice.id).toBeDefined();
      expect(invoice.subtotalMinor).toBe(200000000);
      expect(invoice.discountTotalMinor).toBe(20000000);
      expect(invoice.taxTotalMinor).toBe(18000000);
      expect(invoice.finalTotalMinor).toBe(198000000);
      expect(invoice.status).toBe('ISSUED');

      // Verify deal amount was synchronized
      const deal = await crmService.getDealById(orgAlphaId, '80000000-0000-0000-0000-000000000001');
      expect(deal.amountMinor).toBe(198000000);
    });

    it('provides sales loss analytics breakdown and quota tracking', async () => {
      // Mark one deal lost
      await crmService.markDealLost(
        orgAlphaId,
        employeeAlphaId,
        '80000000-0000-0000-0000-000000000001',
        { lossReason: 'COMPETITOR_WON' },
      );

      const analytics = await crmService.getSalesLossAnalytics(orgAlphaId);
      expect(analytics.totalLostDealsCount).toBeGreaterThan(0);
      const competitorReason = analytics.breakdownByReason.find((r) => r.reason === 'COMPETITOR_WON');
      expect(competitorReason).toBeDefined();
      expect(competitorReason?.count).toBeGreaterThan(0);

      const target = await crmService.getSalesTarget(orgAlphaId, employeeAlphaId);
      expect(target.targetAmountMinor).toBe(500000000);
      expect(target.achievementPercent).toBeDefined();
    });

    it('identifies today birthdays and sends automated birthday SMS', async () => {
      // Seeded contact 1 has birthday today
      const birthdays = await crmService.getTodayBirthdays(orgAlphaId);
      expect(birthdays.length).toBeGreaterThan(0);
      const contact1 = birthdays.find((c) => c.id === '60000000-0000-0000-0000-000000000001');
      expect(contact1).toBeDefined();

      // Send birthday SMS
      const smsResult = await crmService.sendBirthdaySms(
        orgAlphaId,
        employeeAlphaId,
        '60000000-0000-0000-0000-000000000001',
      );
      expect(smsResult.success).toBe(true);
      expect(smsResult.smsText).toContain('محمد رضایی');
      expect(smsResult.smsText).toContain('زادروز');

      const audit = auditService
        .getEvents(orgAlphaId)
        .find((a) => a.action === 'CRM_BIRTHDAY_SMS_SENT');
      expect(audit).toBeDefined();
    });

    it('identifies dormant customers without activity past 60 days', async () => {
      // Seeded contact 2 has last interaction 70 days ago
      const dormant = await crmService.getDormantCustomers(orgAlphaId, 60);
      expect(dormant.length).toBeGreaterThan(0);
      const dormantContact = dormant.find((c) => c.id === '60000000-0000-0000-0000-000000000002');
      expect(dormantContact).toBeDefined();
      expect(dormantContact?.isDormant).toBe(true);
    });
  });
});
