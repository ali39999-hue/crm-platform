import { describe, expect, it, beforeEach } from 'vitest';
import { AutomationService } from './automation.service.js';
import { InMemoryAutomationRepository } from './automation.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Automation Rules Engine (AUTO-001 & R-070)', () => {
  let automationService: AutomationService;
  let automationRepo: InMemoryAutomationRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const userAlpha = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    automationRepo = new InMemoryAutomationRepository();
    auditService = new AuditService();
    automationService = new AutomationService(automationRepo, auditService);
  });

  it('lists rules for organization without leaking other org rules', async () => {
    const rulesAlpha = await automationService.getRules(orgAlpha);
    expect(rulesAlpha.length).toBeGreaterThan(0);

    const rulesBeta = await automationService.getRules(orgBeta);
    expect(rulesBeta.length).toBe(0);
  });

  it('creates an automation rule with audit event', async () => {
    const created = await automationService.createRule(
      orgAlpha,
      {
        name: 'ارسال ایمیل خوش‌آمد به لید جدید',
        trigger: 'LEAD_CREATED',
        actionType: 'SEND_NOTIFICATION',
        actionPayload: { channel: 'EMAIL', template: 'WELCOME' },
      },
      userAlpha,
    );

    expect(created.id).toBeDefined();
    expect(created.name).toBe('ارسال ایمیل خوش‌آمد به لید جدید');

    const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'AUTOMATION_RULE_CREATED');
    expect(audit).toBeDefined();
    expect(audit?.actorId).toBe(userAlpha);
  });

  it('kill-switch toggle enables or disables rule', async () => {
    const rules = await automationService.getRules(orgAlpha);
    const ruleId = rules[0]!.id;

    const disabled = await automationService.toggleRule(orgAlpha, ruleId, false);
    expect(disabled.enabled).toBe(false);

    // When disabled, trigger should not execute it
    const res = await automationService.processTrigger(orgAlpha, 'TASK_CREATED', { priority: 'URGENT' });
    expect(res.triggeredCount).toBe(0);

    // Re-enable
    const reEnabled = await automationService.toggleRule(orgAlpha, ruleId, true);
    expect(reEnabled.enabled).toBe(true);

    const res2 = await automationService.processTrigger(orgAlpha, 'TASK_CREATED', { priority: 'URGENT' });
    expect(res2.triggeredCount).toBe(1);
  });

  it('performs dry-run without executing actions or incrementing counter', async () => {
    const rules = await automationService.getRules(orgAlpha);
    const ruleId = rules[0]!.id;

    const matchDry = await automationService.dryRun(orgAlpha, ruleId, { priority: 'URGENT' });
    expect(matchDry.matched).toBe(true);

    const noMatchDry = await automationService.dryRun(orgAlpha, ruleId, { priority: 'LOW' });
    expect(noMatchDry.matched).toBe(false);

    const afterRule = (await automationService.getRules(orgAlpha))[0]!;
    expect(afterRule.executionCount).toBe(2); // Initial seed count was 2, unchanged
  });

  it('simulates rule with detailed condition and payload evaluation', async () => {
    const rules = await automationService.getRules(orgAlpha);
    const ruleId = rules[0]!.id;

    const simPass = await automationService.simulateRule(orgAlpha, ruleId, { priority: 'URGENT' });
    expect(simPass.matched).toBe(true);
    expect(simPass.wouldExecute).toContain('مطابقت دارد');
    expect(simPass.details.conditionField).toBe('priority');

    const simFail = await automationService.simulateRule(orgAlpha, ruleId, { priority: 'NORMAL' });
    expect(simFail.matched).toBe(false);
    expect(simFail.wouldExecute).toContain('شرط قانون برقرار نیست');
  });

  it('records execution run history and prevents runaway recursion', async () => {
    const initialRuns = await automationService.getRuns(orgAlpha);
    expect(initialRuns.length).toBeGreaterThanOrEqual(2);

    await automationService.processTrigger(orgAlpha, 'TASK_CREATED', { priority: 'URGENT' });

    const newRuns = await automationService.getRuns(orgAlpha);
    expect(newRuns.length).toBe(initialRuns.length + 1);
    expect(newRuns[0]?.status).toBe('SUCCESS');
    expect(newRuns[0]?.executedAction).toBe('SEND_NOTIFICATION');

    // Recursion limit check
    const res = await automationService.processTrigger(
      orgAlpha,
      'TASK_CREATED',
      { priority: 'URGENT' },
      10, // depth > 3
    );
    expect(res.triggeredCount).toBe(0);
  });
});
