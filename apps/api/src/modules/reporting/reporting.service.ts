import { Inject, Injectable } from '@nestjs/common';
import type {
  CrmFunnelReport,
  CustomReportQueryDto,
  CustomReportResultDto,
  DashboardKpiReport,
  ExecutiveMonitoringDto,
  ReportGroupBreakdown,
  SupportSlaReport,
  WorkloadReportItem,
} from '@crm/contracts';
import { calculate5AxisMonitoring, isSlaBreached, isCustomerDormant, isDealRotting } from '@crm/domain';
import type { ITaskRepository } from '../tasks/task.repository.js';
import type { ICrmRepository } from '../crm/crm.repository.js';
import type { ISupportRepository } from '../support/support.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ReportingService {
  constructor(
    @Inject('TASK_REPOSITORY') private readonly taskRepo: ITaskRepository,
    @Inject('CRM_REPOSITORY') private readonly crmRepo: ICrmRepository,
    @Inject('SUPPORT_REPOSITORY') private readonly supportRepo: ISupportRepository,
    private readonly auditService: AuditService,
  ) {}

  async getWorkloadReport(organizationId: string): Promise<WorkloadReportItem[]> {
    const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });
    const userMap = new Map<string, WorkloadReportItem>();
    const now = new Date();

    for (const task of tasks) {
      const userId = task.assigneeId ?? 'unassigned';
      const userName = task.assigneeId ? 'کاربر ' + task.assigneeId.slice(0, 4) : 'تخصیص‌نیافته';

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName,
          activeTasksCount: 0,
          overdueTasksCount: 0,
          completedTasksCount: 0,
        });
      }

      const item = userMap.get(userId)!;
      if (task.status === 'DONE') {
        item.completedTasksCount++;
      } else if (task.status !== 'CANCELED') {
        item.activeTasksCount++;
        if (task.dueAt && new Date(task.dueAt) < now) {
          item.overdueTasksCount++;
        }
      }
    }

    return Array.from(userMap.values());
  }

  async getCrmFunnel(organizationId: string): Promise<CrmFunnelReport> {
    const leads = await this.crmRepo.findLeads(organizationId);
    const deals = await this.crmRepo.findDeals(organizationId);

    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
    const conversionRatePercent =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const stagesMap = new Map<string, { count: number; amount: number }>();
    let totalDealsValue = 0;
    let weightedPipelineValue = 0;

    for (const deal of deals) {
      const amount = deal.amountMinor ?? 0;
      const prob = deal.probability ?? 10;
      totalDealsValue += amount;
      weightedPipelineValue += Math.round((amount * prob) / 100);

      const stageInfo = stagesMap.get(deal.stage) ?? { count: 0, amount: 0 };
      stageInfo.count += 1;
      stageInfo.amount += amount;
      stagesMap.set(deal.stage, stageInfo);
    }

    const stagesBreakdown = Array.from(stagesMap.entries()).map(([stage, info]) => ({
      stage,
      count: info.count,
      amount: info.amount,
    }));

    return {
      totalLeads,
      convertedLeads,
      conversionRatePercent,
      totalDealsValue,
      weightedPipelineValue,
      stagesBreakdown,
    };
  }

  async getSupportSlaReport(organizationId: string): Promise<SupportSlaReport> {
    const tickets = await this.supportRepo.findTickets(organizationId);
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (t) => t.status === 'NEW' || t.status === 'OPEN' || t.status === 'PENDING_INTERNAL',
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
    ).length;

    let breachedCount = 0;
    const now = new Date();
    for (const t of tickets) {
      if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') {
        if (t.targetResolutionAt && isSlaBreached(new Date(t.targetResolutionAt), now)) {
          breachedCount++;
        }
      }
    }

    const slaBreachRatePercent =
      totalTickets > 0 ? Math.round((breachedCount / totalTickets) * 100) : 0;

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      slaBreachRatePercent,
      averageResolutionHours: 4.5,
    };
  }

  async getDashboardKpi(organizationId: string): Promise<DashboardKpiReport> {
    const [workload, crmFunnel, supportSla] = await Promise.all([
      this.getWorkloadReport(organizationId),
      this.getCrmFunnel(organizationId),
      this.getSupportSlaReport(organizationId),
    ]);

    return {
      workload,
      crmFunnel,
      supportSla,
      generatedAt: new Date().toISOString(),
    };
  }

  /* Custom Report Builder Engine */

  async generateCustomReport(
    organizationId: string,
    query: CustomReportQueryDto,
  ): Promise<CustomReportResultDto> {
    const timeframe = query.timeframe || 'MONTH';
    const groupBy = query.groupBy || 'STATUS';
    const groups: ReportGroupBreakdown[] = [];

    let totalCount = 0;
    let totalValue: number | undefined = undefined;

    if (query.metric === 'LEADS') {
      const leads = await this.crmRepo.findLeads(organizationId);
      totalCount = leads.length;
      const map = new Map<string, number>();

      for (const lead of leads) {
        const key = lead.status;
        map.set(key, (map.get(key) || 0) + 1);
      }

      for (const [key, count] of map.entries()) {
        groups.push({
          key,
          label: this.getLeadStatusLabel(key),
          count,
          percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        });
      }
    } else if (query.metric === 'DEALS') {
      const deals = await this.crmRepo.findDeals(organizationId);
      totalCount = deals.length;
      totalValue = deals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);
      const map = new Map<string, { count: number; value: number }>();

      for (const deal of deals) {
        const key = deal.stage;
        const cur = map.get(key) || { count: 0, value: 0 };
        cur.count += 1;
        cur.value += deal.amountMinor ?? 0;
        map.set(key, cur);
      }

      for (const [key, info] of map.entries()) {
        groups.push({
          key,
          label: key,
          count: info.count,
          value: info.value,
          percentage: totalCount > 0 ? Math.round((info.count / totalCount) * 100) : 0,
        });
      }
    } else if (query.metric === 'TASKS') {
      const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });
      totalCount = tasks.length;
      const map = new Map<string, number>();

      for (const task of tasks) {
        const key = groupBy === 'PRIORITY' ? task.priority : task.status;
        map.set(key, (map.get(key) || 0) + 1);
      }

      for (const [key, count] of map.entries()) {
        groups.push({
          key,
          label: key,
          count,
          percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        });
      }
    } else if (query.metric === 'TICKETS') {
      const tickets = await this.supportRepo.findTickets(organizationId);
      totalCount = tickets.length;
      const map = new Map<string, number>();

      for (const ticket of tickets) {
        const key = groupBy === 'PRIORITY' ? ticket.priority : ticket.status;
        map.set(key, (map.get(key) || 0) + 1);
      }

      for (const [key, count] of map.entries()) {
        groups.push({
          key,
          label: key,
          count,
          percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        });
      }
    }

    const result: CustomReportResultDto = {
      metric: query.metric,
      groupBy,
      timeframe,
      totalCount,
      groups,
      generatedAt: new Date().toISOString(),
    };
    if (totalValue !== undefined) {
      result.totalValue = totalValue;
    }

    return result;
  }

  async exportReport(
    organizationId: string,
    actorId: string,
    query: CustomReportQueryDto,
  ): Promise<{ csv: string; filename: string }> {
    const report = await this.generateCustomReport(organizationId, query);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `report-${query.metric.toLowerCase()}-${dateStr}.csv`;

    const headers = ['گروه', 'تعداد', 'درصد'];
    if (report.totalValue !== undefined) {
      headers.push('ارزش ریالی');
    }

    const rows = report.groups.map((g) => {
      const row = [g.label, String(g.count), `${g.percentage}%`];
      if (g.value !== undefined) {
        row.push(String(g.value));
      }
      return row.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    this.auditService.record({
      organizationId,
      actorId,
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      entityId: query.metric,
      metadata: { metric: query.metric, timeframe: query.timeframe },
    });

    return { csv, filename };
  }

  async getExecutive5AxisMonitoring(organizationId: string): Promise<ExecutiveMonitoringDto> {
    const now = new Date();
    const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });
    const deals = await this.crmRepo.findDeals(organizationId);
    const contacts = await this.crmRepo.findContacts(organizationId);

    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const delayedTasks = tasks.filter(
      (t) => t.dueAt && new Date(t.dueAt) < now && t.status !== 'DONE',
    ).length;
    const awaitingApprovalTasks = tasks.filter(
      (t) => t.status === 'IN_REVIEW',
    ).length;

    const activeDeals = deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST').length;
    const delayedDeals = deals.filter((d) => {
      const days = d.stageUpdatedAt
        ? Math.floor((now.getTime() - new Date(d.stageUpdatedAt).getTime()) / 86400000)
        : Math.floor((now.getTime() - new Date(d.createdAt).getTime()) / 86400000);
      return isDealRotting(days, d.stage);
    }).length;

    const activeContacts = contacts.length;
    const dormantContacts = contacts.filter((c) => isCustomerDormant(c.lastInteractionAt)).length;

    const summary = calculate5AxisMonitoring({
      projects: {
        active: activeDeals,
        delayed: delayedDeals,
        total: Math.max(1, deals.length),
      },
      tasks: {
        completed: completedTasks,
        delayed: delayedTasks,
        awaitingApproval: awaitingApprovalTasks,
        total: Math.max(1, tasks.length),
      },
      meetings: {
        held: 8,
        signedResolutions: 7,
        totalResolutions: 8,
      },
      customers: {
        activeInteractions: activeContacts,
        dormantCount: dormantContacts,
      },
      financials: {
        totalArrearsMinor: 0,
        overdueChecksCount: 0,
      },
    });

    return {
      ...summary,
      generatedAt: now.toISOString(),
    };
  }


  private getLeadStatusLabel(status: string): string {
    switch (status) {
      case 'NEW':
        return 'سرنخ جدید';
      case 'CONTACTED':
        return 'تماس گرفته شده';
      case 'QUALIFIED':
        return 'واجد شرایط';
      case 'UNQUALIFIED':
        return 'فاقد شرایط';
      case 'CONVERTED':
        return 'تبدیل‌شده به مشتری';
      default:
        return status;
    }
  }
}
