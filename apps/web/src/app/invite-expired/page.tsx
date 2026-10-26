'use client';

import React from 'react';

export default function InviteExpiredPage() {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center"
      data-testid="invite-expired-page"
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
        <div className="w-16 h-16 bg-purple-950/80 border border-purple-800 text-purple-300 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
          ⏳
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-100">
            لینک دعوت‌نامه منقضی شده است
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            مهلت زمانی پیوند دعوت به فضای کاری شرکت به اتمام رسیده است یا این پیوند توسط مدیر سازمان
            لغو گردیده است.
          </p>
        </div>

        <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 text-right space-y-1">
          <div className="font-bold text-slate-200">اقدام لازم:</div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            جهت ورود به سیستم، از مدیر سازمان خود بخواهید یک دعوت‌نامه معتبر جدید برای آدرس ایمیل
            شما ارسال نماید.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <a
            href="/"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow"
          >
            ← رفتن به صفحه ورود / اصلی
          </a>
        </div>
      </div>
    </div>
  );
}
