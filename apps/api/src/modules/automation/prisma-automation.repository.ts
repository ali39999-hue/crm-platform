import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AutomationRuleEntity,
  AutomationRunEntity,
  IAutomationRepository,
} from './automation.repository.js';
import type { AutomationActionType, AutomationTrigger } from '@crm/contracts';

@Injectable()
export class PrismaAutomationRepository implements IAutomationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRule(r: any): AutomationRuleEntity {
    return {
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      trigger: r.trigger as AutomationTrigger,
      conditionField: r.conditionField ?? null,
      conditionValue: r.conditionValue ?? null,
      actionType: r.actionType as AutomationActionType,
      actionPayload: r.actionPayload ?? {},
      enabled: r.enabled,
      executionCount: r.executionCount,
      lastExecutedAt: r.lastExecutedAt ? r.lastExecutedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private mapRun(x: any): AutomationRunEntity {
    return {
      id: x.id,
      organizationId: x.organizationId,
      ruleId: x.ruleId,
      ruleName: x.ruleName,
      trigger: x.trigger as AutomationTrigger,
      status: x.status,
      executedAction: x.executedAction as AutomationActionType,
      actionDetails: x.actionDetails,
      payloadSummary: x.payloadSummary,
      executedAt: x.executedAt.toISOString(),
      durationMs: x.durationMs,
    };
  }

  async findByOrg(organizationId: string): Promise<AutomationRuleEntity[]> {
    const rows = await (this.prisma.tenantClient as any).automationRule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.mapRule(r));
  }

  async findById(organizationId: string, id: string): Promise<AutomationRuleEntity | null> {
    const row = await (this.prisma.tenantClient as any).automationRule.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapRule(row) : null;
  }

  async create(
    data: Omit<
      AutomationRuleEntity,
      'id' | 'executionCount' | 'lastExecutedAt' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<AutomationRuleEntity> {
    const created = await (this.prisma.tenantClient as any).automationRule.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        trigger: data.trigger,
        conditionField: data.conditionField,
        conditionValue: data.conditionValue,
        actionType: data.actionType,
        actionPayload: data.actionPayload ?? {},
        enabled: data.enabled,
      },
    });
    return this.mapRule(created);
  }

  async update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    const updated = await (this.prisma.tenantClient as any).automationRule.update({
      where: { id: rule.id },
      data: {
        name: rule.name,
        trigger: rule.trigger,
        conditionField: rule.conditionField,
        conditionValue: rule.conditionValue,
        actionType: rule.actionType,
        actionPayload: rule.actionPayload ?? {},
        enabled: rule.enabled,
        executionCount: rule.executionCount,
        lastExecutedAt: rule.lastExecutedAt ? new Date(rule.lastExecutedAt) : null,
      },
    });
    return this.mapRule(updated);
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).automationRule.delete({ where: { id } });
    return true;
  }

  async findMatchingRules(organizationId: string, trigger: AutomationTrigger): Promise<AutomationRuleEntity[]> {
    const rows = await (this.prisma.tenantClient as any).automationRule.findMany({
      where: { organizationId, trigger, enabled: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r: any) => this.mapRule(r));
  }

  async createRun(data: Omit<AutomationRunEntity, 'id' | 'executedAt'>): Promise<AutomationRunEntity> {
    const created = await (this.prisma.tenantClient as any).automationRun.create({
      data: {
        organizationId: data.organizationId,
        ruleId: data.ruleId,
        ruleName: data.ruleName,
        trigger: data.trigger,
        status: data.status,
        executedAction: data.executedAction,
        actionDetails: data.actionDetails,
        payloadSummary: data.payloadSummary,
        durationMs: data.durationMs,
      },
    });
    return this.mapRun(created);
  }

  async findRuns(organizationId: string, limit?: number): Promise<AutomationRunEntity[]> {
    const rows = await (this.prisma.tenantClient as any).automationRun.findMany({
      where: { organizationId },
      orderBy: { executedAt: 'desc' },
      take: limit ?? undefined,
    });
    return rows.map((x: any) => this.mapRun(x));
  }
}
