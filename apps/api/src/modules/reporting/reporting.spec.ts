import { describe, expect, it, beforeEach } from 'vitest';
import { ReportingService } from './reporting.service.js';
import { InMemoryTaskRepository } from '../tasks/task.repository.js';
import { InMemoryCrmRepository } from '../crm/crm.repository.js';
import { InMemorySupportRepository } from '../support/support.repository.js';

describe('Reporting & KPI Analytics (REPORT-001)', () => {
  let reportingService: ReportingService;
  let taskRepo: InMemoryTaskRepository;
  let crmRepo: InMemoryCrmRepository;
  let supportRepo: InMemorySupportRepository;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    crmRepo = new InMemoryCrmRepository();
    supportRepo = new InMemorySupportRepository();
    reportingService = new ReportingService(taskRepo, crmRepo, supportRepo);
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
});
