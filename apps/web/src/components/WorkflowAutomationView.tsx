'use client';

import React, { useState, useEffect } from 'react';
import type {
  AutomationActionType,
  AutomationRuleDto,
  AutomationRunDto,
  AutomationTrigger,
  CreateAutomationRuleRequest,
  SimulateAutomationResponse,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface WorkflowAutomationViewProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function WorkflowAutomationView({ onNotify }: WorkflowAutomationViewProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [runs, setRuns] = useState<AutomationRunDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AutomationTrigger>('TASK_CREATED');
  const [conditionField, setConditionField] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState<AutomationActionType>('SEND_NOTIFICATION');
  const [actionMessage, setActionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simulate Modal
  const [simulatingRule, setSimulatingRule] = useState<AutomationRuleDto | null>(null);
  const [testPayloadStr, setTestPayloadStr] = useState('{\n  "priority": "URGENT"\n}');
  const [simResult, setSimResult] = useState<SimulateAutomationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesRes, runsRes] = await Promise.all([
        apiClient.getAutomationRules(),
        apiClient.getAutomationRuns(),
      ]);
      setRules(rulesRes);
      setRuns(runsRes);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری قوانین اتوماسیون', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRule = async (rule: AutomationRuleDto) => {
    try {
      const nextState = !rule.enabled;
      const updated = await apiClient.toggleAutomationRule(rule.id, nextState);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
      onNotify?.(
        `قانون «${rule.name}» ${nextState ? 'فعال شد' : 'غیرفعال گردید (Kill Switch)'}`,
        'success',
      );
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تغییر وضعیت قانون', 'error');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const req: CreateAutomationRuleRequest = {
        name: name.trim(),
        trigger,
        conditionField: conditionField.trim() || undefined,
        conditionValue: conditionValue.trim() || undefined,
        actionType,
        actionPayload: {
          message: actionMessage.trim() || 'اقدام خودکار اجرا شد',
        },
        enabled: true,
      };

      const created = await apiClient.createAutomationRule(req);
      setRules((prev) => [created, ...prev]);
      setIsNewModalOpen(false);
      setName('');
      setConditionField('');
      setConditionValue('');
      setActionMessage('');
      onNotify?.(`قانون اتوماسیون «${created.name}» با موفقیت ایجاد گردید`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت قانون اتوماسیون', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSimulate = (rule: AutomationRuleDto) => {
    setSimulatingRule(rule);
    setSimResult(null);

    // Prepare default test sample based on rule condition
    if (rule.conditionField && rule.conditionValue) {
      setTestPayloadStr(
        JSON.stringify(
          {
            [rule.conditionField]: rule.conditionValue,
            title: 'تست نمونه',
          },
          null,
          2,
        ),
      );
    } else {
      setTestPayloadStr('{\n  "status": "IN_PROGRESS",\n  "title": "رکورد تستی"\n}');
    }
  };

  const handleRunSimulation = async () => {
    if (!simulatingRule) return;

    try {
      setIsSimulating(true);
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(testPayloadStr);
      } catch {
        onNotify?.('فرمت JSON نمونه نامعتبر است', 'error');
        return;
      }

      const res = await apiClient.simulateAutomationRule(simulatingRule.id, payloadObj);
      setSimResult(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در شبیه‌سازی قانون', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const getTriggerLabel = (trig: AutomationTrigger) => {
    switch (trig) {
      case 'TASK_CREATED':
        return 'ایجاد وظیفه جدید';
      case 'TASK_STATUS_CHANGED':
        return 'تغییر وضعیت وظیفه';
      case 'LEAD_CREATED':
        return 'ثبت سرنخ جدید';
      case 'LEAD_CONVERTED':
        return 'تبدیل سرنخ به مشتری';
      case 'TICKET_CREATED':
        return 'ثبت تیکت پشتیبانی جدید';
      default:
        return trig;
    }
  };

  const getActionLabel = (act: AutomationActionType) => {
    switch (act) {
      case 'SEND_NOTIFICATION':
        return '🔔 ارسال اعلان فوری';
      case 'ASSIGN_USER':
        return '👤 ارجاع خودکار به کاربر';
      case 'CHANGE_STATUS':
        return '🔄 به‌روزرسانی وضعیت';
      case 'WEBHOOK_POST':
        return '🌐 فراخوانی وب‌هوک خارجی';
      default:
        return act;
    }
  };

  const totalExecutions = rules.reduce((sum, r) => sum + r.executionCount, 0);

  return (
    <div
      className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6"
      data-testid="workflow-automation-view"
    >
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>⚙️</span>
            <span>موتور اتوماسیون و گردش‌کارها (Automation Rules Engine - AUTO-001)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف تریگرها، شروط، اقدامات خودکار، کلید قطع اضطراری (Kill Switch) و شبیه‌سازی بدون عارضه جانبی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          data-testid="create-rule-btn"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>تعریف قانون اتوماسیون جدید</span>
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">تعداد قوانین تعریف‌شده</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{rules.length} قانون</div>
          <div className="text-[11px] text-slate-500 mt-1">
            فعال: {rules.filter((r) => r.enabled).length}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">دفعات اجرای موفق</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {totalExecutions} مرتبه
          </div>
          <div className="text-[11px] text-slate-500 mt-1">بدون وقفه عملیاتی</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">سقف عمق بازگشتی (Recursion Cap)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">حداکثر ۳ مرحله</div>
          <div className="text-[11px] text-slate-500 mt-1">محافظت ضد لوپ و چرخه‌های بی‌پایان</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">موتور شبیه‌سازی (Dry-run)</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">فعال</div>
          <div className="text-[11px] text-slate-500 mt-1">آزمون شرط پیش از فعال‌سازی</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <nav className="flex border-b border-slate-800 gap-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          data-testid="tab-rules"
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚡</span>
          <span>فهرست قوانین فعال ({rules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          data-testid="tab-history"
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📜</span>
          <span>تاریخچه اجراها و لاگ‌های ممیزی ({runs.length})</span>
        </button>
      </nav>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3" data-testid="automation-rules-list">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">در حال بارگذاری قوانین...</div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              قانونی برای اتوماسیون تعریف نشده است.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                data-testid={`rule-item-${rule.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 transition-colors hover:border-slate-700"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{rule.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.enabled
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {rule.enabled ? 'فعال' : 'قطع اضطراری (Kill-Switch)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-300">محرک:</strong>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[11px]">
                        {getTriggerLabel(rule.trigger)}
                      </span>
                    </span>

                    <span>•</span>

                    <span>
                      <strong className="text-slate-300">شرط:</strong>{' '}
                      {rule.conditionField ? (
                        <span className="font-mono text-[11px] text-amber-300">
                          {rule.conditionField} == {rule.conditionValue}
                        </span>
                      ) : (
                        'بدون شرط (همیشه)'
                      )}
                    </span>

                    <span>•</span>

                    <span>
                      <strong className="text-slate-300">اقدام:</strong>{' '}
                      <span className="text-slate-200">{getActionLabel(rule.actionType)}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    تعداد اجرا: {rule.executionCount} مرتبه{' '}
                    {rule.lastExecutedAt &&
                      `• آخرین اجرا: ${new Date(rule.lastExecutedAt).toLocaleDateString('fa-IR')}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenSimulate(rule)}
                    data-testid={`simulate-btn-${rule.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>🧪</span>
                    <span>شبیه‌سازی (Dry-run)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRule(rule)}
                    data-testid={`toggle-btn-${rule.id}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      rule.enabled
                        ? 'bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300'
                        : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                    }`}
                  >
                    {rule.enabled ? 'توقف اضطراری' : 'فعال‌سازی مجدد'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Execution History Tab */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <table className="w-full text-right text-xs divide-y divide-slate-800">
            <thead className="bg-slate-800/70 text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">نام قانون</th>
                <th className="px-4 py-3">رویداد محرک</th>
                <th className="px-4 py-3">وضعیت اجرا</th>
                <th className="px-4 py-3">اقدام اجراشده</th>
                <th className="px-4 py-3">خلاصه ورودی</th>
                <th className="px-4 py-3">مدت زمان</th>
                <th className="px-4 py-3">زمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60" data-testid="runs-tbody">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-200">{run.ruleName}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{run.trigger}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      موفقیت‌آمیز
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{getActionLabel(run.executedAction)}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                    {run.payloadSummary}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{run.durationMs}ms</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(run.executedAt).toLocaleTimeString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Rule Modal */}
      {isNewModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-rule-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">تعریف قانون اتوماسیون جدید</h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نام قانون *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: تخصیص سرنخ‌های وب‌سایت به کارشناس ارشد فروش"
                  data-testid="rule-name-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  رویداد محرک (Trigger) *
                </label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
                  data-testid="rule-trigger-select"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TASK_CREATED">ایجاد وظیفه جدید (TASK_CREATED)</option>
                  <option value="TASK_STATUS_CHANGED">تغییر وضعیت وظیفه (TASK_STATUS_CHANGED)</option>
                  <option value="LEAD_CREATED">ثبت سرنخ جدید (LEAD_CREATED)</option>
                  <option value="LEAD_CONVERTED">تبدیل سرنخ به مشتری (LEAD_CONVERTED)</option>
                  <option value="TICKET_CREATED">ثبت تیکت پشتیبانی جدید (TICKET_CREATED)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">نام فیلد شرط</label>
                  <input
                    type="text"
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    placeholder="مثال: priority یا status"
                    data-testid="rule-cond-field-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">مقدار شرط</label>
                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="مثال: URGENT"
                    data-testid="rule-cond-val-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">اقدام (Action) *</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as AutomationActionType)}
                  data-testid="rule-action-select"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SEND_NOTIFICATION">ارسال اعلان سیستمی (SEND_NOTIFICATION)</option>
                  <option value="ASSIGN_USER">ارجاع خودکار به کاربر (ASSIGN_USER)</option>
                  <option value="CHANGE_STATUS">تغییر وضعیت خودکار (CHANGE_STATUS)</option>
                  <option value="WEBHOOK_POST">ارسال وب‌هوک ایمن (WEBHOOK_POST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  پیام یا جزییات اقدام
                </label>
                <input
                  type="text"
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="پیام یا عنوان کار قابل اجرا..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-rule-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'ذخیره و فعال‌سازی قانون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {simulatingRule && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="simulate-rule-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>🧪</span>
                <span>شبیه‌سازی قانون «{simulatingRule.name}»</span>
              </h3>
              <button
                type="button"
                onClick={() => setSimulatingRule(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              داده‌های تستی را به فرمت JSON وارد کنید تا موتور ارزیابی بدون ایجاد هیچ عارضه یا تغییر
              داده، شرط و نتیجه را بررسی کند.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">ورودی نمونه (JSON)</label>
              <textarea
                rows={5}
                value={testPayloadStr}
                onChange={(e) => setTestPayloadStr(e.target.value)}
                data-testid="simulate-payload-textarea"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {simResult && (
              <div
                data-testid="simulate-result-banner"
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  simResult.matched
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-800 text-rose-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>{simResult.matched ? '✓' : '✕'}</span>
                  <span>{simResult.matched ? 'شرط برقرار است' : 'شرط برقرار نیست'}</span>
                </div>
                <div>{simResult.wouldExecute}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSimulatingRule(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
              >
                بستن
              </button>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                data-testid="run-simulate-btn"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow flex items-center gap-1.5"
              >
                {isSimulating ? 'در حال شبیه‌سازی...' : 'اجرای آزمایشی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowAutomationView;
