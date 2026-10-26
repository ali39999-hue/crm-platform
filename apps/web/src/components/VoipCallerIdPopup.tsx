'use client';

import React, { useState, useEffect } from 'react';
import type { VoipCallerProfileDto } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface VoipCallerIdPopupProps {
  onOpenCustomerTimeline?: (accountId: string) => void;
  onOpenDeal?: (dealId: string) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function VoipCallerIdPopup({
  onOpenCustomerTimeline,
  onOpenDeal,
  onNotify,
}: VoipCallerIdPopupProps) {
  const [activeCall, setActiveCall] = useState<VoipCallerProfileDto | null>(null);
  const [minimized, setMinimized] = useState(false);

  // Poll or check active call periodically
  useEffect(() => {
    let isMounted = true;
    const checkActiveCall = async () => {
      try {
        const call = await apiClient.getActiveVoipCall();
        if (isMounted && call) {
          setActiveCall(call);
        }
      } catch {
        // Silent catch for background poll
      }
    };

    const interval = setInterval(checkActiveCall, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Simulator helper for demo / testing
  const handleSimulateCall = async (isExisting: boolean) => {
    try {
      const mockEvent = {
        callId: `call-sim-${Date.now()}`,
        callerNumber: isExisting ? '09121234567' : '09359876543',
        calleeNumber: '102',
        direction: 'INBOUND' as const,
        status: 'RINGING' as const,
        timestamp: new Date().toISOString(),
      };
      const profile = await apiClient.sendVoipCallEvent(mockEvent);
      setActiveCall(profile);
      setMinimized(false);
      onNotify?.(
        isExisting
          ? 'تماس ورودی جدید از مشتری شناسایی‌شده فولاد گستر'
          : 'تماس ورودی جدید از شماره ناشناس',
        'success',
      );
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در شبیه‌سازی تماس', 'error');
    }
  };

  const handleDismiss = () => {
    setActiveCall(null);
  };

  if (!activeCall) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => handleSimulateCall(true)}
          data-testid="simulate-voip-call-btn"
          title="شبیه‌سازی تماس ورودی سانترال و پاپ‌آپ کالرآیدی دیدار"
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 shadow-lg flex items-center gap-1.5 backdrop-blur transition-all"
        >
          <span className="text-emerald-400 animate-pulse">📞</span>
          <span>تست کالرآیدی سانترال (دیدار)</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      data-testid="voip-caller-id-popup"
      aria-label="اعلان تماس ورودی سانترال"
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
        minimized ? 'w-64' : 'w-80 md:w-96'
      }`}
    >
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl p-4 text-xs space-y-3 backdrop-blur-md">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-100 flex items-center gap-1">
              <span>📞 تماس ورودی سانترال</span>
              <span className="text-[10px] text-slate-400 font-mono">({activeCall.callId.slice(-6)})</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded text-[10px]"
              title={minimized ? 'بزرگ‌نمایی' : 'کوچک‌نمایی'}
            >
              {minimized ? '▲' : '▼'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-rose-400 px-1 py-0.5 rounded text-[10px]"
              title="رد تماس / بستن"
            >
              ✕
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Caller Identification */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-mono text-emerald-400 text-sm font-bold dir-ltr">
                  {activeCall.callerNumber}
                </span>
                {activeCall.isExistingCustomer ? (
                  <span className="px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-medium">
                    ✓ مشتری پرونده‌دار
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-800 rounded-full text-[10px] font-medium">
                    ❓ مشتری جدید (سرنخ)
                  </span>
                )}
              </div>

              {activeCall.matchedContact && (
                <div className="text-slate-100 font-bold text-sm pt-1">
                  {activeCall.matchedContact.name}
                </div>
              )}

              {activeCall.matchedAccount && (
                <div className="text-slate-300 text-xs flex items-center gap-1">
                  <span>🏢 شرکت:</span>
                  <span className="font-semibold text-slate-200">
                    {activeCall.matchedAccount.name}
                  </span>
                </div>
              )}
            </div>

            {/* Recent Deals Context (Didar Pattern) */}
            {activeCall.recentDeals && activeCall.recentDeals.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-400 font-semibold">
                  آخرین فرصت‌های فروش در کاریز:
                </div>
                {activeCall.recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => onOpenDeal?.(deal.id)}
                    className="p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <span className="truncate text-slate-300 font-medium">{deal.name}</span>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">
                      {(deal.amountMinor / 1000000).toLocaleString('fa-IR')} م.ر
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
              <button
                onClick={() => {
                  if (activeCall.matchedAccount) {
                    onOpenCustomerTimeline?.(activeCall.matchedAccount.id);
                  }
                  handleDismiss();
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
              >
                <span>پاسخ و بازگشایی پرونده ۳۶۰°</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold transition-colors"
              >
                رد تماس
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default VoipCallerIdPopup;
