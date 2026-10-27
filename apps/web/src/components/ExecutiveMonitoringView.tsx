'use client';

import React from 'react';
import type { ExecutiveMonitoringDto } from '../lib/api-client';

interface ExecutiveMonitoringViewProps {
  data: ExecutiveMonitoringDto;
  onRefresh: () => void;
}

export function ExecutiveMonitoringView({ data, onRefresh }: ExecutiveMonitoringViewProps) {
  const { overallHealthScore, axes, generatedAt } = data;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const formatRials = (minor: number) => {
    if (!minor) return '۰ ریال';
    return (minor / 1000000).toLocaleString('fa-IR') + ' میلیون ریال';
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-black text-slate-800">
              داشبورد مانیتورینگ پنج‌گانه سازمانی (مدل هوشمند میزیتو)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            رصد زنده وضعیت پروژه‌ها، سرانجام وظایف پرسنل، نشست‌های تیمی، مشتریان و معوقات مالی
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
        >
          <span>🔄</span>
          <span>به‌روزرسانی شاخص‌ها</span>
        </button>
      </div>

      {/* Main KPI Card: Overall Health Score */}
      <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-xs font-bold text-indigo-200">
            شاخص ترکیبی سلامت سازمان (Executive Health Index)
          </span>
          <h3 className="text-2xl font-black">
            وضعیت کلی پیشرفت و هماهنگی عملیاتی
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            محاسبه شده بر مبنای وزن وظایف، تعهدات دارای تاخیر، نرخ امضای مصوبات و هشدارهای سررسید مالی
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
          <div className="text-center">
            <div className="text-4xl font-black font-mono tracking-tight text-emerald-400">
              {overallHealthScore}٪
            </div>
            <div className="text-[11px] font-bold text-slate-300 mt-1">
              امتیاز انطباق سازمان
            </div>
          </div>
        </div>
      </div>

      {/* 5-Axis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Axis 1: Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📁</span>
              <h4 className="text-sm font-black text-slate-800">مانیتورینگ پروژه‌ها</h4>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {axes.projects.rate}٪ سلامت
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>پروژه‌های فعال در حال اجرا:</span>
              <strong className="text-slate-800">{axes.projects.activeCount} پروژه</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>پروژه‌های دارای تاخیر / راکد:</span>
              <strong className={axes.projects.delayedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {axes.projects.delayedCount} پروژه
              </strong>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${axes.projects.rate}%` }}
            />
          </div>
        </div>

        {/* Axis 2: Tasks & Approvers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h4 className="text-sm font-black text-slate-800">وظایف و کنترل پرسنل</h4>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {axes.tasks.onTimeRate}٪ تحویل به موقع
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>در انتظار تایید سرپرست (Mizito Approver):</span>
              <strong className="text-amber-600">{axes.tasks.awaitingApprovalCount} وظیفه</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>وظایف دارای تاخیر از موعد:</span>
              <strong className={axes.tasks.delayedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {axes.tasks.delayedCount} وظیفه
              </strong>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${axes.tasks.onTimeRate}%` }}
            />
          </div>
        </div>

        {/* Axis 3: Meetings & Resolutions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤝</span>
              <h4 className="text-sm font-black text-slate-800">جلسات و مصوبات</h4>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              {axes.meetings.resolutionSignRate}٪ امضای مصوبات
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>نشست‌های سازمانی برگزار شده:</span>
              <strong className="text-slate-800">{axes.meetings.heldCount} جلسه</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>نرخ رسمیت و امضای صورتجلسات:</span>
              <strong className="text-purple-700 font-bold">{axes.meetings.resolutionSignRate}٪</strong>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${axes.meetings.resolutionSignRate}%` }}
            />
          </div>
        </div>

        {/* Axis 4: Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              <h4 className="text-sm font-black text-slate-800">مشتریان و تعاملات</h4>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {axes.customers.activeCount} تعامل فعال
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>پرونده‌های فعال مشتریان:</span>
              <strong className="text-slate-800">{axes.customers.activeCount} مشتری</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>مشتریان راکد (بدون تعامل در ۶۰ روز):</span>
              <strong className={axes.customers.dormantCount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                {axes.customers.dormantCount} مخاطب
              </strong>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: '85%' }}
            />
          </div>
        </div>

        {/* Axis 5: Financial Arrears (Mizito Summer Update Feature) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  مانیتورینگ معوقات مالی و اسناد وصول‌نشده
                </h4>
                <p className="text-[11px] text-slate-400">
                  ویژگی اختصاصی آپدیت تابستان میزیتو جهت پایش چک‌های صیادی و سررسید فاکتورها
                </p>
              </div>
            </div>

            {axes.financials.hasOverdueAlert ? (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                ⚠️ هشدار معوقات
              </span>
            ) : (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                وضعیت تسویه نرمال ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 block mb-1">مجموع مطالبات و معوقات:</span>
              <strong className="text-base font-bold text-slate-800 font-mono">
                {formatRials(axes.financials.totalArrearsMinor)}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 block mb-1">چک‌های صیادی معوق سررسید گذشته:</span>
              <strong className={`text-base font-bold font-mono ${
                axes.financials.overdueChecksCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {axes.financials.overdueChecksCount} فقره چک
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-left pt-2" dir="ltr">
        Generated At: {new Date(generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
