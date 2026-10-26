import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CardsPipelineService } from './cards-pipeline.service.js';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

describe('Didar CRM After-Sales Cards Pipeline & Deal Handoff (Tasks PR-01, PR-02)', () => {
  let cardsService: CardsPipelineService;
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const dealId = '80000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    cardsService = new CardsPipelineService(crmRepo, auditService, outboxService);
  });

  it('creates an after-sales project card in the cards pipeline', async () => {
    const card = await cardsService.createCard(orgAlphaId, employeeAlphaId, {
      title: 'استقرار سامانه در شرکت فولاد گستر آریا',
      stage: 'DOCUMENTS_RECEIVED',
      dealId,
      assignedUserIds: [employeeAlphaId],
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      tags: ['استقرار', 'VIP'],
    });

    expect(card.id).toBeDefined();
    expect(card.title).toBe('استقرار سامانه در شرکت فولاد گستر آریا');
    expect(card.stage).toBe('DOCUMENTS_RECEIVED');
    expect(card.accountName).toContain('فولاد گستر');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_PROJECT_CARD_CREATED');
    expect(audit).toBeDefined();
    expect(audit?.actorId).toBe(employeeAlphaId);
  });

  it('transitions a project card through after-sales stages', async () => {
    const card = await cardsService.createCard(orgAlphaId, employeeAlphaId, {
      title: 'پروژه استقرار آزمایشی',
      stage: 'DOCUMENTS_RECEIVED',
    });

    // Advance to Technical Setup
    const updated = await cardsService.updateCard(orgAlphaId, employeeAlphaId, card.id, {
      stage: 'TECHNICAL_SETUP',
      notes: 'سرورها کانفیگ و دیتابیس آماده شد',
    });

    expect(updated.stage).toBe('TECHNICAL_SETUP');
    expect(updated.notes).toContain('دیتابیس آماده شد');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_PROJECT_CARD_UPDATED');
    expect(audit).toBeDefined();
  });

  it('executes 1-click hand-off from WON Deal to Cards Pipeline', async () => {
    // 1. Mark deal as WON first
    const deal = await crmRepo.findDealById(orgAlphaId, dealId);
    if (deal) {
      deal.stage = 'WON';
      await crmRepo.updateDeal(deal);
    }

    // 2. Hand-off deal to project card
    const card = await cardsService.handoffWonDealToProject(orgAlphaId, employeeAlphaId, {
      dealId,
      projectTitle: 'پروژه تحویل و آموزش قرارداد توسعه نرم‌افزار',
      assignedUserIds: [employeeAlphaId],
      dueDate: new Date(Date.now() + 86400000 * 21).toISOString(),
    });

    expect(card.id).toBeDefined();
    expect(card.dealId).toBe(dealId);
    expect(card.stage).toBe('DOCUMENTS_RECEIVED');
    expect(card.accountName).toContain('فولاد گستر');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_DEAL_HANDED_OFF_TO_PROJECT');
    expect(audit).toBeDefined();
  });

  it('enforces multi-tenant isolation on project cards', async () => {
    const card = await cardsService.createCard(orgAlphaId, employeeAlphaId, {
      title: 'پروژه محرمانه سازمان آلفا',
      stage: 'DOCUMENTS_RECEIVED',
    });

    await expect(
      cardsService.updateCard(orgBetaId, 'user-beta', card.id, { stage: 'FINAL_HANDOFF' }),
    ).rejects.toThrow(NotFoundException);
  });
});
