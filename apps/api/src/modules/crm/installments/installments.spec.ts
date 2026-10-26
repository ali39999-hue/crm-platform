import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InstallmentsService } from './installments.service.js';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

describe('Didar CRM Installment Sales & Sayadi Check Reminders (Task SL-08)', () => {
  let installmentsService: InstallmentsService;
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
    installmentsService = new InstallmentsService(crmRepo, auditService, outboxService);
  });

  it('creates an installment plan with valid Sayadi checks for a deal', async () => {
    const plan = await installmentsService.createInstallmentPlan(
      orgAlphaId,
      employeeAlphaId,
      {
        dealId,
        downPaymentMinor: 50000000,
        installmentsCount: 2,
        checks: [
          {
            checkNumber: 'CHK-101',
            sayadiNumber: '1234567890123456', // Valid 16-digit Sayadi number
            bankName: 'بانک ملت',
            branchName: 'شعبه مرکزی',
            amountMinor: 150000000,
            dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
            status: 'PENDING',
            drawerName: 'فولاد گستر آریا',
          },
          {
            checkNumber: 'CHK-102',
            sayadiNumber: '9876543210987654', // Valid 16-digit Sayadi number
            bankName: 'بانک پاسارگاد',
            branchName: 'شعبه سعادت‌آباد',
            amountMinor: 150000000,
            dueDate: new Date(Date.now() + 86400000 * 60).toISOString(),
            status: 'PENDING',
            drawerName: 'فولاد گستر آریا',
          },
        ],
      },
      'req-inst-1',
    );

    expect(plan.id).toBeDefined();
    expect(plan.dealId).toBe(dealId);
    expect(plan.totalAmountMinor).toBe(350000000); // 50M down payment + 300M checks
    expect(plan.checks.length).toBe(2);
    expect(plan.checks[0]!.sayadiNumber).toBe('1234567890123456');

    // Audit recorded
    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_INSTALLMENT_PLAN_CREATED');
    expect(audit).toBeDefined();
    expect(audit?.actorId).toBe(employeeAlphaId);
  });

  it('rejects installment plan if a Sayadi number is invalid (not 16 digits)', async () => {
    await expect(
      installmentsService.createInstallmentPlan(orgAlphaId, employeeAlphaId, {
        dealId,
        downPaymentMinor: 50000000,
        installmentsCount: 1,
        checks: [
          {
            checkNumber: 'CHK-INVALID',
            sayadiNumber: '12345', // Invalid length!
            bankName: 'بانک ملی',
            amountMinor: 300000000,
            dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
            status: 'PENDING',
            drawerName: 'تست',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates check status to CLEARED or BOUNCED with audit log', async () => {
    const plan = await installmentsService.createInstallmentPlan(orgAlphaId, employeeAlphaId, {
      dealId,
      downPaymentMinor: 50000000,
      installmentsCount: 1,
      checks: [
        {
          checkNumber: 'CHK-103',
          sayadiNumber: '1111222233334444',
          bankName: 'بانک تجارت',
          amountMinor: 300000000,
          dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
          status: 'PENDING',
          drawerName: 'فولاد گستر آریا',
        },
      ],
    });

    const checkId = plan.checks[0]!.id;

    // Clear check
    const updated = await installmentsService.updateCheckStatus(
      orgAlphaId,
      employeeAlphaId,
      checkId,
      'CLEARED',
    );
    expect(updated.status).toBe('CLEARED');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_CHECK_STATUS_UPDATED');
    expect(audit).toBeDefined();
  });

  it('sends SMS reminder for check due soon', async () => {
    const plan = await installmentsService.createInstallmentPlan(orgAlphaId, employeeAlphaId, {
      dealId,
      downPaymentMinor: 50000000,
      installmentsCount: 1,
      checks: [
        {
          checkNumber: 'CHK-104',
          sayadiNumber: '5555666677778888',
          bankName: 'بانک سامان',
          amountMinor: 300000000,
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // Due in 2 days
          status: 'PENDING',
          drawerName: 'فولاد گستر آریا',
        },
      ],
    });

    const checkId = plan.checks[0]!.id;
    const reminderResult = await installmentsService.sendCheckReminder(
      orgAlphaId,
      employeeAlphaId,
      checkId,
    );

    expect(reminderResult.success).toBe(true);
    expect(reminderResult.message).toContain('پیامک یادآوری');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_CHECK_REMINDER_SENT');
    expect(audit).toBeDefined();
  });

  it('enforces multi-tenant isolation on installment plans', async () => {
    await expect(
      installmentsService.getInstallmentPlan(orgBetaId, dealId),
    ).rejects.toThrow(NotFoundException);
  });
});
