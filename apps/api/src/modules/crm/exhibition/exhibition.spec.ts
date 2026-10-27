import { describe, expect, it, beforeEach } from 'vitest';
import { ExhibitionService } from './exhibition.service.js';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { CrmService } from '../crm.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

describe('Didar Leeda Exhibition Lead Intake & Booth Automation (Task RP-04 & Leeda Module)', () => {
  let exhibitionService: ExhibitionService;
  let crmService: CrmService;
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlpha = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'سارا احمدی',
  };

  beforeEach(() => {
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    crmService = new CrmService(crmRepo, auditService, outboxService);
    exhibitionService = new ExhibitionService(crmRepo, crmService, auditService, outboxService);
  });

  it('captures an exhibition booth visitor, creates CRM Lead, and records audit', async () => {
    const intake = await exhibitionService.captureVisitorLead(
      orgAlphaId,
      employeeAlpha.id,
      employeeAlpha.name,
      {
        exhibitionName: 'نمایشگاه بین‌المللی نفت و گاز ۱۴۰۵',
        boothNumber: 'سالن ۶ - غرفه ۱۲',
        visitorName: 'دکتر فرشید کاظمی',
        companyName: 'پتروپارس سازه',
        mobilePhone: '09123334455',
        jobTitle: 'مدیر مهندسی و خرید',
        interestProducts: ['لایسنس سازمانی', 'استقرار سفارشی'],
        temperature: 'WARM',
        notes: 'مذاکره اولیه عالی، درخواست ارسال دمو در هفته آینده',
        sendWelcomeSms: true,
      },
    );

    expect(intake.id).toBeDefined();
    expect(intake.visitorName).toBe('دکتر فرشید کاظمی');
    expect(intake.welcomeSmsSent).toBe(true);
    expect(intake.leadId).toBeDefined();

    // Verify Lead created in CRM repository
    const lead = await crmRepo.findLeadById(orgAlphaId, intake.leadId!);
    expect(lead).toBeDefined();
    expect(lead?.displayName).toContain('دکتر فرشید کاظمی');
    expect(lead?.source).toBe('EXHIBITION');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'CRM_EXHIBITION_LEAD_CAPTURED');
    expect(audit).toBeDefined();
    expect(audit?.actorId).toBe(employeeAlpha.id);
  });

  it('automatically fast-tracks to a Deal when lead temperature is HOT', async () => {
    const hotIntake = await exhibitionService.captureVisitorLead(
      orgAlphaId,
      employeeAlpha.id,
      employeeAlpha.name,
      {
        exhibitionName: 'الکامپ ۱۴۰۵',
        visitorName: 'مهندس آرش طاهری',
        companyName: 'صنایع الکترونیک شیراز',
        mobilePhone: '09121112233',
        interestProducts: ['سامانه CRM سازمانی'],
        temperature: 'HOT', // HOT lead ready to buy!
        notes: 'بودجه مصوب دارند و خواستار ارسال فوری پیش‌فاکتور هستند',
      },
    );

    expect(hotIntake.dealId).toBeDefined();
    const deal = await crmRepo.findDealById(orgAlphaId, hotIntake.dealId!);
    expect(deal).toBeDefined();
    expect(deal?.name).toContain('فرصت نمایشگاهی - صنایع الکترونیک شیراز');
    expect(deal?.stage).toBe('PROPOSAL');
  });

  it('aggregates exhibition statistics by temperature and product interest', async () => {
    await exhibitionService.captureVisitorLead(orgAlphaId, employeeAlpha.id, employeeAlpha.name, {
      exhibitionName: 'الکامپ ۱۴۰۵',
      visitorName: 'بازدیدکننده ۱',
      mobilePhone: '09121110001',
      temperature: 'HOT',
      interestProducts: ['محصول الف'],
    });

    await exhibitionService.captureVisitorLead(orgAlphaId, employeeAlpha.id, employeeAlpha.name, {
      exhibitionName: 'الکامپ ۱۴۰۵',
      visitorName: 'بازدیدکننده ۲',
      mobilePhone: '09121110002',
      temperature: 'COLD',
      interestProducts: ['محصول الف', 'محصول ب'],
    });

    const stats = await exhibitionService.getExhibitionStats(orgAlphaId, 'الکامپ ۱۴۰۵');
    expect(stats.totalCaptured).toBe(2);
    expect(stats.temperatureBreakdown.HOT).toBe(1);
    expect(stats.temperatureBreakdown.COLD).toBe(1);
  });

  it('enforces multi-tenant isolation on exhibition leads', async () => {
    await exhibitionService.captureVisitorLead(orgAlphaId, employeeAlpha.id, employeeAlpha.name, {
      exhibitionName: 'نمایشگاه صنعت',
      visitorName: 'مشتری آلفا',
      mobilePhone: '09120000000',
      temperature: 'WARM',
    });

    const betaLeads = await exhibitionService.getExhibitionLeads(orgBetaId);
    expect(betaLeads.length).toBe(0);
  });
});
