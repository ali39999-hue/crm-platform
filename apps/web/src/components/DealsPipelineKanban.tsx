'use client';

import React, { useState, useEffect } from 'react';
import type {
  DealDto,
  DealLossReasonType,
  DealProductItemDto,
  PipelineStageDto,
  ProductCatalogItemDto,
  SalesLossAnalyticsDto,
  SalesTargetDto,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface DealsPipelineKanbanProps {
  initialDeals?: DealDto[];
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  onSelectDeal?: (deal: DealDto) => void;
}

const LOSS_REASONS: Array<{ value: DealLossReasonType; label: string }> = [
  { value: 'PRICE_TOO_HIGH', label: 'قیمت بالاتر از بودجه مشتری' },
  { value: 'COMPETITOR_WON', label: 'خرید از رقیب تجاری' },
  { value: 'FEATURE_GAP', label: 'کسری قابلیت یا عدم تطابق فنی' },
  { value: 'BUDGET_CANCELED', label: 'لغو پروژه یا کسری بودجه مشتری' },
  { value: 'CLIENT_UNRESPONSIVE', label: 'عدم پاسخگویی و رهاسازی پیگیری' },
  { value: 'OTHER', label: 'سایر دلایل' },
];

export function DealsPipelineKanban({
  initialDeals,
  onNotify,
  onSelectDeal,
}: DealsPipelineKanbanProps) {
  const [stages, setStages] = useState<PipelineStageDto[]>([]);
  const [deals, setDeals] = useState<DealDto[]>(initialDeals || []);
  const [loading, setLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  // Didar CRM filters & analytics state
  const [filterOnlyRotting, setFilterOnlyRotting] = useState(false);
  const [salesTarget, setSalesTarget] = useState<SalesTargetDto | null>(null);
  const [lossAnalytics, setLossAnalytics] = useState<SalesLossAnalyticsDto | null>(null);
  const [productsCatalog, setProductsCatalog] = useState<ProductCatalogItemDto[]>([]);

  // Modals state
  const [lostModalDeal, setLostModalDeal] = useState<DealDto | null>(null);
  const [selectedLossReason, setSelectedLossReason] = useState<DealLossReasonType>('PRICE_TOO_HIGH');
  const [lossDescription, setLossDescription] = useState('');

  const [nextActionModalDeal, setNextActionModalDeal] = useState<DealDto | null>(null);
  const [nextActionTitle, setNextActionTitle] = useState('');
  const [nextActionDueDate, setNextActionDueDate] = useState('');

  const [invoiceModalDeal, setInvoiceModalDeal] = useState<DealDto | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPriceMinor: number;
      discountPercent: number;
      taxRatePercent: number;
    }>
  >([]);

  const [showLossAnalyticsModal, setShowLossAnalyticsModal] = useState(false);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const [stagesRes, dealsRes, targetRes, productsRes] = await Promise.all([
        apiClient.getPipelineStages(),
        initialDeals ? Promise.resolve(initialDeals) : apiClient.getDeals(),
        apiClient.getSalesTarget().catch(() => null),
        apiClient.getProducts().catch(() => []),
      ]);
      setStages(stagesRes.sort((a, b) => a.order - b.order));
      setDeals(dealsRes);
      if (targetRes) setSalesTarget(targetRes);
      setProductsCatalog(productsRes);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری خطوط فروش', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, []);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    setDraggedDealId(null);
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStageKey) return;

    if (targetStageKey === 'LOST') {
      // Trigger mandatory loss reason flow
      setLostModalDeal(deal);
      return;
    }

    await executeStageTransition(dealId, targetStageKey);
  };

  const executeStageTransition = async (dealId: string, targetStageKey: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    if (targetStageKey === 'LOST') {
      setLostModalDeal(deal);
      return;
    }

    try {
      const updated = await apiClient.updateDeal(dealId, { stage: targetStageKey });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
      onNotify?.(
        `معامله «${deal.name}» به مرحله ${getStageTitle(targetStageKey)} منتقل شد`,
        'success',
      );
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در انتقال مرحله معامله', 'error');
    }
  };

  // Submit deal as Lost with mandatory reason
  const handleConfirmMarkLost = async () => {
    if (!lostModalDeal) return;
    try {
      const updated = await apiClient.markDealLost(lostModalDeal.id, {
        lossReason: selectedLossReason,
        lossDescription: lossDescription.trim() || undefined,
      });
      setDeals((prev) => prev.map((d) => (d.id === lostModalDeal.id ? updated : d)));
      onNotify?.(`معامله «${lostModalDeal.name}» به عنوان ناموفق ثبت شد`, 'success');
      setLostModalDeal(null);
      setLossDescription('');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت دلیل شکست معامله', 'error');
    }
  };

  // Submit next action
  const handleConfirmNextAction = async () => {
    if (!nextActionModalDeal || !nextActionTitle.trim()) return;
    try {
      const due = nextActionDueDate
        ? new Date(nextActionDueDate).toISOString()
        : new Date(Date.now() + 86400000 * 2).toISOString();
      const updated = await apiClient.scheduleDealNextAction(nextActionModalDeal.id, {
        title: nextActionTitle.trim(),
        dueAt: due,
      });
      setDeals((prev) => prev.map((d) => (d.id === nextActionModalDeal.id ? updated : d)));
      onNotify?.(`فعالیت بعدی برای «${nextActionModalDeal.name}» ثبت شد`, 'success');
      setNextActionModalDeal(null);
      setNextActionTitle('');
      setNextActionDueDate('');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت فعالیت بعدی', 'error');
    }
  };

  // Open invoice generator
  const openInvoiceModal = (deal: DealDto) => {
    setInvoiceModalDeal(deal);
    if (productsCatalog.length > 0 && productsCatalog[0]) {
      const defaultProd = productsCatalog[0];
      setInvoiceItems([
        {
          productId: defaultProd.id,
          productName: defaultProd.name,
          quantity: 1,
          unitPriceMinor: defaultProd.unitPriceMinor,
          discountPercent: 0,
          taxRatePercent: defaultProd.taxRatePercent || 10,
        },
      ]);
    } else {
      setInvoiceItems([
        {
          productId: 'custom-1',
          productName: 'خدمات و لایسنس نرم‌افزار سازمانی',
          quantity: 1,
          unitPriceMinor: deal.amountMinor || 100000000,
          discountPercent: 0,
          taxRatePercent: 10,
        },
      ]);
    }
  };

  const handleAddInvoiceItem = () => {
    if (productsCatalog.length > 0 && productsCatalog[0]) {
      const defaultProd = productsCatalog[0];
      setInvoiceItems((prev) => [
        ...prev,
        {
          productId: defaultProd.id,
          productName: defaultProd.name,
          quantity: 1,
          unitPriceMinor: defaultProd.unitPriceMinor,
          discountPercent: 0,
          taxRatePercent: defaultProd.taxRatePercent || 10,
        },
      ]);
    } else {
      setInvoiceItems((prev) => [
        ...prev,
        {
          productId: `item-${Date.now()}`,
          productName: 'آیتم جدید پیش‌فاکتور',
          quantity: 1,
          unitPriceMinor: 50000000,
          discountPercent: 0,
          taxRatePercent: 10,
        },
      ]);
    }
  };

  const handleUpdateInvoiceItem = (index: number, field: string, val: any) => {
    setInvoiceItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };
      if (field === 'productId') {
        const prod = productsCatalog.find((p) => p.id === val);
        if (prod) {
          item.productName = prod.name;
          item.unitPriceMinor = prod.unitPriceMinor;
          item.taxRatePercent = prod.taxRatePercent || 10;
        }
      }
      next[index] = item as any;
      return next;
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit invoice
  const handleConfirmCreateInvoice = async () => {
    if (!invoiceModalDeal || invoiceItems.length === 0) return;
    try {
      const itemsPayload: DealProductItemDto[] = invoiceItems.map((it) => {
        const raw = it.quantity * it.unitPriceMinor;
        const disc = Math.round((raw * (it.discountPercent || 0)) / 100);
        const taxable = raw - disc;
        const tax = Math.round((taxable * (it.taxRatePercent ?? 10)) / 100);
        return {
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPriceMinor: it.unitPriceMinor,
          discountPercent: it.discountPercent,
          taxRatePercent: it.taxRatePercent,
          totalPriceMinor: taxable + tax,
        };
      });

      const inv = await apiClient.createDealInvoice(invoiceModalDeal.id, {
        dealId: invoiceModalDeal.id,
        items: itemsPayload,
      });

      // Update deal in state
      setDeals((prev) =>
        prev.map((d) =>
          d.id === invoiceModalDeal.id
            ? { ...d, amountMinor: inv.finalTotalMinor, products: itemsPayload }
            : d,
        ),
      );

      onNotify?.(
        `پیش‌فاکتور ${inv.invoiceNumber} به مبلغ ${(inv.finalTotalMinor / 1000000).toLocaleString('fa-IR')} م.ر صادر شد`,
        'success',
      );
      setInvoiceModalDeal(null);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در صدور پیش‌فاکتور', 'error');
    }
  };

  // Open loss analytics
  const openLossAnalytics = async () => {
    try {
      const analytics = await apiClient.getSalesLossAnalytics();
      setLossAnalytics(analytics);
      setShowLossAnalyticsModal(true);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری تحلیل شکست‌ها', 'error');
    }
  };

  const getStageTitle = (key: string) => {
    return stages.find((s) => s.key === key)?.name || key;
  };

  const formatRials = (minor?: number | null) => {
    if (minor === undefined || minor === null) return 'نامشخص';
    return (minor / 1000000).toLocaleString('fa-IR') + ' م.ر';
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        در حال بارگذاری بردهای خط لوله فروش...
      </div>
    );
  }

  const displayedDeals = filterOnlyRotting
    ? deals.filter((d) => d.isRotting || (d.daysInCurrentStage && d.daysInCurrentStage >= 14))
    : deals;

  const totalPipelineSum = displayedDeals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);
  const rottingDealsCount = deals.filter(
    (d) => d.isRotting || (d.daysInCurrentStage && d.daysInCurrentStage >= 14),
  ).length;

  // Invoice live totals
  const invoiceSubtotal = invoiceItems.reduce(
    (s, it) => s + it.quantity * it.unitPriceMinor,
    0,
  );
  const invoiceDiscount = invoiceItems.reduce(
    (s, it) => s + Math.round((it.quantity * it.unitPriceMinor * (it.discountPercent || 0)) / 100),
    0,
  );
  const invoiceTax = invoiceItems.reduce((s, it) => {
    const raw = it.quantity * it.unitPriceMinor;
    const disc = Math.round((raw * (it.discountPercent || 0)) / 100);
    return s + Math.round(((raw - disc) * (it.taxRatePercent ?? 10)) / 100);
  }, 0);
  const invoiceFinal = invoiceSubtotal - invoiceDiscount + invoiceTax;

  return (
    <div className="space-y-4" data-testid="deals-pipeline-kanban">
      {/* Top Pipeline Bar & Didar CRM Benchmarks */}
      <div className="bg-slate-900/80 p-4 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                برد کانبان فرصت‌ها و خطوط فروش (Didar Pipeline Engine)
              </h3>
              <p className="text-[11px] text-slate-400">
                مدیریت معاملات راکد (Deal Rotting)، انضباط فعالیت بعدی الزامی، و پیش‌فاکتور با مالیات بر ارزش افزوده ۱۰٪
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {/* Rotting Deals Filter Toggle */}
            <button
              onClick={() => setFilterOnlyRotting(!filterOnlyRotting)}
              data-testid="toggle-rotting-filter"
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                filterOnlyRotting
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <span>⚠️ فرصت‌های راکد</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px]">
                {rottingDealsCount}
              </span>
            </button>

            {/* Loss Analytics Button */}
            <button
              onClick={openLossAnalytics}
              data-testid="open-loss-analytics-btn"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>📉 تحلیل دلایل شکست</span>
            </button>

            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              کل: <strong>{deals.length}</strong>
            </div>
            <div className="bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800">
              ارزش: <strong>{formatRials(totalPipelineSum)}</strong>
            </div>
          </div>
        </div>

        {/* Sales Target Quota Strip (Didar Goal Tracking) */}
        {salesTarget && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-amber-400">🎯 هدف فروش ماه جاری:</span>
              <span className="font-mono text-slate-200">{formatRials(salesTarget.targetAmountMinor)}</span>
              <span className="text-slate-500">|</span>
              <span>محقق شده: <strong className="text-emerald-400 font-mono">{formatRials(salesTarget.achievedAmountMinor)}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-36 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(salesTarget.achievementPercent, 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                {salesTarget.achievementPercent}٪
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = displayedDeals.filter((d) => d.stage === stage.key);
          const stageSum = stageDeals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);

          return (
            <div
              key={stage.id}
              data-testid={`pipeline-column-${stage.key}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              className="bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col min-w-[240px] max-h-[750px] shadow-sm"
            >
              {/* Column Header */}
              <div
                className="p-3 border-b border-slate-800 flex flex-col gap-1 rounded-t-xl"
                style={{ borderTop: `3px solid ${stage.color || '#6366f1'}` }}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200 truncate">{stage.name}</span>
                  <span className="text-[11px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>احتمال: {stage.defaultProbability}٪</span>
                  <span className="font-bold text-slate-300">{formatRials(stageSum)}</span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {stageDeals.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-800/80 rounded-lg text-slate-600 text-xs">
                    معامله‌ای وجود ندارد
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const isRotting =
                      deal.isRotting || (deal.daysInCurrentStage && deal.daysInCurrentStage >= 14);

                    return (
                      <article
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => onSelectDeal?.(deal)}
                        data-testid={`deal-card-${deal.id}`}
                        className={`p-3 bg-slate-800/80 hover:bg-slate-800 border rounded-lg cursor-grab active:cursor-grabbing transition-all space-y-2 shadow ${
                          isRotting
                            ? 'border-amber-600/60 bg-amber-950/20 shadow-amber-950/30'
                            : 'border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        {/* Title and Rotting Alert */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-bold text-xs text-slate-200 line-clamp-2">
                            {deal.name}
                          </div>
                          {isRotting && (
                            <span
                              title={`این فرصت بیش از ${deal.daysInCurrentStage || 14} روز بدون اقدام در این مرحله باقی مانده است.`}
                              className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium"
                            >
                              ⚠️ راکد ({deal.daysInCurrentStage || 14} روز)
                            </span>
                          )}
                        </div>

                        {/* Amount & Probability */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-emerald-400 font-extrabold font-mono">
                            {formatRials(deal.amountMinor)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
                            {deal.probability}٪
                          </span>
                        </div>

                        {/* Next Action Discipline (Didar Core Rule) */}
                        <div className="pt-1 border-t border-slate-700/40">
                          {deal.nextActionTitle ? (
                            <div className="p-1.5 bg-sky-950/60 border border-sky-800/40 rounded text-[11px] text-sky-200 flex justify-between items-center">
                              <span className="truncate">📋 {deal.nextActionTitle}</span>
                              {deal.nextActionDueAt && (
                                <span className="font-mono text-[9px] text-sky-400 shrink-0">
                                  {new Date(deal.nextActionDueAt).toLocaleDateString('fa-IR')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNextActionModalDeal(deal);
                              }}
                              className="w-full text-right text-[10px] text-amber-400/90 hover:text-amber-300 py-0.5 flex items-center gap-1 font-medium"
                            >
                              <span>➕ ثبت اقدام بعدی (الزامی)</span>
                            </button>
                          )}
                        </div>

                        {/* Loss Reason Badge (if Lost) */}
                        {deal.stage === 'LOST' && deal.lossReason && (
                          <div className="p-1.5 bg-rose-950/60 border border-rose-900/50 rounded text-[10px] text-rose-300">
                            <strong>علت شکست:</strong>{' '}
                            {LOSS_REASONS.find((r) => r.value === deal.lossReason)?.label || deal.lossReason}
                          </div>
                        )}

                        {/* Action Buttons: Invoice & Stage Switcher */}
                        <div className="pt-1 border-t border-slate-700/40 flex justify-between items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openInvoiceModal(deal);
                            }}
                            title="صدور پیش‌فاکتور با ۱۰٪ ارزش افزوده"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1"
                          >
                            <span>🧾 پیش‌فاکتور</span>
                          </button>

                          <select
                            value={deal.stage}
                            onChange={(e) => executeStageTransition(deal.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`تغییر مرحله ${deal.name}`}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none"
                          >
                            {stages.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Mark Deal as LOST (Mandatory Reason Discipline) */}
      {lostModalDeal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <span>🛑</span>
              <h4>ثبت شکست معامله و علت عدم موفقیت</h4>
            </div>

            <p className="text-xs text-slate-300">
              طبق الگوی فروش استاندارد دیدار، ثبت علت دقیق شکست برای تحلیل نرخ تبدیل پایپ‌لاین الزامی است.
            </p>

            <div className="p-2 bg-slate-800/60 rounded border border-slate-700 text-xs text-slate-200">
              معامله: <strong>{lostModalDeal.name}</strong>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">دلیل اصلی شکست:</label>
              <select
                value={selectedLossReason}
                onChange={(e) => setSelectedLossReason(e.target.value as DealLossReasonType)}
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-rose-500"
              >
                {LOSS_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">توضیحات تکمیلی و بازخورد مشتری:</label>
              <textarea
                value={lossDescription}
                onChange={(e) => setLossDescription(e.target.value)}
                placeholder="توضیح دهید مشتری چه نظری داشت، کدام رقیب برنده شد یا چه قابلیتی کم بود..."
                rows={3}
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setLostModalDeal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmMarkLost}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
              >
                تایید و انتقال به مرحله شکست
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Next Action */}
      {nextActionModalDeal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <span>📋</span>
              <h4>ثبت اقدام بعدی الزامی (Next Action)</h4>
            </div>

            <p className="text-xs text-slate-400">
              هیچ معامله‌ای نباید بدون فعالیت بعدی رها شود تا از راکد شدن (Rotting) آن جلوگیری به عمل آید.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">عنوان اقدام بعدی:</label>
              <input
                type="text"
                value={nextActionTitle}
                onChange={(e) => setNextActionTitle(e.target.value)}
                placeholder="مثال: جلسه دمو با مدیرعامل، تماس تلفنی بررسی آفر..."
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">تاریخ سررسید اقدام:</label>
              <input
                type="date"
                value={nextActionDueDate}
                onChange={(e) => setNextActionDueDate(e.target.value)}
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setNextActionModalDeal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmNextAction}
                disabled={!nextActionTitle.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-bold"
              >
                ثبت فعالیت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Proforma Invoicing with 10% Iranian VAT */}
      {invoiceModalDeal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">صدور پیش‌فاکتور رسمی</h4>
                  <p className="text-[11px] text-slate-400">
                    محاسبه اقلام، تخفیف، و مالیات بر ارزش افزوده ۱۰٪ قانونی
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddInvoiceItem}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
              >
                ➕ افزودن کالا/خدمت
              </button>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              {invoiceItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="md:col-span-5">
                    <label className="text-[10px] text-slate-400 block mb-0.5">محصول / خدمت:</label>
                    {productsCatalog.length > 0 ? (
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateInvoiceItem(idx, 'productId', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                      >
                        {productsCatalog.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleUpdateInvoiceItem(idx, 'productName', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                      />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">تعداد:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateInvoiceItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-0.5">قیمت واحد (ریال):</label>
                    <input
                      type="number"
                      value={item.unitPriceMinor}
                      onChange={(e) =>
                        handleUpdateInvoiceItem(idx, 'unitPriceMinor', parseInt(e.target.value) || 0)
                      }
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] text-slate-400 block mb-0.5">تخفیف٪:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) =>
                        handleUpdateInvoiceItem(idx, 'discountPercent', parseInt(e.target.value) || 0)
                      }
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <button
                      onClick={() => handleRemoveInvoiceItem(idx)}
                      disabled={invoiceItems.length === 1}
                      className="p-1.5 text-rose-400 hover:text-rose-300 disabled:opacity-30"
                      title="حذف ردیف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Summary */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>جمع کل اقلام (ناخالص):</span>
                <span className="font-mono text-slate-200">{formatRials(invoiceSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مجموع تخفیف اعمال‌شده:</span>
                <span className="font-mono text-rose-400">-{formatRials(invoiceDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                <span className="font-mono text-amber-400">+{formatRials(invoiceTax)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-slate-100">
                <span>مبلغ نهایی پیش‌فاکتور (قابل پرداخت):</span>
                <span className="font-mono text-emerald-400">{formatRials(invoiceFinal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setInvoiceModalDeal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmCreateInvoice}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
              >
                تایید و صدور نهایی پیش‌فاکتور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Loss Reasons Analytics Report */}
      {showLossAnalyticsModal && lossAnalytics && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📉</span>
                <h4 className="text-sm font-bold text-slate-100">گزارش و تحلیل دلایل شکست معاملات</h4>
              </div>
              <button
                onClick={() => setShowLossAnalyticsModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded border border-slate-700">
                <div className="text-slate-400">تعداد کل فرصت‌های از دست رفته:</div>
                <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                  {lossAnalytics.totalLostDealsCount}
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded border border-slate-700">
                <div className="text-slate-400">ارزش ریالی فرصت‌های سوخته:</div>
                <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                  {formatRials(lossAnalytics.totalLostAmountMinor)}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-slate-300">تفکیک علل شکست:</h5>
              {lossAnalytics.breakdownByReason.map((b) => (
                <div key={b.reason} className="p-2.5 bg-slate-800/40 border border-slate-800 rounded space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-200">{b.label}</span>
                    <span className="font-mono text-slate-400">
                      {b.count} مورد ({b.percentage}٪)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowLossAnalyticsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealsPipelineKanban;
