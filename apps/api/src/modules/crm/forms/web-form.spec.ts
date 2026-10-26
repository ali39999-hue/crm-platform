import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WebFormService } from './web-form.service.js';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { CrmService } from '../crm.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

describe('Didar Web Form Builder & Public Lead Capture (Task IN-04)', () => {
  let formService: WebFormService;
  let crmService: CrmService;
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    crmService = new CrmService(crmRepo, auditService, outboxService);
    formService = new WebFormService(crmRepo, crmService, auditService, outboxService);
  });

  it('creates an embeddable web form for lead generation', async () => {
    const form = await formService.createForm(orgAlphaId, employeeAlphaId, {
      name: 'فرم درخواست مشاوره و دمو',
      title: 'درخواست دمو و مشاوره رایگان نرم‌افزار',
      description: 'لطفاً اطلاعات تماس خود را وارد نمایید تا کارشناسان ما در اسرع وقت تماس حاصل نمایند.',
      successMessage: 'درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
      submitButtonText: 'ارسال درخواست مشاوره',
      leadSource: 'WEBSITE',
      fields: [
        {
          id: 'f-1',
          name: 'displayName',
          label: 'نام و نام خانوادگی',
          type: 'TEXT',
          required: true,
        },
        {
          id: 'f-2',
          name: 'phone',
          label: 'شماره تلفن همراه',
          type: 'PHONE',
          required: true,
        },
        {
          id: 'f-3',
          name: 'email',
          label: 'پست الکترونیکی',
          type: 'EMAIL',
          required: false,
        },
      ],
    });

    expect(form.id).toBeDefined();
    expect(form.slug).toBeDefined();
    expect(form.fields.length).toBe(3);
    expect(form.submissionsCount).toBe(0);

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_WEB_FORM_CREATED');
    expect(audit).toBeDefined();
  });

  it('handles public form submission and automatically creates a qualified Lead in CRM', async () => {
    const form = await formService.createForm(orgAlphaId, employeeAlphaId, {
      name: 'فرم تماس با ما',
      title: 'تماس با ما',
      successMessage: 'پیام دریافت شد',
      submitButtonText: 'ارسال',
      leadSource: 'LANDING_PAGE',
      fields: [
        { id: 'f-1', name: 'displayName', label: 'نام', type: 'TEXT', required: true },
        { id: 'f-2', name: 'phone', label: 'موبایل', type: 'PHONE', required: true },
      ],
    });

    const submissionResult = await formService.submitForm(form.id, {
      formId: form.id,
      formData: {
        displayName: 'آرش علوی',
        phone: '09123456789',
      },
      referrerUrl: 'https://example.com/demo',
    });

    expect(submissionResult.success).toBe(true);
    expect(submissionResult.leadId).toBeDefined();

    // Verify lead exists in CRM repository
    const lead = await crmRepo.findLeadById(orgAlphaId, submissionResult.leadId);
    expect(lead).toBeDefined();
    expect(lead?.displayName).toBe('آرش علوی');
    expect(lead?.phone).toBe('09123456789');
    expect(lead?.source).toBe('LANDING_PAGE');

    // Submissions counter incremented
    const updatedForm = await formService.getFormById(orgAlphaId, form.id);
    expect(updatedForm.submissionsCount).toBe(1);
  });

  it('rejects submission if required fields are missing', async () => {
    const form = await formService.createForm(orgAlphaId, employeeAlphaId, {
      name: 'فرم ثبت‌نام',
      title: 'ثبت‌نام',
      successMessage: 'تایید',
      submitButtonText: 'ثبت',
      fields: [
        { id: 'f-1', name: 'displayName', label: 'نام', type: 'TEXT', required: true },
        { id: 'f-2', name: 'phone', label: 'موبایل', type: 'PHONE', required: true },
      ],
    });

    await expect(
      formService.submitForm(form.id, {
        formId: form.id,
        formData: {
          displayName: 'تست بدون شماره تلفن',
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
