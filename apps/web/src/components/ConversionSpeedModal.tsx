'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

interface ConversionSpeedModalProps {
  onClose: () => void;
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function ConversionSpeedModal({ onClose, onNotify }: ConversionSpeedModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    avgDaysToWin: number;
    avgDaysToLose: number;
    overallAvgDays: number;
    channelBreakdown: Array<{ channel: string; leadsCount: number; conversionRate: number }>;
  } | null>(null);

  useEffect(() => {
    const fetchSpeedData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getConversionSpeedAnalytics();
        setData(res);
      } catch (err: any) {
        onNotify?.(err?.message || 'خطا در بارگذاری گزارش سرعت تبدیل', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSpeedData();
  }, []);

  const getChannelLabel = (ch: string) => {
    switch (ch) {
      case 'WEBSITE':
        return 'وب‌سایت و فرم آنلاین';
      case 'REFERRAL':
        return 'معرفی مشتریان قبلی';
      case 'EXHIBITION':
        return 'نمایشگاه تخصصی (لیدا)';
      case 'PHONE':
        return 'تماس تلفنی ورودی';
      case 'SOCIAL':
        return 'شبکه‌های اجتماعی';
      default:
        return ch;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                گزارش سرعت تبدیل و طول چرخه فروش (Conversion Speed)
              </h4>
              <p className="text-[11px] text-slate-400">
                محاسبه بر مبنای تاریخ ثبت اولیه معامله (قاعده کوهورت دیدار CRM)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            در حال پردازش طول چرخه فروش و سرعت تبدیل...
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[11px]">سرعت تا پیروزی (Days to Win):</span>
                <div className="text-lg font-bold text-emerald-300 font-mono">
                  {data.avgDaysToWin} روز
                </div>
                <p className="text-[10px] text-slate-500">میانگین زمان تبدیل به فروش موفق</p>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[11px]">سرعت تا باخت (Days to Lose):</span>
                <div className="text-lg font-bold text-rose-300 font-mono">
                  {data.avgDaysToLose} روز
                </div>
                <p className="text-[10px] text-slate-500">میانگین زمان تعیین‌تکلیف شکست</p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
                <span className="text-slate-400 text-[11px]">میانگین کل چرخه فروش:</span>
                <div className="text-lg font-bold text-slate-100 font-mono">
                  {data.overallAvgDays} روز
                </div>
                <p className="text-[10px] text-slate-500">طول دوره رسیدگی به معاملات</p>
              </div>
            </div>

            {/* Channels Breakdown */}
            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-slate-300">
                نرخ و سرعت تبدیل بر حسب کانال‌های ورودی بازاریابی:
              </h5>
              {data.channelBreakdown.map((ch) => (
                <div
                  key={ch.channel}
                  className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">
                      {getChannelLabel(ch.channel)}
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {ch.conversionRate}٪ نرخ تبدیل ({ch.leadsCount} سرنخ)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${ch.conversionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Insight Note */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>بینش تحلیلی دیدار:</strong> هرچه سرعت تبدیل کوتاه‌تر باشد، محصول شما روان‌تر
              و با انرژی پیگیری کمتری در بازار به فروش می‌رسد. کانال‌های با نرخ تبدیل بالاتر باید
              اولویت تخصیص بودجه تبلیغات قرار گیرند.
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversionSpeedModal;
