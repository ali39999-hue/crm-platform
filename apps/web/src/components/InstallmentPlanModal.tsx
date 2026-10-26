'use client';

import React, { useState, useEffect } from 'react';
import type { CheckItemDto, CheckStatus, DealDto, InstallmentPlanDto } from '@crm/contracts';
import { calculateInstallmentPlan, isCheckDueSoon, validateSayadiNumber } from '@crm/domain';
import { apiClient } from '../lib/api-client';

interface InstallmentPlanModalProps {
  deal: DealDto;
  onClose: () => void;
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

const IRANIAN_BANKS = [
  'بانک ملت',
  'بانک ملی',
  'بانک پاسارگاد',
  'بانک تجارت',
  'بانک صادرات',
  'بانک سامان',
  'بانک پارسیان',
  'بانک سپه',
  'بانک آینده',
];

export function InstallmentPlanModal({
  deal,
  onClose,
  onNotify,
}: InstallmentPlanModalProps) {
  const [existingPlan, setExistingPlan] = useState<InstallmentPlanDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for creating plan
  const [downPaymentMinor, setDownPaymentMinor] = useState(
    Math.round((deal.amountMinor || 100000000) * 0.2),
  );
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [checks, setChecks] = useState<
    Array<{
      checkNumber: string;
      sayadiNumber: string;
      bankName: string;
      branchName: string;
      amountMinor: number;
      dueDate: string;
      status: CheckStatus;
      drawerName: string;
    }>
  >([]);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const plan = await apiClient.getInstallmentPlan(deal.id);
        setExistingPlan(plan);
      } catch {
        // No existing plan, prepare default split
        handleAutoSplit(
          Math.round((deal.amountMinor || 100000000) * 0.2),
          installmentsCount,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [deal.id]);

  const handleAutoSplit = (downPayment: number, count: number) => {
    const total = deal.amountMinor || 100000000;
    const split = calculateInstallmentPlan(total, downPayment, count);

    const generatedChecks = split.map((it, idx) => {
      const monthOffset = idx + 1;
      const dueDate = new Date(Date.now() + 86400000 * 30 * monthOffset)
        .toISOString()
        .split('T')[0];
      return {
        checkNumber: `CHK-${1000 + idx + 1}`,
        sayadiNumber: '1234567890123456', // Valid placeholder
        bankName: IRANIAN_BANKS[idx % IRANIAN_BANKS.length]!,
        branchName: 'شعبه مرکزی',
        amountMinor: it.amountMinor,
        dueDate: dueDate!,
        status: 'PENDING' as CheckStatus,
        drawerName: deal.name,
      };
    });
    setChecks(generatedChecks);
  };

  const handleUpdateCheck = (index: number, field: string, value: any) => {
    setChecks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  };

  const handleSavePlan = async () => {
    // Validate Sayadi numbers
    for (const c of checks) {
      if (!validateSayadiNumber(c.sayadiNumber)) {
        onNotify?.(
          `شناسه صیادی چک شماره ${c.checkNumber} نامعتبر است (باید دقیقاً ۱۶ رقم عددی باشد).`,
          'error',
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const plan = await apiClient.createInstallmentPlan(deal.id, {
        dealId: deal.id,
        downPaymentMinor,
        installmentsCount: checks.length,
        checks,
      });
      setExistingPlan(plan);
      onNotify?.('طرح فروش اقساطی و چک‌های صیادی با موفقیت ثبت شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت طرح اقساطی', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (checkId: string, newStatus: CheckStatus) => {
    try {
      const updated = await apiClient.updateCheckStatus(checkId, newStatus);
      if (existingPlan) {
        setExistingPlan({
          ...existingPlan,
          checks: existingPlan.checks.map((c) => (c.id === checkId ? updated : c)),
        });
      }
      onNotify?.(`وضعیت چک به «${getStatusLabel(newStatus)}» تغییر یافت`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تغییر وضعیت چک', 'error');
    }
  };

  const handleSendReminder = async (checkId: string) => {
    try {
      const res = await apiClient.sendCheckReminder(checkId);
      if (existingPlan) {
        setExistingPlan({
          ...existingPlan,
          checks: existingPlan.checks.map((c) =>
            c.id === checkId ? { ...c, reminderSent: true } : c,
          ),
        });
      }
      onNotify?.(res.message, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ارسال پیامک یادآوری', 'error');
    }
  };

  const getStatusLabel = (s: CheckStatus) => {
    switch (s) {
      case 'CLEARED':
        return 'وصول شده';
      case 'BOUNCED':
        return 'برگشت خورده';
      case 'PENDING':
      default:
        return 'در انتظار وصول';
    }
  };

  const formatRials = (minor: number) => {
    return (minor / 1000000).toLocaleString('fa-IR') + ' م.ر';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                مدیریت فروش اقساطی و چک‌های صیادی بنفش (Didar Installments)
              </h4>
              <p className="text-[11px] text-slate-400">
                قرارداد: {deal.name} | مبلغ کل معامله: {formatRials(deal.amountMinor || 0)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            در حال دریافت اطلاعات اقساط و چک‌ها...
          </div>
        ) : existingPlan ? (
          /* View Mode: Existing Registered Plan */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-slate-400">پیش‌پرداخت نقدی:</span>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {formatRials(existingPlan.downPaymentMinor)}
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-slate-400">مجموع اقساط (چک‌ها):</span>
                <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
                  {formatRials(existingPlan.totalAmountMinor - existingPlan.downPaymentMinor)}
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-slate-400">تعداد فقره چک:</span>
                <div className="text-base font-bold text-sky-400 font-mono mt-0.5">
                  {existingPlan.checks.length} فقره چک
                </div>
              </div>
            </div>

            {/* Checks Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300">لیست چک‌های ثبت‌شده صیادی:</h5>
              {existingPlan.checks.map((chk) => {
                const isDueSoon = isCheckDueSoon(chk.dueDate, 3);
                return (
                  <div
                    key={chk.id}
                    className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                      chk.status === 'CLEARED'
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : chk.status === 'BOUNCED'
                          ? 'bg-rose-950/30 border-rose-800'
                          : isDueSoon
                            ? 'bg-amber-950/30 border-amber-600/70'
                            : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{chk.bankName}</span>
                        <span className="text-slate-400 font-mono">شماره: {chk.checkNumber}</span>
                        {isDueSoon && chk.status === 'PENDING' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ⚠️ سررسید نزدیک (۳ روز)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>شناسه صیاد:</span>
                        <span className="font-mono text-slate-300 dir-ltr">{chk.sayadiNumber}</span>
                        <span>|</span>
                        <span>تاریخ سررسید: {new Date(chk.dueDate).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono text-emerald-400 text-sm">
                        {formatRials(chk.amountMinor)}
                      </span>

                      {/* Status Selector */}
                      <select
                        value={chk.status}
                        onChange={(e) => handleStatusChange(chk.id, e.target.value as CheckStatus)}
                        className={`text-[10px] px-2 py-1 rounded font-bold border focus:outline-none ${
                          chk.status === 'CLEARED'
                            ? 'bg-emerald-900 border-emerald-600 text-emerald-200'
                            : chk.status === 'BOUNCED'
                              ? 'bg-rose-900 border-rose-600 text-rose-200'
                              : 'bg-slate-800 border-slate-600 text-amber-300'
                        }`}
                      >
                        <option value="PENDING">در انتظار وصول</option>
                        <option value="CLEARED">وصول شد ✓</option>
                        <option value="BOUNCED">برگشت خورده ✕</option>
                      </select>

                      {/* Send SMS Reminder Button */}
                      {chk.status === 'PENDING' && (
                        <button
                          onClick={() => handleSendReminder(chk.id)}
                          disabled={chk.reminderSent}
                          className="px-2.5 py-1 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded text-[10px] disabled:opacity-40"
                          title="ارسال پیامک یادآوری به صاحب چک"
                        >
                          {chk.reminderSent ? 'پیامک ارسال شد ✓' : '📱 ارسال یادآوری'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Form Mode: Create New Plan */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">پیش‌پرداخت نقدی (ریال):</label>
                <input
                  type="number"
                  value={downPaymentMinor}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDownPaymentMinor(val);
                    handleAutoSplit(val, installmentsCount);
                  }}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">تعداد ماه‌های قسط (چک‌ها):</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={installmentsCount}
                  onChange={(e) => {
                    const cnt = Math.max(1, parseInt(e.target.value) || 1);
                    setInstallmentsCount(cnt);
                    handleAutoSplit(downPaymentMinor, cnt);
                  }}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                />
              </div>
            </div>

            {/* Checks List Form */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300">
                مشخصات چک‌های صیادی بنفش (تولید خودکار بر مبنای تقسیم اقساط):
              </h5>
              {checks.map((c, idx) => {
                const isSayadiValid = validateSayadiNumber(c.sayadiNumber);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-2 text-xs items-center"
                  >
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">شماره چک:</label>
                      <input
                        type="text"
                        value={c.checkNumber}
                        onChange={(e) => handleUpdateCheck(idx, 'checkNumber', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        شناسه ۱۶ رقمی صیادی:
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={c.sayadiNumber}
                        onChange={(e) => handleUpdateCheck(idx, 'sayadiNumber', e.target.value)}
                        className={`w-full p-1.5 bg-slate-900 border rounded text-slate-200 text-xs font-mono dir-ltr ${
                          isSayadiValid ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5">نام بانک:</label>
                      <select
                        value={c.bankName}
                        onChange={(e) => handleUpdateCheck(idx, 'bankName', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                      >
                        {IRANIAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">سررسید:</label>
                      <input
                        type="date"
                        value={c.dueDate}
                        onChange={(e) => handleUpdateCheck(idx, 'dueDate', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">مبلغ (ریال):</label>
                      <input
                        type="number"
                        value={c.amountMinor}
                        onChange={(e) =>
                          handleUpdateCheck(idx, 'amountMinor', parseInt(e.target.value) || 0)
                        }
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs"
          >
            بستن
          </button>
          {!existingPlan && (
            <button
              onClick={handleSavePlan}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg"
            >
              ثبت نهایی طرح فروش اقساطی
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstallmentPlanModal;
