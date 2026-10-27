import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  generateExhibitionWelcomeSms,
  getLeadTemperatureLabel,
  normalizePhone,
} from '@crm/domain';
import type {
  CreateExhibitionLeadRequest,
  ExhibitionLeadIntakeDto,
  LeadTemperature,
} from '@crm/contracts';
import { ICrmRepository } from '../crm.repository.js';
import { CrmService } from '../crm.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

@Injectable()
export class ExhibitionService {
  // In-memory store: organizationId -> Map<intakeId, ExhibitionLeadIntakeDto>
  private intakes: Map<string, Map<string, ExhibitionLeadIntakeDto>> = new Map();

  constructor(
    @Inject('CRM_REPOSITORY') private readonly crmRepo: ICrmRepository,
    private readonly crmService: CrmService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async captureVisitorLead(
    organizationId: string,
    actorId: string,
    actorName: string,
    dto: CreateExhibitionLeadRequest,
    requestId?: string,
  ): Promise<ExhibitionLeadIntakeDto> {
    const normPhone = normalizePhone(dto.mobilePhone);
    if (!normPhone) {
      throw new BadRequestException('شماره تلفن همراه بازدیدکننده نامعتبر است.');
    }

    const intakeId = randomUUID();
    const now = new Date().toISOString();

    // 1. Automatically register as Lead in CRM
    const leadDisplayName = dto.companyName
      ? `${dto.visitorName} (${dto.companyName})`
      : dto.visitorName;

    const leadResult = await this.crmService.createLead(
      organizationId,
      actorId,
      {
        displayName: leadDisplayName,
        phone: normPhone,
        source: 'EXHIBITION',
      },
      `exhibition-lead-${intakeId}`,
    );

    // 2. If Lead Temperature is HOT, auto-create a Deal in pipeline
    let dealId: string | undefined;
    if (dto.temperature === 'HOT') {
      const dealTitle = `فرصت نمایشگاهی - ${dto.companyName || dto.visitorName}`;
      const deal = await this.crmRepo.createDeal({
        organizationId,
        accountId: null,
        ownerId: actorId,
        name: dealTitle,
        stage: 'PROPOSAL',
        amountMinor: 200000000, // Nominal estimated amount
        currency: 'IRR',
        probability: 80,
        targetCloseAt: new Date(Date.now() + 86400000 * 14).toISOString(),
      });
      dealId = deal.id;
    }

    // 3. Welcome SMS
    let welcomeSmsSent = false;
    if (dto.sendWelcomeSms !== false) {
      welcomeSmsSent = true;
      generateExhibitionWelcomeSms(
        dto.visitorName,
        'سامانه مدیریت ارتباط با مشتری',
        dto.exhibitionName,
      );
    }

    const intake: ExhibitionLeadIntakeDto = {
      id: intakeId,
      organizationId,
      exhibitionName: dto.exhibitionName.trim(),
      boothNumber: dto.boothNumber?.trim(),
      visitorName: dto.visitorName.trim(),
      companyName: dto.companyName?.trim(),
      mobilePhone: normPhone,
      jobTitle: dto.jobTitle?.trim(),
      interestProducts: dto.interestProducts || [],
      temperature: dto.temperature,
      notes: dto.notes?.trim(),
      welcomeSmsSent,
      leadId: leadResult.lead.id,
      dealId,
      capturedById: actorId,
      capturedByName: actorName,
      createdAt: now,
    };

    if (!this.intakes.has(organizationId)) {
      this.intakes.set(organizationId, new Map());
    }
    this.intakes.get(organizationId)!.set(intakeId, intake);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_EXHIBITION_LEAD_CAPTURED',
      entityType: 'ExhibitionLead',
      entityId: intakeId,
      requestId,
      metadata: {
        exhibitionName: intake.exhibitionName,
        visitorName: intake.visitorName,
        companyName: intake.companyName,
        temperature: intake.temperature,
        temperatureLabel: getLeadTemperatureLabel(intake.temperature),
        leadId: intake.leadId,
        dealId: intake.dealId,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmExhibitionLeadCaptured',
      aggregateType: 'ExhibitionLead',
      aggregateId: intakeId,
      payload: {
        exhibitionName: intake.exhibitionName,
        visitorName: intake.visitorName,
        temperature: intake.temperature,
        leadId: intake.leadId,
      },
    });

    return { ...intake };
  }

  async getExhibitionLeads(
    organizationId: string,
    exhibitionName?: string,
  ): Promise<ExhibitionLeadIntakeDto[]> {
    const orgIntakes = this.intakes.get(organizationId);
    if (!orgIntakes) return [];

    let list = Array.from(orgIntakes.values());
    if (exhibitionName) {
      list = list.filter((i) => i.exhibitionName === exhibitionName);
    }
    return list.map((i) => ({ ...i }));
  }

  async getExhibitionStats(
    organizationId: string,
    exhibitionName: string,
  ): Promise<{
    exhibitionName: string;
    totalCaptured: number;
    temperatureBreakdown: Record<LeadTemperature, number>;
  }> {
    const leads = await this.getExhibitionLeads(organizationId, exhibitionName);

    const temperatureBreakdown: Record<LeadTemperature, number> = {
      HOT: 0,
      WARM: 0,
      COLD: 0,
    };

    for (const lead of leads) {
      if (temperatureBreakdown[lead.temperature] !== undefined) {
        temperatureBreakdown[lead.temperature] += 1;
      }
    }

    return {
      exhibitionName,
      totalCaptured: leads.length,
      temperatureBreakdown,
    };
  }
}
