import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateWebFormRequest,
  SubmitWebFormRequest,
  SubmitWebFormResponse,
  WebFormDto,
} from '@crm/contracts';
import { ICrmRepository } from '../crm.repository.js';
import { CrmService } from '../crm.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

@Injectable()
export class WebFormService {
  // In-memory store: organizationId -> Map<formId, WebFormDto>
  private forms: Map<string, Map<string, WebFormDto>> = new Map();

  constructor(
    @Inject('CRM_REPOSITORY') private readonly crmRepo: ICrmRepository,
    private readonly crmService: CrmService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async createForm(
    organizationId: string,
    actorId: string,
    dto: CreateWebFormRequest,
    requestId?: string,
  ): Promise<WebFormDto> {
    const formId = randomUUID();
    const slug = `${dto.name.trim().toLowerCase().replace(/[^\w؀-ۿ]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const form: WebFormDto = {
      id: formId,
      organizationId,
      name: dto.name.trim(),
      slug,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      successMessage: dto.successMessage?.trim() || 'درخواست شما با موفقیت ثبت شد.',
      submitButtonText: dto.submitButtonText?.trim() || 'ارسال اطلاعات',
      fields: dto.fields,
      targetPipelineStage: dto.targetPipelineStage,
      assignedUserId: dto.assignedUserId,
      leadSource: dto.leadSource || 'WEBSITE',
      submissionsCount: 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.forms.has(organizationId)) {
      this.forms.set(organizationId, new Map());
    }
    this.forms.get(organizationId)!.set(formId, form);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_WEB_FORM_CREATED',
      entityType: 'WebForm',
      entityId: formId,
      requestId,
      metadata: { name: form.name, slug: form.slug },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmWebFormCreated',
      aggregateType: 'WebForm',
      aggregateId: formId,
      payload: { name: form.name, slug: form.slug },
    });

    return { ...form };
  }

  async getForms(organizationId: string): Promise<WebFormDto[]> {
    const orgForms = this.forms.get(organizationId);
    if (!orgForms) return [];
    return Array.from(orgForms.values()).map((f) => ({ ...f }));
  }

  async getFormById(organizationId: string, formId: string): Promise<WebFormDto> {
    const orgForms = this.forms.get(organizationId);
    const form = orgForms?.get(formId);
    if (!form) {
      throw new NotFoundException(`Web form ${formId} not found in this organization`);
    }
    return { ...form };
  }

  async getFormBySlug(slug: string): Promise<WebFormDto> {
    for (const orgForms of this.forms.values()) {
      for (const form of orgForms.values()) {
        if (form.slug === slug && form.active) {
          return { ...form };
        }
      }
    }
    throw new NotFoundException(`Web form with slug '${slug}' not found`);
  }

  async submitForm(
    formId: string,
    dto: SubmitWebFormRequest,
  ): Promise<SubmitWebFormResponse> {
    let targetForm: WebFormDto | undefined;
    let targetOrgId: string | undefined;

    for (const [orgId, orgForms] of this.forms.entries()) {
      if (orgForms.has(formId)) {
        targetForm = orgForms.get(formId);
        targetOrgId = orgId;
        break;
      }
    }

    if (!targetForm || !targetOrgId || !targetForm.active) {
      throw new NotFoundException(`Web form ${formId} is not active or does not exist`);
    }

    // 1. Validate required fields
    for (const field of targetForm.fields) {
      if (field.required) {
        const val = dto.formData[field.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          throw new BadRequestException(`فیلد الزامی «${field.label}» تکمیل نشده است.`);
        }
      }
    }

    // 2. Extract Lead attributes
    const displayName =
      dto.formData['displayName'] ||
      `${dto.formData['firstName'] || ''} ${dto.formData['lastName'] || ''}`.trim() ||
      'مخاطب وب‌فرم';
    const phone = dto.formData['phone'] || dto.formData['mobile'] || null;
    const email = dto.formData['email'] || null;

    // 3. Create Lead in CRM
    const actorId = targetForm.assignedUserId || 'system-webform';
    const leadResult = await this.crmService.createLead(
      targetOrgId,
      actorId,
      {
        displayName,
        phone,
        email,
        source: targetForm.leadSource,
      },
      dto.idempotencyKey,
    );

    // 4. Increment submissions counter
    targetForm.submissionsCount += 1;
    targetForm.updatedAt = new Date().toISOString();

    this.auditService.record({
      organizationId: targetOrgId,
      actorId: 'public-web-user',
      action: 'CRM_WEB_FORM_SUBMITTED',
      entityType: 'WebForm',
      entityId: formId,
      metadata: {
        leadId: leadResult.lead.id,
        referrerUrl: dto.referrerUrl,
      },
    });

    this.outboxService.emit({
      organizationId: targetOrgId,
      eventType: 'CrmWebFormSubmitted',
      aggregateType: 'WebForm',
      aggregateId: formId,
      payload: {
        formName: targetForm.name,
        leadId: leadResult.lead.id,
        displayName,
      },
    });

    return {
      success: true,
      message: targetForm.successMessage,
      leadId: leadResult.lead.id,
    };
  }
}
