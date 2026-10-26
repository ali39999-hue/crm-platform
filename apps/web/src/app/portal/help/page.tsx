'use client';

import React, { useState } from 'react';

export default function CustomerHelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const FAQ_ITEMS = [
    {
      q: 'چگونه می‌توانم وضعیت پیشرفت تیکت پشتیبانی خود را پیگیری کنم؟',
      a: 'پس از ورود به پورتال مشتریان در تب «تیکت‌های من»، لیست کلیه درخواست‌ها با نشانگر وضعیت (جدید، در حال انجام، پاسخ مشتری، حل‌شده) و زمان متعهد SLA قابل مشاهده است.',
    },
    {
      q: 'تعهد زمانی پاسخگویی (SLA) در سامانه چگونه محاسبه می‌شود؟',
      a: 'تعهد پاسخگویی بر اساس سطح اولویت تیکت (عادی، بالا، فوری) و تقویم کاری سازمان محاسبه می‌گردد. برای تیکت‌های فوری حداکثر ۴ ساعت و برای تیکت‌های عادی ۲۴ ساعت کاری تعیین شده است.',
    },
    {
      q: 'آیا امکان الصاق فایل یا مستندات به تیکت وجود دارد؟',
      a: 'بله، در متن مکاتبات تیکت می‌توانید مستندات، گزارش‌های خطا یا لاگ‌های فنی را ارسال کنید. کلیه فایل‌ها توسط اسکنر امنیتی بررسی می‌گردند.',
    },
    {
      q: 'آیا کارشناسان شرکت می‌توانند یادداشت‌های محرمانه داخلی داشته باشند؟',
      a: 'بله، سیستم مجهز به لایه ایزولاسیون کامل است. یادداشت‌های داخلی کارشناسان صرفاً برای تیم فنی قابل مشاهده است و هیچ‌گاه در پورتال مشتریان نمایش داده نمی‌شود.',
    },
  ];

  const GUIDES = [
    {
      title: 'راهنمای جامع ثبت تیکت و پیگیری پشتیبانی در پورتال',
      desc: 'آشنایی با نحوه ثبت درخواست، الصاق مستندات و پیگیری پاسخ‌های تیم فنی',
      icon: '🎫',
      tag: 'پشتیبانی',
    },
    {
      title: 'دستورالعمل امنیت داده‌ها و احراز هویت دو مرحله‌ای',
      desc: 'راهنمای تنظیم امنیت حساب، ورود ایمن و حفظ محرمانگی رمز عبور',
      icon: '🔒',
      tag: 'امنیت',
    },
    {
      title: 'نحوه دریافت گزارش‌های ماهانه و خروجی‌های آماری',
      desc: 'استفاده از فیلترهای تاریخی جلالی و دریافت فایل‌های استاندارد اکسل',
      icon: '📊',
      tag: 'گزارش‌ها',
    },
  ];

  const filteredFaqs = FAQ_ITEMS.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
  });

  const filteredGuides = GUIDES.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q);
  });

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between"
      data-testid="customer-help-page"
    >
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center font-bold text-white text-base">
              P
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-100">
                مرکز راهنما و پایگاه دانش مشتریان
              </div>
              <div className="text-[11px] text-slate-400">Customer Knowledge & Help Center</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="/portal"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              ← بازگشت به پورتال مشتریان
            </a>
            <a
              href="/portal/sign-in"
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
            >
              ورود به حساب
            </a>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900/60 to-transparent py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            چگونه می‌توانیم به شما کمک کنیم؟
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            جستجو در مقالات آموزشی، راهنماهای گام‌به‌گام و پاسخ‌های پرتکرار تیم پشتیبانی
          </p>

          <div className="relative pt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در موضوعات، مقالات یا کلمات کلیدی (مثال: SLA، ثبت تیکت، اکسل)..."
              data-testid="help-search-input"
              className="w-full px-5 py-3.5 pr-12 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xl"
            />
            <span className="absolute right-4 top-5 text-slate-400 text-lg">🔍</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 space-y-12 flex-1">
        {/* Popular Knowledge Guides */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <span>📚</span>
            <span>راهنماهای پرکاربرد</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="guides-grid">
            {filteredGuides.map((guide) => (
              <div
                key={guide.title}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-2 shadow transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="text-2xl">{guide.icon}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono">
                    {guide.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100 leading-snug">{guide.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <span>❓</span>
            <span>پرسش‌های متداول (FAQ)</span>
          </h2>

          <div className="space-y-2.5 max-w-4xl mx-auto" data-testid="faq-list">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-right p-4 flex justify-between items-center text-xs font-bold text-slate-200 hover:bg-slate-800/40"
                  >
                    <span>{faq.q}</span>
                    <span className="text-sky-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 bg-slate-900/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Still Need Help CTA */}
        <section className="bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/50 rounded-2xl p-8 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-100">پاسخ سوال خود را نیافتید؟</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            کارشناسان تیم پشتیبانی آماده رسیدگی و پاسخگویی اختصاصی به درخواست‌های شما هستند.
          </p>
          <div className="pt-2">
            <a
              href="/portal"
              data-testid="contact-support-cta"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors shadow"
            >
              <span>+</span>
              <span>ثبت تیکت پشتیبانی جدید</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 text-center text-[11px] text-slate-600 border-t border-slate-800/80">
        پلتفرم سازمانی CRM • مرکز راهنمای مشتریان
      </footer>
    </div>
  );
}
