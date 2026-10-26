import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PipelineStageRepository } from './pipeline-stage.repository.js';
import { PipelineStageService } from './pipeline-stage.service.js';
import { PipelineStageController } from './pipeline-stage.controller.js';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { CrmService } from '../crm.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';
import type { UserContext } from '../../../common/auth/auth.types.js';

describe('Configurable Pipeline Stages and Transition Rules (Task F5-04)', () => {
  let stageRepo: PipelineStageRepository;
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;
  let stageService: PipelineStageService;
  let stageController: PipelineStageController;
  let crmService: CrmService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminAlphaId = '11111111-1111-1111-1111-111111111111';
  const salesAlphaId = '22222222-2222-2222-2222-222222222222';
  const adminBetaId = '99999999-9999-9999-9999-999999999999';

  const adminAlphaUser: UserContext = {
    id: adminAlphaId,
    email: 'admin@alpha.com',
    displayName: 'مدیر آلفا',
    activeOrganization: {
      id: orgAlphaId,
      name: 'Alpha Org',
      slug: 'alpha-org',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgAlphaId,
        organizationName: 'Alpha Org',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const salesAlphaUser: UserContext = {
    id: salesAlphaId,
    email: 'sales@alpha.com',
    displayName: 'کارشناس فروش آلفا',
    activeOrganization: {
      id: orgAlphaId,
      name: 'Alpha Org',
      slug: 'alpha-org',
      role: 'Sales',
    },
    memberships: [
      {
        organizationId: orgAlphaId,
        organizationName: 'Alpha Org',
        role: 'Sales',
        active: true,
      },
    ],
  };

  const adminBetaUser: UserContext = {
    id: adminBetaId,
    email: 'admin@beta.com',
    displayName: 'مدیر بتا',
    activeOrganization: {
      id: orgBetaId,
      name: 'Beta Org',
      slug: 'beta-org',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgBetaId,
        organizationName: 'Beta Org',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    stageRepo = new PipelineStageRepository();
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    stageService = new PipelineStageService(
      stageRepo,
      crmRepo,
      auditService,
      outboxService,
    );
    stageController = new PipelineStageController(stageService);
    crmService = new CrmService(crmRepo, auditService, outboxService, stageService);
  });

  describe('1. Default Stages & Multi-Tenant Scoping', () => {
    it('seeds the required default stages with accurate probabilities and flags', async () => {
      const stages = await stageService.getStages(orgAlphaId);
      expect(stages).toHaveLength(6);

      const keys = stages.map((s) => s.key);
      expect(keys).toEqual([
        'QUALIFICATION',
        'NEED_ANALYSIS',
        'PROPOSAL',
        'NEGOTIATION',
        'WON',
        'LOST',
      ]);

      const qual = stages.find((s) => s.key === 'QUALIFICATION');
      expect(qual?.defaultProbability).toBe(10);
      expect(qual?.isWon).toBe(false);
      expect(qual?.isLost).toBe(false);

      const need = stages.find((s) => s.key === 'NEED_ANALYSIS');
      expect(need?.defaultProbability).toBe(25);

      const prop = stages.find((s) => s.key === 'PROPOSAL');
      expect(prop?.defaultProbability).toBe(50);

      const neg = stages.find((s) => s.key === 'NEGOTIATION');
      expect(neg?.defaultProbability).toBe(80);

      const won = stages.find((s) => s.key === 'WON');
      expect(won?.defaultProbability).toBe(100);
      expect(won?.isWon).toBe(true);
      expect(won?.isLost).toBe(false);

      const lost = stages.find((s) => s.key === 'LOST');
      expect(lost?.defaultProbability).toBe(0);
      expect(lost?.isWon).toBe(false);
      expect(lost?.isLost).toBe(true);
    });

    it('isolates stage configuration between tenants', async () => {
      // Modify Org Alpha stages by adding a custom stage
      await stageService.createStage(orgAlphaId, adminAlphaId, {
        name: 'بررسی امنیتی و حقوقی',
        key: 'SECURITY_REVIEW',
        order: 4,
        defaultProbability: 60,
      });

      const alphaStages = await stageService.getStages(orgAlphaId);
      const betaStages = await stageService.getStages(orgBetaId);

      expect(alphaStages.some((s) => s.key === 'SECURITY_REVIEW')).toBe(true);
      expect(betaStages.some((s) => s.key === 'SECURITY_REVIEW')).toBe(false);
      expect(betaStages).toHaveLength(6);
    });

    it('prevents IDOR: accessing or mutating another organization stage fails', async () => {
      const betaStages = await stageService.getStages(orgBetaId);
      const betaStageId = betaStages[0]!.id;

      // Access from Org Alpha context
      await expect(stageService.getStageById(orgAlphaId, betaStageId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(
        stageService.updateStage(orgAlphaId, adminAlphaId, betaStageId, {
          name: 'تغییر غیرمجاز',
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        stageService.deleteStage(orgAlphaId, adminAlphaId, betaStageId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Pipeline Stages CRUD Validation', () => {
    it('creates a new stage, calculates order if omitted, and logs audit', async () => {
      const created = await stageService.createStage(
        orgAlphaId,
        adminAlphaId,
        {
          name: 'جلسه دمو',
          key: 'demo_scheduled',
          defaultProbability: 35,
          color: '#06b6d4',
        },
        'req-create-1',
      );

      expect(created.id).toBeDefined();
      expect(created.key).toBe('DEMO_SCHEDULED');
      expect(created.defaultProbability).toBe(35);
      expect(created.order).toBe(7); // Max order was 6, now 7

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_PIPELINE_STAGE_CREATED');
      expect(audits).toHaveLength(1);
      expect(audits[0]?.metadata?.['key']).toBe('DEMO_SCHEDULED');

      const outbox = outboxService
        .getEvents(orgAlphaId)
        .filter((e) => e.eventType === 'PipelineStageCreated');
      expect(outbox).toHaveLength(1);
    });

    it('rejects duplicate stage keys in the same organization', async () => {
      await expect(
        stageService.createStage(orgAlphaId, adminAlphaId, {
          name: 'پیشنهاد مجدد',
          key: 'proposal', // Already exists as PROPOSAL
          defaultProbability: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects stage marked as both Won and Lost', async () => {
      await expect(
        stageService.createStage(orgAlphaId, adminAlphaId, {
          name: 'نامشخص',
          key: 'UNCERTAIN',
          isWon: true,
          isLost: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates an existing stage and preserves invariants', async () => {
      const stages = await stageService.getStages(orgAlphaId);
      const needAnalysis = stages.find((s) => s.key === 'NEED_ANALYSIS')!;

      const updated = await stageService.updateStage(
        orgAlphaId,
        adminAlphaId,
        needAnalysis.id,
        {
          name: 'تحلیل دقیق نیازمندی‌ها',
          defaultProbability: 30,
          color: '#2563eb',
        },
        'req-upd-1',
      );

      expect(updated.name).toBe('تحلیل دقیق نیازمندی‌ها');
      expect(updated.defaultProbability).toBe(30);
      expect(updated.color).toBe('#2563eb');

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_PIPELINE_STAGE_UPDATED');
      expect(audits).toHaveLength(1);
    });

    it('prevents deleting a stage if deals are currently associated with it', async () => {
      const stages = await stageService.getStages(orgAlphaId);
      // Seed deal in Org Alpha is in stage 'PROPOSAL'
      const proposalStage = stages.find((s) => s.key === 'PROPOSAL')!;

      await expect(
        stageService.deleteStage(orgAlphaId, adminAlphaId, proposalStage.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents deleting the only Won or only Lost stage in an organization', async () => {
      const stages = await stageService.getStages(orgAlphaId);
      const wonStage = stages.find((s) => s.key === 'WON')!;
      const lostStage = stages.find((s) => s.key === 'LOST')!;

      await expect(
        stageService.deleteStage(orgAlphaId, adminAlphaId, wonStage.id),
      ).rejects.toThrow(BadRequestException);

      await expect(
        stageService.deleteStage(orgAlphaId, adminAlphaId, lostStage.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('deletes an unused stage successfully', async () => {
      const custom = await stageService.createStage(orgAlphaId, adminAlphaId, {
        name: 'مرحله آزمایشی',
        key: 'EXPERIMENTAL',
        defaultProbability: 15,
      });

      const result = await stageService.deleteStage(orgAlphaId, adminAlphaId, custom.id);
      expect(result.success).toBe(true);

      const stages = await stageService.getStages(orgAlphaId);
      expect(stages.some((s) => s.id === custom.id)).toBe(false);

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_PIPELINE_STAGE_DELETED');
      expect(audits).toHaveLength(1);
    });
  });

  describe('3. Reordering Stages', () => {
    it('reorders stages and persists new order indices', async () => {
      const stages = await stageService.getStages(orgAlphaId);
      const reversedIds = [...stages].reverse().map((s) => s.id);

      const reordered = await stageService.reorderStages(
        orgAlphaId,
        adminAlphaId,
        reversedIds,
        'req-reorder-1',
      );

      expect(reordered[0]?.id).toBe(reversedIds[0]);
      expect(reordered[0]?.order).toBe(1);
      expect(reordered[reordered.length - 1]?.order).toBe(reordered.length);

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_PIPELINE_STAGES_REORDERED');
      expect(audits).toHaveLength(1);
    });

    it('rejects reordering when stage IDs from other tenants or invalid IDs are provided', async () => {
      const betaStages = await stageService.getStages(orgBetaId);
      const foreignId = betaStages[0]!.id;

      await expect(
        stageService.reorderStages(orgAlphaId, adminAlphaId, [foreignId]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Stage Transition Rules & Admin Capability Enforcement', () => {
    it('allows regular Sales roles to transition between active stages', async () => {
      const res = await stageService.validateTransition(
        orgAlphaId,
        'QUALIFICATION',
        'NEED_ANALYSIS',
        'Sales',
      );
      expect(res.valid).toBe(true);
    });

    it('allows regular Sales roles to transition from active stage to WON or LOST', async () => {
      const toWon = await stageService.validateTransition(
        orgAlphaId,
        'NEGOTIATION',
        'WON',
        'Sales',
      );
      expect(toWon.valid).toBe(true);

      const toLost = await stageService.validateTransition(
        orgAlphaId,
        'PROPOSAL',
        'LOST',
        'Sales',
      );
      expect(toLost.valid).toBe(true);
    });

    it('forbids non-admin (Sales, Employee) from transitioning from WON to LOST', async () => {
      await expect(
        stageService.validateTransition(orgAlphaId, 'WON', 'LOST', 'Sales'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        stageService.validateTransition(orgAlphaId, 'WON', 'LOST', 'Employee'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows administrators to transition from WON to LOST', async () => {
      const resAdmin = await stageService.validateTransition(
        orgAlphaId,
        'WON',
        'LOST',
        'OrganizationAdmin',
      );
      expect(resAdmin.valid).toBe(true);

      const resOwner = await stageService.validateTransition(
        orgAlphaId,
        'WON',
        'LOST',
        'SystemOwner',
      );
      expect(resOwner.valid).toBe(true);
    });

    it('forbids non-admin from reopening closed deals (WON/LOST -> in-progress)', async () => {
      await expect(
        stageService.validateTransition(orgAlphaId, 'WON', 'PROPOSAL', 'Sales'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        stageService.validateTransition(orgAlphaId, 'LOST', 'QUALIFICATION', 'Sales'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows administrators to reopen closed deals', async () => {
      const reopened = await stageService.validateTransition(
        orgAlphaId,
        'WON',
        'NEGOTIATION',
        'OrganizationAdmin',
      );
      expect(reopened.valid).toBe(true);
    });

    it('rejects transitions involving unconfigured stages', async () => {
      await expect(
        stageService.validateTransition(orgAlphaId, 'QUALIFICATION', 'NON_EXISTENT', 'Sales'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        stageService.validateTransition(orgAlphaId, 'UNKNOWN', 'PROPOSAL', 'Sales'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Dynamic Probability & Weighted Value Calculations', () => {
    it('returns stage probability dynamically based on configured stage', async () => {
      const prob1 = await stageService.getStageProbability(orgAlphaId, 'PROPOSAL');
      expect(prob1).toBe(50);

      // Update proposal default probability to 55
      const stages = await stageService.getStages(orgAlphaId);
      const propStage = stages.find((s) => s.key === 'PROPOSAL')!;
      await stageService.updateStage(orgAlphaId, adminAlphaId, propStage.id, {
        defaultProbability: 55,
      });

      const prob2 = await stageService.getStageProbability(orgAlphaId, 'PROPOSAL');
      expect(prob2).toBe(55);
    });

    it('calculates deal weighted value dynamically', async () => {
      // Deal without explicit probability takes stage default (80% for NEGOTIATION)
      const res1 = await stageService.calculateDealWeightedValue(orgAlphaId, {
        stage: 'NEGOTIATION',
        amountMinor: 100000000,
      });
      expect(res1.probability).toBe(80);
      expect(res1.weightedAmountMinor).toBe(80000000);

      // Deal with explicit probability overrides stage default
      const res2 = await stageService.calculateDealWeightedValue(orgAlphaId, {
        stage: 'NEGOTIATION',
        amountMinor: 100000000,
        probability: 65,
      });
      expect(res2.probability).toBe(65);
      expect(res2.weightedAmountMinor).toBe(65000000);
    });

    it('calculates pipeline summary breakdown across configured stages', async () => {
      const deals = await crmRepo.findDeals(orgAlphaId);
      const summary = await stageService.calculatePipelineSummary(orgAlphaId, deals);

      expect(summary.totalValueMinor).toBe(530000000);
      expect(summary.stages.length).toBe(6);

      const propSummary = summary.stages.find((s) => s.stage.key === 'PROPOSAL');
      expect(propSummary?.dealCount).toBe(1);
      expect(propSummary?.totalAmountMinor).toBe(350000000);
    });
  });

  describe('6. Integration with CrmService and Deals', () => {
    it('creates deal using stage default probability when omitted', async () => {
      const deal = await crmService.createDeal(orgAlphaId, salesAlphaId, {
        name: 'معامله با تحلیل نیازها',
        stage: 'NEED_ANALYSIS',
        amountMinor: 200000000,
      });

      expect(deal.stage).toBe('NEED_ANALYSIS');
      expect(deal.probability).toBe(25); // Need analysis default is 25%
    });

    it('rejects creating deal with invalid stage', async () => {
      await expect(
        crmService.createDeal(orgAlphaId, salesAlphaId, {
          name: 'معامله نامعتبر',
          stage: 'INVALID_STAGE',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces transition rules on deal stage update', async () => {
      // 1. Create a deal in NEGOTIATION
      const deal = await crmService.createDeal(orgAlphaId, salesAlphaId, {
        name: 'پروژه قرارداد بزرگ',
        stage: 'NEGOTIATION',
        amountMinor: 500000000,
      });

      // 2. Sales moves deal to WON (allowed)
      const wonDeal = await crmService.updateDeal(
        orgAlphaId,
        salesAlphaId,
        'Sales',
        deal.id,
        { stage: 'WON' },
      );
      expect(wonDeal.stage).toBe('WON');
      expect(wonDeal.probability).toBe(100);

      // 3. Sales attempts to move WON deal to LOST (forbidden!)
      await expect(
        crmService.updateDeal(orgAlphaId, salesAlphaId, 'Sales', deal.id, {
          stage: 'LOST',
        }),
      ).rejects.toThrow(ForbiddenException);

      // 4. Admin moves WON deal to LOST (allowed!)
      const lostDeal = await crmService.updateDeal(
        orgAlphaId,
        adminAlphaId,
        'OrganizationAdmin',
        deal.id,
        { stage: 'LOST' },
      );
      expect(lostDeal.stage).toBe('LOST');
      expect(lostDeal.probability).toBe(0);
    });
  });

  describe('7. PipelineStageController API Endpoints', () => {
    it('GET /crm/pipeline-stages returns organization stages', async () => {
      const stages = await stageController.getStages(adminAlphaUser);
      expect(stages).toHaveLength(6);
    });

    it('POST /crm/pipeline-stages creates stage', async () => {
      const stage = await stageController.createStage(
        adminAlphaUser,
        {
          name: 'تأیید مالی و پیش‌پرداخت',
          key: 'FINANCIAL_APPROVAL',
          defaultProbability: 90,
          color: '#14b8a6',
        },
        {} as any,
      );

      expect(stage.key).toBe('FINANCIAL_APPROVAL');
      expect(stage.defaultProbability).toBe(90);
    });

    it('PATCH /crm/pipeline-stages/:id updates stage', async () => {
      const stages = await stageController.getStages(adminAlphaUser);
      const stageId = stages[0]!.id;

      const updated = await stageController.updateStage(
        adminAlphaUser,
        stageId,
        {
          name: 'ارزیابی کیفی اولیه',
        },
        {} as any,
      );

      expect(updated.name).toBe('ارزیابی کیفی اولیه');
    });

    it('POST /crm/pipeline-stages/reorder reorders stages', async () => {
      const stages = await stageController.getStages(adminAlphaUser);
      const reorderedIds = [stages[1]!.id, stages[0]!.id, ...stages.slice(2).map((s) => s.id)];

      const result = await stageController.reorderStages(
        adminAlphaUser,
        { stageIds: reorderedIds },
        {} as any,
      );

      expect(result[0]?.id).toBe(reorderedIds[0]);
    });

    it('DELETE /crm/pipeline-stages/:id deletes unused stage', async () => {
      const custom = await stageController.createStage(
        adminAlphaUser,
        {
          name: 'مرحله حذف‌شدنی',
          key: 'TO_DELETE',
        },
        {} as any,
      );

      const delResult = await stageController.deleteStage(
        adminAlphaUser,
        custom.id,
        {} as any,
      );
      expect(delResult.success).toBe(true);
    });
  });
});
