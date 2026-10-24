import { describe, expect, it, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service.js';
import { InMemorySupportRepository } from './support.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuthService } from '../../common/auth/auth.service.js';

describe('Support & Ticketing Module with Strict Note Privacy', () => {
  let supportService: SupportService;
  let supportRepo: InMemorySupportRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;
  let authService: AuthService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const customerId = '33333333-3333-3333-3333-333333333333';
  const supportAgentId = '55555555-5555-5555-5555-555555555555';
  const ticketAlphaId = '90000000-0000-0000-0000-000000000001'; // TKT-1042

  beforeEach(() => {
    supportRepo = new InMemorySupportRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    authService = new AuthService();
    supportService = new SupportService(supportRepo, auditService, outboxService);
  });

  describe('1. Ticket Lifecycle and SLA Calculation', () => {
    it('creates a ticket with calculated SLA deadline and initial message', async () => {
      const ticket = await supportService.createTicket(
        orgAlphaId,
        employeeAlphaId,
        {
          title: 'مشکل قطعی درگاه پرداخت',
          description: 'تراکنش‌های درگاه بانک در وضعیت خطای ۵۰۰ قرار دارند',
          priority: 'URGENT',
        },
        'req-tkt-1',
      );

      expect(ticket.id).toBeDefined();
      expect(ticket.reference).toMatch(/^TKT-/);
      expect(ticket.priority).toBe('URGENT');
      expect(ticket.targetResolutionAt).toBeDefined();

      const messages = await supportService.getTicketMessages(
        orgAlphaId,
        'SystemOwner',
        ticket.id,
      );
      expect(messages.length).toBe(1);
      expect(messages[0]?.body).toContain('تراکنش‌های درگاه بانک');
    });

    it('prevents cross-tenant access to tickets from another organization', async () => {
      const betaTicketId = '90000000-0000-0000-0000-000000000002'; // Org Beta ticket
      await expect(supportService.getTicketById(orgAlphaId, betaTicketId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('2. Strict Security & Note Privacy Isolation', () => {
    it('allows support agent to view both customer messages and internal notes', async () => {
      const messages = await supportService.getTicketMessages(
        orgAlphaId,
        'SupportAgent',
        ticketAlphaId,
      );

      expect(messages.length).toBe(2);
      expect(messages.some((m) => m.visibility === 'CUSTOMER_SHARED')).toBe(true);
      expect(messages.some((m) => m.visibility === 'INTERNAL')).toBe(true);
    });

    it('STRICT PRIVACY: CustomerPortalUser NEVER receives internal notes', async () => {
      const messages = await supportService.getTicketMessages(
        orgAlphaId,
        'CustomerPortalUser',
        ticketAlphaId,
      );

      // Must only receive customer-shared messages; internal notes are strictly omitted!
      expect(messages.length).toBe(1);
      expect(messages[0]?.visibility).toBe('CUSTOMER_SHARED');
      expect(messages.every((m) => m.visibility !== 'INTERNAL')).toBe(true);
      expect(messages.some((m) => m.body.includes('محرمانه'))).toBe(false);
    });

    it('rejects CustomerPortalUser from adding internal notes with 403 Forbidden', async () => {
      const customer = authService.resolveUser(customerId);

      await expect(
        supportService.addMessage(orgAlphaId, customer, ticketAlphaId, {
          body: 'تلاش غیرمجاز برای ثبت یادداشت داخلی',
          visibility: 'INTERNAL',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows SupportAgent to add customer reply and internal note', async () => {
      const agent = authService.resolveUser(supportAgentId);

      const added = await supportService.addMessage(orgAlphaId, agent, ticketAlphaId, {
        body: 'یادداشت داخلی جدید جهت هماهنگی با تیم زیرساخت',
        visibility: 'INTERNAL',
      });

      expect(added.visibility).toBe('INTERNAL');
      expect(added.authorId).toBe(agent.id);

      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'TICKET_MESSAGE_ADDED');
      expect(audit).toBeDefined();
    });
  });
});
