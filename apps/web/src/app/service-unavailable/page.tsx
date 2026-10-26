'use client';

import React from 'react';

export default function ServiceUnavailablePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center"
      data-testid="service-unavailable-page"
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
        <div className="w-16 h-16 bg-amber-950/80 border border-amber-800 text-amber-300 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
          ⚡
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-100">
            خطای ۵۰۳: سرویس به صورت موقت در دسترس نیست
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            سرور در حال حاضر به دلیل عملیات به‌روزرسانی زیرساخت یا بار پردازشی موقت قادر به پاسخگویی
            نیست. لطفاً چند لحظه دیگر مجدداً تلاش کنید.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow flex items-center justify-center gap-1.5"
          >
            <span>🔄</span>
            <span>تلاش مجدد (Retry)</span>
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            صفحه اصلی
          </a>
        </div>
      </div>
    </div>
  );
}
