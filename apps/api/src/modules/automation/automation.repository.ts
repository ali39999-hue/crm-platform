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

export interface IAutomationRepository {
  findByOrg(organizationId: string): Promise<AutomationRuleEntity[]>;
  findById(organizationId: string, id: string): Promise<AutomationRuleEntity | null>;
  create(data: Omit<AutomationRuleEntity, 'id' | 'executionCount' | 'lastExecutedAt' | 'createdAt' | 'updatedAt'>): Promise<AutomationRuleEntity>;
  update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity>;
  delete(organizationId: string, id: string): Promise<boolean>;
  findMatchingRules(organizationId: string, trigger: AutomationTrigger): Promise<AutomationRuleEntity[]>;
}

@Injectable()
export class InMemoryAutomationRepository implements IAutomationRepository {
  private rules: Map<string, AutomationRuleEntity> = new Map();

  constructor() {
    this.seedDefaultRules();
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
      executionCount: 0,
      lastExecutedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.rules.set(rule1.id, rule1);
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
}
