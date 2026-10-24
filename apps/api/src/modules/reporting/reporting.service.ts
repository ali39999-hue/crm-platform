import { Inject, Injectable } from '@nestjs/common';
import type {
  CrmFunnelReport,
  DashboardKpiReport,
  SupportSlaReport,
  WorkloadReportItem,
} from '@crm/contracts';
import { isSlaBreached } from '@crm/domain';
import type { ITaskRepository } from '../tasks/task.repository.js';
import { InMemoryCrmRepository } from '../crm/crm.repository.js';
import { InMemorySupportRepository } from '../support/support.repository.js';

@Injectable()
export class ReportingService {
  constructor(
    @Inject('TASK_REPOSITORY') private readonly taskRepo: ITaskRepository,
    private readonly crmRepo: InMemoryCrmRepository,
    private readonly supportRepo: InMemorySupportRepository,
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
}
