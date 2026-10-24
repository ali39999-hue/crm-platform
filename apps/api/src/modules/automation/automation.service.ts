import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AutomationRuleDto,
  AutomationTrigger,
  CreateAutomationRuleRequest,
} from '@crm/contracts';
import {
  InMemoryAutomationRepository,
  type AutomationRuleEntity,
} from './automation.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private readonly MAX_CHAIN_DEPTH = 3;

  constructor(
    private readonly automationRepo: InMemoryAutomationRepository,
    private readonly auditService: AuditService,
  ) {}

  async getRules(organizationId: string): Promise<AutomationRuleDto[]> {
    const list = await this.automationRepo.findByOrg(organizationId);
    return list.map((r) => this.mapDto(r));
  }

  async createRule(
    organizationId: string,
    dto: CreateAutomationRuleRequest,
    actorId?: string,
  ): Promise<AutomationRuleDto> {
    const rule = await this.automationRepo.create({
      organizationId,
      name: dto.name.trim(),
      trigger: dto.trigger,
      conditionField: dto.conditionField ?? null,
      conditionValue: dto.conditionValue ?? null,
      actionType: dto.actionType,
      actionPayload: dto.actionPayload ?? {},
      enabled: dto.enabled !== false,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'AUTOMATION_RULE_CREATED',
      entityType: 'AutomationRule',
      entityId: rule.id,
      metadata: { name: rule.name, trigger: rule.trigger },
    });

    return this.mapDto(rule);
  }

  async toggleRule(organizationId: string, id: string, enabled: boolean): Promise<AutomationRuleDto> {
    const rule = await this.automationRepo.findById(organizationId, id);
    if (!rule) {
      throw new NotFoundException(`Rule ${id} not found in this organization`);
    }
    rule.enabled = enabled;
    const updated = await this.automationRepo.update(rule);
    return this.mapDto(updated);
  }

  async deleteRule(organizationId: string, id: string): Promise<{ success: boolean }> {
    const success = await this.automationRepo.delete(organizationId, id);
    if (!success) {
      throw new NotFoundException(`Rule ${id} not found`);
    }
    return { success: true };
  }

  /**
   * Dry-run simulation of an automation rule against sample data
   */
  async dryRun(
    organizationId: string,
    id: string,
    testPayload: Record<string, any>,
  ): Promise<{ matched: boolean; wouldExecute: string }> {
    const rule = await this.automationRepo.findById(organizationId, id);
    if (!rule) {
      throw new NotFoundException(`Rule ${id} not found`);
    }

    const matched = this.evaluateCondition(rule, testPayload);
    return {
      matched,
      wouldExecute: matched
        ? `Rule "${rule.name}" matches and would execute action ${rule.actionType}`
        : `Rule condition not met`,
    };
  }

  /**
   * Executes matching rules for a trigger with infinite loop / recursion depth guard
   */
  async processTrigger(
    organizationId: string,
    trigger: AutomationTrigger,
    payload: Record<string, any>,
    depth = 0,
  ): Promise<{ triggeredCount: number }> {
    if (depth > this.MAX_CHAIN_DEPTH) {
      this.logger.warn(
        `Recursion limit exceeded for automation chain (depth: ${depth}). Aborting further execution.`,
      );
      return { triggeredCount: 0 };
    }

    const rules = await this.automationRepo.findMatchingRules(organizationId, trigger);
    let triggeredCount = 0;

    for (const rule of rules) {
      if (this.evaluateCondition(rule, payload)) {
        rule.executionCount += 1;
        rule.lastExecutedAt = new Date().toISOString();
        await this.automationRepo.update(rule);

        this.logger.log(
          `[AUTOMATION] Executing rule "${rule.name}" for trigger ${trigger} on org ${organizationId}`,
        );

        this.auditService.record({
          organizationId,
          action: 'AUTOMATION_EXECUTED',
          entityType: 'AutomationRule',
          entityId: rule.id,
          metadata: { trigger, action: rule.actionType, payload },
        });

        triggeredCount++;
      }
    }

    return { triggeredCount };
  }

  private evaluateCondition(rule: AutomationRuleEntity, payload: Record<string, any>): boolean {
    if (!rule.conditionField || !rule.conditionValue) {
      return true; // No condition means always match
    }
    const val = payload[rule.conditionField];
    return String(val) === String(rule.conditionValue);
  }

  private mapDto(r: AutomationRuleEntity): AutomationRuleDto {
    return {
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      conditionField: r.conditionField,
      conditionValue: r.conditionValue,
      actionType: r.actionType,
      actionPayload: r.actionPayload,
      enabled: r.enabled,
      executionCount: r.executionCount,
      lastExecutedAt: r.lastExecutedAt,
    };
  }
}
