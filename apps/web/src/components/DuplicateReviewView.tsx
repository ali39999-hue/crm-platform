'use client';

import React, { useState, useEffect } from 'react';
import type { DuplicateCandidateDto } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface DuplicateReviewViewProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function DuplicateReviewView({ onNotify }: DuplicateReviewViewProps) {
  const [candidates, setCandidates] = useState<DuplicateCandidateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergingId, setMergingId] = useState<string | null>(null);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getDuplicateCandidates();
      setCandidates(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری موارد تکراری', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  const handleMerge = async (candidate: DuplicateCandidateDto) => {
    if (
      !window.confirm(
        `آیا از ادغام «${candidate.duplicateRecord.title}» در «${candidate.primaryRecord.title}» اطمینان دارید؟ داده‌های تماس تجمیع شده و رکورد تکراری حذف خواهد شد.`,
      )
    ) {
      return;
    }

    try {
      setMergingId(candidate.id);
      await apiClient.mergeRecords({
        entityType: candidate.entityType,
        targetRecordId: candidate.primaryRecord.id,
        sourceRecordId: candidate.duplicateRecord.id,
      });

      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
      onNotify?.(
        `رکورد «${candidate.duplicateRecord.title}» با موفقیت در رکورد اصلی ادغام شد و در ممیزی ثبت گردید`,
        'success',
      );
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ادغام رکوردها', 'error');
    } finally {
      setMergingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        در حال بررسی و تطبیق هوشمند رکوردهای تکراری...
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="duplicate-review-view">
      <div className="flex justify-between items-center bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>🔍</span>
            <span>مدیریت و ادغام رکوردهای تکراری (Duplicate Resolution & Merge)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            شناسایی خودکار سرنخ‌ها، مخاطبان و شرکت‌های مشابه بر اساس ایمیل، شماره تماس نرمال‌شده و تطبیق نام
          </p>
        </div>

        <button
          type="button"
          onClick={loadDuplicates}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
        >
          🔄 اسکن مجدد
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
          <span className="text-3xl">✨</span>
          <div className="font-bold text-slate-200 text-sm">هیچ رکورد تکراری شناسایی نشد</div>
          <p className="text-xs text-slate-400">
            پایگاه داده مشتریان، سرنخ‌ها و شرکت‌ها کاملاً یکپارچه و بدون رکورد تکراری است.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="duplicate-candidates-list">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              data-testid={`duplicate-card-${cand.id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              {/* Match Details */}
              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    تشابه {cand.confidenceScore}٪
                  </span>
                  <span className="text-xs text-slate-400">
                    دلیل تطبیق: <strong className="text-slate-200">{cand.matchReason}</strong>
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-indigo-400 font-mono">{cand.entityType}</span>
                </div>

                {/* Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  {/* Primary Record */}
                  <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      رکورد اصلی (حفظ می‌شود):
                    </span>
                    <div className="font-bold text-slate-100">{cand.primaryRecord.title}</div>
                    {cand.primaryRecord.email && (
                      <div className="text-slate-400 font-mono text-[11px]">
                        📧 {cand.primaryRecord.email}
                      </div>
                    )}
                    {cand.primaryRecord.phone && (
                      <div className="text-slate-400 font-mono text-[11px]">
                        📞 {cand.primaryRecord.phone}
                      </div>
                    )}
                  </div>

                  {/* Duplicate Candidate */}
                  <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg space-y-1">
                    <span className="text-[10px] text-rose-400 font-bold block">
                      رکورد کپی (ادغام و حذف می‌شود):
                    </span>
                    <div className="font-bold text-slate-100">{cand.duplicateRecord.title}</div>
                    {cand.duplicateRecord.email && (
                      <div className="text-slate-400 font-mono text-[11px]">
                        📧 {cand.duplicateRecord.email}
                      </div>
                    )}
                    {cand.duplicateRecord.phone && (
                      <div className="text-slate-400 font-mono text-[11px]">
                        📞 {cand.duplicateRecord.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex md:flex-col justify-end gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleMerge(cand)}
                  disabled={mergingId === cand.id}
                  data-testid={`merge-btn-${cand.id}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  {mergingId === cand.id ? 'در حال ادغام...' : '⚡ تایید و ادغام رکوردها'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DuplicateReviewView;
