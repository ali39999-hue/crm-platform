'use client';

import React from 'react';

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center"
      data-testid="not-found-page"
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
        <div className="w-16 h-16 bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
          🔍
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-100">
            خطای ۴۰۴: صفحه یا منبع مورد نظر یافت نشد
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            آدرس درخواست‌شده در سامانه وجود ندارد یا ممکن است منتقل، حذف یا محدود شده باشد.
          </p>
        </div>

        <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 text-right space-y-1">
          <div className="font-bold text-slate-200">پیشنهادات:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>صحت پیوند (URL) درج‌شده را بررسی فرمایید.</li>
            <li>از پالت جستجوی سریع (Ctrl+K) برای یافتن رکورد مورد نظر استفاده کنید.</li>
          </ul>
        </div>

        <div className="pt-2 flex justify-center">
          <a
            href="/"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow"
          >
            ← بازگشت به صفحه اصلی سامانه
          </a>
        </div>
      </div>
    </div>
  );
}
