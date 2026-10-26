'use client';

import React from 'react';

export default function ForbiddenPage() {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center"
      data-testid="forbidden-page"
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
        <div className="w-16 h-16 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
          🚫
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-100">
            خطای ۴۰۳: دسترسی به این بخش مجاز نیست
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            نقش یا سطح دسترسی حساب کاربری شما اجازه مشاهده یا ویرایش این منبع را ندارد. اطلاعات
            محرمانه سازمان به دلایل امنیتی نمایش داده نمی‌شود.
          </p>
        </div>

        <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 text-right space-y-1">
          <div className="font-bold text-slate-200">راهنمای رفع مشکل:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>در صورت نیاز به این بخش، با مدیر سازمان (OrganizationAdmin) تماس بگیرید.</li>
            <li>از صحت فضای کاری فعال (Workspace) اطمینان حاصل فرمایید.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="/"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow"
          >
            ← بازگشت به داشبورد اصلی
          </a>
          <a
            href="/portal"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            ورود به پورتال مشتریان
          </a>
        </div>
      </div>
    </div>
  );
}
