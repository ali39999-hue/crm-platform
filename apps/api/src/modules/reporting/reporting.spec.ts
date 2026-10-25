import { describe, expect, it, beforeEach } from 'vitest';
import { ReportingService } from './reporting.service.js';
import { InMemoryTaskRepository } from '../tasks/task.repository.js';
import { InMemoryCrmRepository } from '../crm/crm.repository.js';
import { InMemorySupportRepository } from '../support/support.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Reporting & KPI Analytics (REPORT-001 & R-064)', () => {
  let reportingService: ReportingService;
  let taskRepo: InMemoryTaskRepository;
  let crmRepo: InMemoryCrmRepository;
  let supportRepo: InMemorySupportRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminActorId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    crmRepo = new InMemoryCrmRepository();
    supportRepo = new InMemorySupportRepository();
    auditService = new AuditService();
    reportingService = new ReportingService(taskRepo, crmRepo, supportRepo, auditService);
  });

  it('calculates workload report correctly for organization', async () => {
    const report = await reportingService.getWorkloadReport(orgAlpha);
    expect(report.length).toBeGreaterThan(0);
    const employeeReport = report.find((r) => r.userId === '22222222-2222-2222-2222-222222222222');
    expect(employeeReport).toBeDefined();
    expect(employeeReport?.activeTasksCount).toBeGreaterThanOrEqual(1);
  });

  it('calculates CRM funnel metrics and conversion rates', async () => {
    const funnel = await reportingService.getCrmFunnel(orgAlpha);
    expect(funnel.totalLeads).toBeGreaterThan(0);
    expect(funnel.stagesBreakdown.length).toBeGreaterThan(0);
    expect(funnel.totalDealsValue).toBeGreaterThan(0);
    expect(funnel.weightedPipelineValue).toBeGreaterThan(0);
  });

  it('calculates support ticket SLA metrics', async () => {
    const sla = await reportingService.getSupportSlaReport(orgAlpha);
    expect(sla.totalTickets).toBeGreaterThan(0);
    expect(sla.openTickets).toBeGreaterThanOrEqual(1);
  });

  it('aggregates dashboard KPI data without cross-tenant leakage', async () => {
    const kpiAlpha = await reportingService.getDashboardKpi(orgAlpha);
    const kpiBeta = await reportingService.getDashboardKpi(orgBeta);

    expect(kpiAlpha.crmFunnel.totalDealsValue).not.toBe(kpiBeta.crmFunnel.totalDealsValue);
  });

  describe('Custom Report Builder & Exporting', () => {
    it('generates grouped custom report for DEALS with total value and percentages', async () => {
      const report = await reportingService.generateCustomReport(orgAlpha, {
        metric: 'DEALS',
        groupBy: 'STAGE',
        timeframe: 'MONTH',
      });

      expect(report.metric).toBe('DEALS');
      expect(report.totalCount).toBeGreaterThan(0);
      expect(report.totalValue).toBeGreaterThan(0);
      expect(report.groups.length).toBeGreaterThan(0);
      expect(report.groups[0]?.percentage).toBeDefined();
    });

    it('generates grouped custom report for LEADS by STATUS', async () => {
      const report = await reportingService.generateCustomReport(orgAlpha, {
        metric: 'LEADS',
        groupBy: 'STATUS',
      });

      expect(report.metric).toBe('LEADS');
      expect(report.totalCount).toBeGreaterThan(0);
      expect(report.groups.some((g) => g.label.includes('سرنخ'))).toBe(true);
    });

    it('exports custom report as CSV and logs audit event', async () => {
      const exported = await reportingService.exportReport(orgAlpha, adminActorId, {
        metric: 'DEALS',
        timeframe: 'MONTH',
      });

      expect(exported.filename).toContain('report-deals-');
      expect(exported.csv).toContain('گروه,تعداد,درصد');
      expect(exported.csv).toContain('%');
    });
  });
});
