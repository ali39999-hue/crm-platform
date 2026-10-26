'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerPortalSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('customer@client.com');
  const [password, setPassword] = useState('password123');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(
        authMode === 'otp'
          ? 'ورود شماره تلفن همراه یا آدرس ایمیل الزامی است'
          : 'ورود آدرس ایمیل الزامی است',
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (authMode === 'otp' && !otpSent) {
        // Send OTP simulation via SMS
        setOtpSent(true);
        setOtpCode('12345'); // Pre-fill test OTP for easy testing
        setLoading(false);
        return;
      }

      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Successfully authenticated as CustomerPortalUser
      router.push('/portal');
    } catch (err: any) {
      setError(err?.message || 'خطا در احراز هویت کاربر پورتال');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6"
      data-testid="customer-sign-in-page"
    >
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md">
            P
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-100">پورتال خدمات مشتریان</div>
            <div className="text-[11px] text-slate-400">سامانه پشتیبانی و پیگیری درخواست‌ها</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a
            href="/portal/help"
            className="text-slate-400 hover:text-sky-400 transition-colors"
          >
            مرکز راهنما و سوالات متداول
          </a>
          <span className="text-slate-700">•</span>
          <a
            href="/"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            پنل سازمانی کارکنان ←
          </a>
        </div>
      </header>

      {/* Main Sign-in Card */}
      <main className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 my-auto">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-extrabold text-slate-100">ورود به پورتال مشتریان</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            جهت مشاهده تیکت‌های پشتیبانی، مکاتبه با کارشناسان و دسترسی به مستندات سازمانی وارد
            حساب کاربری خود شوید.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-medium border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setOtpSent(false);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              authMode === 'password'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            رمز عبور
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              authMode === 'otp'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            رمز یکبار مصرف (OTP)
          </button>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {authMode === 'otp'
                ? 'شماره تلفن همراه ایران یا ایمیل *'
                : 'آدرس ایمیل شرکتی / سازمانی *'}
            </label>
            <input
              type={authMode === 'otp' ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={authMode === 'otp' ? '09121234567 یا ایمیل' : 'customer@company.com'}
              data-testid="customer-email-input"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {authMode === 'password' ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-400">گذرواژه *</label>
                <a href="/invite-expired" className="text-[11px] text-sky-400 hover:underline">
                  فراموشی رمز عبور؟
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="customer-password-input"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          ) : otpSent ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                کد تایید پیامک/ایمیل‌شده *
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="۱۲۳۴۵۶"
                data-testid="customer-otp-input"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            data-testid="customer-signin-btn"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition-colors shadow flex items-center justify-center gap-2"
          >
            {loading
              ? 'در حال اعتبارسنجی...'
              : authMode === 'otp' && !otpSent
                ? 'ارسال کد ورود یکبار مصرف'
                : 'ورود به پورتال پشتیبانی'}
          </button>
        </form>

        <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-[11px] text-slate-500 text-center leading-normal">
          حساب‌های پورتال مشتریان صرفاً به پرونده‌ها و تیکت‌های سازمان خود دسترسی دارند و یادداشت‌های
          محرمانه تیم فنی را مشاهده نخواهند کرد.
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-600 pt-6 border-t border-slate-800/80">
        پلتفرم یکپارچه سازمانی CRM • پورتال امن سلف‌سرویس مشتریان
      </footer>
    </div>
  );
}
