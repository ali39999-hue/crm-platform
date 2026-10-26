import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { validateSayadiNumber } from '@crm/domain';
import type {
  CheckItemDto,
  CheckStatus,
  CreateInstallmentPlanRequest,
  InstallmentPlanDto,
} from '@crm/contracts';
import { ICrmRepository } from '../crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

@Injectable()
export class InstallmentsService {
  // In-memory store: organizationId -> Map<dealId, InstallmentPlanDto>
  private plans: Map<string, Map<string, InstallmentPlanDto>> = new Map();

  constructor(
    @Inject('CRM_REPOSITORY') private readonly crmRepo: ICrmRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async createInstallmentPlan(
    organizationId: string,
    actorId: string,
    dto: CreateInstallmentPlanRequest,
    requestId?: string,
  ): Promise<InstallmentPlanDto> {
    const deal = await this.crmRepo.findDealById(organizationId, dto.dealId);
    if (!deal) {
      throw new NotFoundException(`Deal ${dto.dealId} not found in this organization`);
    }

    // Validate Sayadi numbers on checks
    for (const check of dto.checks) {
      if (check.sayadiNumber && !validateSayadiNumber(check.sayadiNumber)) {
        throw new BadRequestException(
          `شناسه صیادی چک «${check.checkNumber}» نامعتبر است. شناسه صیادی باید دقیقاً ۱۶ رقم عددی باشد.`,
        );
      }
    }

    const planId = randomUUID();
    const checksWithIds: CheckItemDto[] = dto.checks.map((c) => ({
      ...c,
      id: randomUUID(),
      reminderSent: false,
    }));

    const checksTotal = checksWithIds.reduce((sum, c) => sum + c.amountMinor, 0);
    const totalAmountMinor = dto.downPaymentMinor + checksTotal;

    const plan: InstallmentPlanDto = {
      id: planId,
      dealId: dto.dealId,
      totalAmountMinor,
      downPaymentMinor: dto.downPaymentMinor,
      installmentsCount: dto.installmentsCount,
      checks: checksWithIds,
      createdAt: new Date().toISOString(),
    };

    if (!this.plans.has(organizationId)) {
      this.plans.set(organizationId, new Map());
    }
    this.plans.get(organizationId)!.set(dto.dealId, plan);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_INSTALLMENT_PLAN_CREATED',
      entityType: 'InstallmentPlan',
      entityId: planId,
      requestId,
      metadata: {
        dealId: dto.dealId,
        totalAmountMinor,
        downPaymentMinor: dto.downPaymentMinor,
        checksCount: checksWithIds.length,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmInstallmentPlanCreated',
      aggregateType: 'InstallmentPlan',
      aggregateId: planId,
      payload: {
        dealId: dto.dealId,
        checksCount: checksWithIds.length,
      },
    });

    return plan;
  }

  async getInstallmentPlan(
    organizationId: string,
    dealId: string,
  ): Promise<InstallmentPlanDto> {
    const deal = await this.crmRepo.findDealById(organizationId, dealId);
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found in this organization`);
    }

    const orgPlans = this.plans.get(organizationId);
    const plan = orgPlans?.get(dealId);
    if (!plan) {
      throw new NotFoundException(`Installment plan for deal ${dealId} not found`);
    }

    return plan;
  }

  async updateCheckStatus(
    organizationId: string,
    actorId: string,
    checkId: string,
    status: CheckStatus,
    requestId?: string,
  ): Promise<CheckItemDto> {
    const orgPlans = this.plans.get(organizationId);
    if (!orgPlans) {
      throw new NotFoundException(`Check ${checkId} not found`);
    }

    for (const plan of orgPlans.values()) {
      const check = plan.checks.find((c) => c.id === checkId);
      if (check) {
        check.status = status;

        this.auditService.record({
          organizationId,
          actorId,
          action: 'CRM_CHECK_STATUS_UPDATED',
          entityType: 'Check',
          entityId: checkId,
          requestId,
          metadata: {
            checkNumber: check.checkNumber,
            newStatus: status,
          },
        });

        this.outboxService.emit({
          organizationId,
          eventType: 'CrmCheckStatusUpdated',
          aggregateType: 'Check',
          aggregateId: checkId,
          payload: {
            checkNumber: check.checkNumber,
            status,
          },
        });

        return { ...check };
      }
    }

    throw new NotFoundException(`Check ${checkId} not found in this organization`);
  }

  async sendCheckReminder(
    organizationId: string,
    actorId: string,
    checkId: string,
    requestId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const orgPlans = this.plans.get(organizationId);
    if (!orgPlans) {
      throw new NotFoundException(`Check ${checkId} not found`);
    }

    for (const plan of orgPlans.values()) {
      const check = plan.checks.find((c) => c.id === checkId);
      if (check) {
        check.reminderSent = true;

        this.auditService.record({
          organizationId,
          actorId,
          action: 'CRM_CHECK_REMINDER_SENT',
          entityType: 'Check',
          entityId: checkId,
          requestId,
          metadata: {
            checkNumber: check.checkNumber,
            dueDate: check.dueDate,
          },
        });

        return {
          success: true,
          message: `پیامک یادآوری سررسید چک به شماره ${check.checkNumber} با موفقیت ارسال شد`,
        };
      }
    }

    throw new NotFoundException(`Check ${checkId} not found in this organization`);
  }
}
