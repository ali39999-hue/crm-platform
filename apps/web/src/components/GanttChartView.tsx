'use client';

import React, { useState } from 'react';
import type { GanttProjectScheduleDto, GanttTaskDto } from '../lib/api-client';

interface GanttChartViewProps {
  schedule: GanttProjectScheduleDto;
  onRefresh: () => void;
  onSelectTask?: (task: GanttTaskDto) => void;
}

export function GanttChartView({ schedule, onRefresh, onSelectTask }: GanttChartViewProps) {
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const {
    hasCycle,
    errorMessage,
    totalDurationDays,
    projectStartDate,
    projectFinishDate,
    criticalPathIds,
    tasks,
  } = schedule;

  const displayTasks = criticalOnly ? tasks.filter((t) => t.isCritical) : tasks;
  const maxDays = Math.max(1, totalDurationDays);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h2 className="text-xl font-black text-slate-800">
              نمای گانت‌چارت تعاملی و موتور مسیر بحرانی (CPM)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            زمان‌بندی هوشمند وظایف، محاسبه شناوری (Float)، کشف تقدم و تاخر و رصد زنجیره حیاتی پروژه
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              criticalOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm ring-2 ring-rose-400'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🔥</span>
            <span>{criticalOnly ? 'نمایش همه وظایف' : 'فیلتر مسیر بحرانی (Critical Path)'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
          >
            🔄 به‌روزرسانی
          </button>
        </div>
      </div>

      {hasCycle && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-sm font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage || 'خطای چرخه وابستگی در گانت چارت کشف شد.'}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">طول کل زمان‌بندی:</span>
          <strong className="text-lg font-black text-indigo-700 font-mono">
            {totalDurationDays} روز کاری
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">وظایف در مسیر بحرانی:</span>
          <strong className="text-lg font-black text-rose-600 font-mono">
            {criticalPathIds.length} از {tasks.length}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">تاریخ آغاز پروژه:</span>
          <strong className="text-sm font-bold text-slate-800 font-mono">
            {new Date(projectStartDate).toLocaleDateString('fa-IR')}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">پیش‌بینی اتمام پروژه:</span>
          <strong className="text-sm font-bold text-slate-800 font-mono">
            {new Date(projectFinishDate).toLocaleDateString('fa-IR')}
          </strong>
        </div>
      </div>

      {/* Gantt Interactive Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Days Ruler Header */}
        <div className="border-b border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            ساختار شکست کار و محور زمان (روزهای کاری)
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-rose-700 font-bold">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> مسیر بحرانی (Slack = 0)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
              <span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> وظیفه عادی شناور
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-bold">
              <span className="w-2.5 h-2.5 rotate-45 bg-amber-500 inline-block" /> مایل‌استون
            </span>
          </div>
        </div>

        {/* Gantt Table Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Days Column Header Ruler */}
            <div className="grid grid-cols-12 bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 py-2 px-4">
              <div className="col-span-4 text-right">عنوان وظیفه / فاز</div>
              <div className="col-span-8 flex justify-between pr-2" dir="ltr">
                <span>روز ۰</span>
                <span>روز {Math.round(maxDays * 0.25)}</span>
                <span>روز {Math.round(maxDays * 0.5)}</span>
                <span>روز {Math.round(maxDays * 0.75)}</span>
                <span>روز {maxDays}</span>
              </div>
            </div>

            {/* Tasks Rows */}
            <div className="divide-y divide-slate-100">
              {displayTasks.map((t) => {
                const isHovered = hoveredTaskId === t.id;
                const leftPercent = (t.startOffsetDays / maxDays) * 100;
                const widthPercent = Math.max(2, (t.durationDays / maxDays) * 100);

                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => setHoveredTaskId(t.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    onClick={() => onSelectTask?.(t)}
                    className={`grid grid-cols-12 items-center p-3 transition cursor-pointer ${
                      isHovered ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Task Info Column */}
                    <div className="col-span-4 space-y-1 pl-3">
                      <div className="flex items-center gap-2">
                        {t.isCritical && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            بحرانی ⚡
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>مدت: {t.durationDays} روز</span>
                        <span>وزن: {t.weight}</span>
                        {t.slackDays > 0 ? (
                          <span className="text-indigo-600 font-bold">
                            شناوری: {t.slackDays} روز
                          </span>
                        ) : null}
                        {t.predecessorIds.length > 0 && (
                          <span>پیش‌نیاز: {t.predecessorIds.length} کار</span>
                        )}
                      </div>
                    </div>

                    {/* Timeline Bar Track */}
                    <div className="col-span-8 relative h-8 bg-slate-50 rounded-lg p-1 border border-slate-100">
                      {t.isMilestone ? (
                        <div
                          style={{ left: `${leftPercent}%` }}
                          className="absolute top-1.5 w-4 h-4 bg-amber-500 rotate-45 border-2 border-white shadow-sm -ml-2 z-10"
                          title="مایل‌استون کلیدی پروژه"
                        />
                      ) : (
                        <div
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-1 bottom-1 rounded-md transition-all shadow-sm flex items-center justify-between px-2 text-[10px] font-bold text-white overflow-hidden ${
                            t.isCritical
                              ? 'bg-gradient-to-r from-rose-600 to-rose-500 border border-rose-600 ring-1 ring-rose-300'
                              : 'bg-gradient-to-r from-indigo-600 to-indigo-500 border border-indigo-600'
                          }`}
                        >
                          {/* Inner Progress Fill */}
                          <div
                            style={{ width: `${t.progressPercent}%` }}
                            className="absolute top-0 bottom-0 left-0 bg-white/20"
                          />
                          <span className="relative z-10 truncate text-[9px]">
                            {t.title}
                          </span>
                          <span className="relative z-10 text-[9px] font-mono opacity-90">
                            {t.progressPercent}٪
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
