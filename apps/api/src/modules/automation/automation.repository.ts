import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AutomationActionType, AutomationRuleDto, AutomationTrigger } from '@crm/contracts';

export type AutomationRuleEntity = {
  id: string;
  organizationId: string;
  name: string;
  trigger: AutomationTrigger;
  conditionField: string | null;
  conditionValue: string | null;
  actionType: AutomationActionType;
  actionPayload: Record<string, any>;
  enabled: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AutomationRunEntity = {
  id: string;
  organizationId: string;
  ruleId: string;
  ruleName: string;
  trigger: AutomationTrigger;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  executedAction: AutomationActionType;
  actionDetails: string;
  payloadSummary: string;
  executedAt: string;
  durationMs: number;
};

export interface IAutomationRepository {
  findByOrg(organizationId: string): Promise<AutomationRuleEntity[]>;
  findById(organizationId: string, id: string): Promise<AutomationRuleEntity | null>;
  create(data: Omit<AutomationRuleEntity, 'id' | 'executionCount' | 'lastExecutedAt' | 'createdAt' | 'updatedAt'>): Promise<AutomationRuleEntity>;
  update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity>;
  delete(organizationId: string, id: string): Promise<boolean>;
  findMatchingRules(organizationId: string, trigger: AutomationTrigger): Promise<AutomationRuleEntity[]>;

  // Run history
  createRun(data: Omit<AutomationRunEntity, 'id' | 'executedAt'>): Promise<AutomationRunEntity>;
  findRuns(organizationId: string, limit?: number): Promise<AutomationRunEntity[]>;
}

@Injectable()
export class InMemoryAutomationRepository implements IAutomationRepository {
  private rules: Map<string, AutomationRuleEntity> = new Map();
  private runs: AutomationRunEntity[] = [];

  constructor() {
    this.seedDefaultRules();
    this.seedDefaultRuns();
  }

  private seedDefaultRules() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const rule1: AutomationRuleEntity = {
      id: '88000000-0000-0000-0000-000000000001',
      organizationId: orgAlpha,
      name: 'اطلاع‌رسانی خودکار برای وظایف با اولویت فوری',
      trigger: 'TASK_CREATED',
      conditionField: 'priority',
      conditionValue: 'URGENT',
      actionType: 'SEND_NOTIFICATION',
      actionPayload: { title: 'وظیفه فوری جدید', message: 'یک وظیفه با اولویت فوری ایجاد شد.' },
      enabled: true,
      executionCount: 2,
      lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    };
    const rule2: AutomationRuleEntity = {
      id: '88000000-0000-0000-0000-000000000002',
      organizationId: orgAlpha,
      name: 'ایجاد تسک پیگیری پس از تبدیل موفق سرنخ به مشتری',
      trigger: 'LEAD_CONVERTED',
      conditionField: null,
      conditionValue: null,
      actionType: 'ASSIGN_USER',
      actionPayload: { title: 'جلسه آشنایی و تحویل قرارداد مشتری جدید' },
      enabled: true,
      executionCount: 1,
      lastExecutedAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    };
    this.rules.set(rule1.id, rule1);
    this.rules.set(rule2.id, rule2);
  }

  private seedDefaultRuns() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    this.runs.push(
      {
        id: 'run-001',
        organizationId: orgAlpha,
        ruleId: '88000000-0000-0000-0000-000000000001',
        ruleName: 'اطلاع‌رسانی خودکار برای وظایف با اولویت فوری',
        trigger: 'TASK_CREATED',
        status: 'SUCCESS',
        executedAction: 'SEND_NOTIFICATION',
        actionDetails: 'ارسال اعلان فوری به مدیر سیستم و کارشناس عملیات',
        payloadSummary: 'Task: TSK-1004 (priority: URGENT)',
        executedAt: new Date(Date.now() - 3600000).toISOString(),
        durationMs: 42,
      },
      {
        id: 'run-002',
        organizationId: orgAlpha,
        ruleId: '88000000-0000-0000-0000-000000000002',
        ruleName: 'ایجاد تسک پیگیری پس از تبدیل موفق سرنخ به مشتری',
        trigger: 'LEAD_CONVERTED',
        status: 'SUCCESS',
        executedAction: 'ASSIGN_USER',
        actionDetails: 'تخصیص تسک پذیرش به تیم فروش سازمانی',
        payloadSummary: 'Lead: پتروشیمی سپهر (CONVERTED)',
        executedAt: new Date(Date.now() - 7200000).toISOString(),
        durationMs: 65,
      },
    );
  }

  async findByOrg(organizationId: string): Promise<AutomationRuleEntity[]> {
    return Array.from(this.rules.values()).filter((r) => r.organizationId === organizationId);
  }

  async findById(organizationId: string, id: string): Promise<AutomationRuleEntity | null> {
    const rule = this.rules.get(id);
    if (!rule || rule.organizationId !== organizationId) return null;
    return rule;
  }

  async create(data: Omit<AutomationRuleEntity, 'id' | 'executionCount' | 'lastExecutedAt' | 'createdAt' | 'updatedAt'>): Promise<AutomationRuleEntity> {
    const id = randomUUID();
    const entity: AutomationRuleEntity = {
      ...data,
      id,
      executionCount: 0,
      lastExecutedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.rules.set(id, entity);
    return entity;
  }

  async update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    const updated = { ...rule, updatedAt: new Date().toISOString() };
    this.rules.set(rule.id, updated);
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rule = await this.findById(organizationId, id);
    if (!rule) return false;
    this.rules.delete(id);
    return true;
  }

  async findMatchingRules(organizationId: string, trigger: AutomationTrigger): Promise<AutomationRuleEntity[]> {
    return Array.from(this.rules.values()).filter(
      (r) => r.organizationId === organizationId && r.trigger === trigger && r.enabled,
    );
  }

  /* Run History */

  async createRun(data: Omit<AutomationRunEntity, 'id' | 'executedAt'>): Promise<AutomationRunEntity> {
    const entity: AutomationRunEntity = {
      ...data,
      id: randomUUID(),
      executedAt: new Date().toISOString(),
    };
    this.runs.unshift(entity);
    return entity;
  }

  async findRuns(organizationId: string, limit = 50): Promise<AutomationRunEntity[]> {
    return this.runs
      .filter((r) => r.organizationId === organizationId)
      .slice(0, limit);
  }
}
