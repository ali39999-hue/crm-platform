'use client';

import React, { useState } from 'react';
import type { LeadTemperature } from '@crm/contracts';
import { getLeadTemperatureLabel } from '@crm/domain';
import { apiClient } from '../lib/api-client';

interface ExhibitionLeadIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

const DEFAULT_PRODUCTS = [
  'نرم‌افزار مدیریت ارتباط با مشتری سازمانی',
  'بسته جامع استقرار و آموزش پرسنل',
  'اتصال سانترال تلفنی و پاپ‌آپ VoIP',
  'خدمات پشتیبانی VIP سالانه',
];

export function ExhibitionLeadIntakeModal({
  isOpen,
  onClose,
  onNotify,
}: ExhibitionLeadIntakeModalProps) {
  const [exhibitionName, setExhibitionName] = useState('نمایشگاه بین‌المللی صنعت و نفت ۱۴۰۵');
  const [boothNumber, setBoothNumber] = useState('سالن ۶ - غرفه ۱۲');
  const [visitorName, setVisitorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [temperature, setTemperature] = useState<LeadTemperature>('WARM');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([DEFAULT_PRODUCTS[0]!]);
  const [notes, setNotes] = useState('');
  const [sendWelcomeSms, setSendWelcomeSms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProductToggle = (prod: string) => {
    setSelectedProducts((prev) =>
      prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !mobilePhone.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await apiClient.captureExhibitionLead({
        exhibitionName: exhibitionName.trim(),
        boothNumber: boothNumber.trim() || undefined,
        visitorName: visitorName.trim(),
        companyName: companyName.trim() || undefined,
        mobilePhone: mobilePhone.trim(),
        jobTitle: jobTitle.trim() || undefined,
        interestProducts: selectedProducts,
        temperature,
        notes: notes.trim() || undefined,
        sendWelcomeSms,
      });

      onNotify?.(
        `سرنخ «${res.visitorName}» با حرارت ${getLeadTemperatureLabel(res.temperature).slice(0, 7)} ثبت شد${
          res.dealId ? ' و فرصت فروش ایجاد گردید' : ''
        }!`,
        'success',
      );

      // Reset form
      setVisitorName('');
      setCompanyName('');
      setMobilePhone('');
      setJobTitle('');
      setNotes('');
      onClose();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت سرنخ نمایشگاه', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      data-testid="exhibition-lead-intake-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎪</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                ثبت سریع بازدیدکننده غرفه نمایشگاه (Didar Leeda)
              </h3>
              <p className="text-[11px] text-slate-400">
                جذب آنی سرنخ، تعیین درجه تمایل خرید و ارسال پیامک خودکار کاتالوگ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Exhibition & Booth Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">نام نمایشگاه / رویداد:</label>
              <input
                type="text"
                required
                value={exhibitionName}
                onChange={(e) => setExhibitionName(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">شماره سالن / غرفه:</label>
              <input
                type="text"
                value={boothNumber}
                onChange={(e) => setBoothNumber(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Visitor Name & Mobile Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                نام و نام خانوادگی بازدیدکننده <strong className="text-rose-400">*</strong>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: دکتر فرشید کاظمی"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                data-testid="visitor-name-input"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                شماره تلفن همراه <strong className="text-rose-400">*</strong>
              </label>
              <input
                type="tel"
                required
                placeholder="09121234567"
                value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)}
                data-testid="visitor-phone-input"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono dir-ltr font-bold"
              />
            </div>
          </div>

          {/* Company & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">نام سازمان / شرکت:</label>
              <input
                type="text"
                placeholder="مثال: شرکت پتروپارس سازه"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">سمت / شغل:</label>
              <input
                type="text"
                placeholder="مثال: مدیر بازرگانی و خرید"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Lead Temperature (حرارت لید) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <label className="text-slate-300 block font-semibold">
              درجه تمایل و حرارت سرنخ (Lead Temperature):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemperature('HOT')}
                data-testid="temp-hot-btn"
                className={`p-2 rounded-xl border text-center transition-all ${
                  temperature === 'HOT'
                    ? 'bg-rose-950 text-rose-200 border-rose-500 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-sm">🔥</div>
                <div className="text-[11px] mt-0.5">داغ (خرید فوری)</div>
              </button>

              <button
                type="button"
                onClick={() => setTemperature('WARM')}
                data-testid="temp-warm-btn"
                className={`p-2 rounded-xl border text-center transition-all ${
                  temperature === 'WARM'
                    ? 'bg-amber-950 text-amber-200 border-amber-500 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-sm">🌤️</div>
                <div className="text-[11px] mt-0.5">گرم (علاقه‌مند)</div>
              </button>

              <button
                type="button"
                onClick={() => setTemperature('COLD')}
                data-testid="temp-cold-btn"
                className={`p-2 rounded-xl border text-center transition-all ${
                  temperature === 'COLD'
                    ? 'bg-sky-950 text-sky-200 border-sky-500 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-sm">❄️</div>
                <div className="text-[11px] mt-0.5">سرد (معمولی)</div>
              </button>
            </div>
          </div>

          {/* Products of Interest */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <label className="text-slate-300 block font-semibold">کالاها یا خدمات مورد علاقه:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DEFAULT_PRODUCTS.map((prod) => (
                <label
                  key={prod}
                  className="flex items-center gap-2 p-2 bg-slate-800/60 border border-slate-700/80 rounded-lg cursor-pointer text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(prod)}
                    onChange={() => handleProductToggle(prod)}
                  />
                  <span>{prod}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-slate-400 block">یادداشت‌های مذاکره در غرفه:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="نکات مطرح شده در غرفه، قرار تماس بعدی..."
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs resize-none"
            />
          </div>

          {/* Welcome SMS Switch */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <input
              type="checkbox"
              id="send-welcome-sms"
              checked={sendWelcomeSms}
              onChange={(e) => setSendWelcomeSms(e.target.checked)}
            />
            <label htmlFor="send-welcome-sms" className="text-slate-300 text-[11px] cursor-pointer">
              ارسال پیامک آنی تشکر از حضور در غرفه و لینک کاتالوگ (خط خدماتی)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !visitorName.trim() || !mobilePhone.trim()}
              data-testid="submit-exhibition-lead-btn"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
            >
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت قطعی سرنخ نمایشگاهی'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExhibitionLeadIntakeModal;
