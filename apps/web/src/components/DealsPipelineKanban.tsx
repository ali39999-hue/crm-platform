'use client';

import React, { useState, useEffect } from 'react';
import type { DealDto, PipelineStageDto } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface DealsPipelineKanbanProps {
  initialDeals?: DealDto[];
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  onSelectDeal?: (deal: DealDto) => void;
}

export function DealsPipelineKanban({
  initialDeals,
  onNotify,
  onSelectDeal,
}: DealsPipelineKanbanProps) {
  const [stages, setStages] = useState<PipelineStageDto[]>([]);
  const [deals, setDeals] = useState<DealDto[]>(initialDeals || []);
  const [loading, setLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const [stagesRes, dealsRes] = await Promise.all([
        apiClient.getPipelineStages(),
        initialDeals ? Promise.resolve(initialDeals) : apiClient.getDeals(),
      ]);
      setStages(stagesRes.sort((a, b) => a.order - b.order));
      setDeals(dealsRes);
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

    await executeStageTransition(dealId, targetStageKey);
  };

  const executeStageTransition = async (dealId: string, targetStageKey: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

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

  const totalPipelineSum = deals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);

  return (
    <div className="space-y-4" data-testid="deals-pipeline-kanban">
      {/* Top Pipeline Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              برد کانبان فرصت‌ها و خطوط فروش (Deals Pipeline)
            </h3>
            <p className="text-[11px] text-slate-400">
              جابجایی درگ اند دراپ میان مراحل فروش با همگام‌سازی لحظه‌ای احتمالات و مبالغ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            تعداد کل معاملات: <strong>{deals.length}</strong>
          </div>
          <div className="bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800">
            ارزش کل پایپ‌لاین: <strong>{formatRials(totalPipelineSum)}</strong>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageSum = stageDeals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);

          return (
            <div
              key={stage.id}
              data-testid={`pipeline-column-${stage.key}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              className="bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col min-w-[220px] max-h-[750px] shadow-sm"
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
                  stageDeals.map((deal) => (
                    <article
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => onSelectDeal?.(deal)}
                      data-testid={`deal-card-${deal.id}`}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:border-slate-600 space-y-2 shadow"
                    >
                      <div className="font-bold text-xs text-slate-200 line-clamp-2">
                        {deal.name}
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400 font-extrabold font-mono">
                          {formatRials(deal.amountMinor)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
                          {deal.probability}٪
                        </span>
                      </div>

                      {/* Manual Transition Select for accessible keyboard/touch users */}
                      <div className="pt-1 border-t border-slate-700/40 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">تغییر مرحله:</span>
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DealsPipelineKanban;
