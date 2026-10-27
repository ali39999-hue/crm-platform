'use client';

import React, { useState } from 'react';
import type {
  LetterDto,
  CreateLetterRequest,
  ReferLetterRequest,
  CreateParaffRequest,
} from '../lib/api-client';

interface OfficeLettersViewProps {
  letters: LetterDto[];
  currentUserToken: string;
  onRefresh: () => void;
  onCreateLetter: (dto: CreateLetterRequest) => Promise<void>;
  onDeleteLetter: (id: string) => Promise<void>;
  onReferLetter: (id: string, dto: ReferLetterRequest) => Promise<void>;
  onAddParaff: (id: string, dto: CreateParaffRequest) => Promise<void>;
  onDeleteParaff: (letterId: string, paraffId: string) => Promise<void>;
}

export function OfficeLettersView({
  letters,
  currentUserToken,
  onRefresh,
  onCreateLetter,
  onDeleteLetter,
  onReferLetter,
  onAddParaff,
  onDeleteParaff,
}: OfficeLettersViewProps) {
  const [activeMailbox, setActiveMailbox] = useState<'all' | 'inbox' | 'sent'>('inbox');
  const [selectedLetter, setSelectedLetter] = useState<LetterDto | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [referRecipientId, setReferRecipientId] = useState('');
  const [referInstruction, setReferInstruction] = useState('');
  const [newParaffText, setNewParaffText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New letter form states
  const [composeType, setComposeType] = useState<'INTERNAL' | 'OUTGOING' | 'INCOMING'>('INTERNAL');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeUrgency, setComposeUrgency] = useState<'NORMAL' | 'URGENT' | 'IMMEDIATE'>('NORMAL');
  const [composeClassification, setComposeClassification] = useState<'NORMAL' | 'CONFIDENTIAL' | 'SECRET'>('NORMAL');
  const [composeRecipient, setComposeRecipient] = useState('');

  const filteredLetters = letters.filter((l) => {
    if (activeMailbox === 'sent' && l.senderId !== currentUserToken) return false;
    if (activeMailbox === 'inbox' && !l.recipientIds.includes(currentUserToken)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        l.subject.toLowerCase().includes(q) ||
        l.indicatorNumber.toLowerCase().includes(q) ||
        l.senderName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeContent.trim() || !composeRecipient.trim()) {
      setErrorMsg('لطفاً موضوع، متن نامه و گیرنده را تکمیل نمایید.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onCreateLetter({
        letterType: composeType,
        subject: composeSubject.trim(),
        content: composeContent.trim(),
        urgency: composeUrgency,
        classification: composeClassification,
        recipientIds: [composeRecipient.trim()],
      });
      setIsComposeOpen(false);
      setComposeSubject('');
      setComposeContent('');
      setComposeRecipient('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت و ارسال نامه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter || !newParaffText.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddParaff(selectedLetter.id, { text: newParaffText.trim() });
      setNewParaffText('');
      onRefresh();
      // Update selected letter state
      const updated = letters.find((l) => l.id === selectedLetter.id);
      if (updated) setSelectedLetter(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت پاراف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter || !referRecipientId.trim() || !referInstruction.trim()) return;
    setIsSubmitting(true);
    try {
      await onReferLetter(selectedLetter.id, {
        recipientId: referRecipientId.trim(),
        actionInstruction: referInstruction.trim(),
      });
      setIsReferOpen(false);
      setReferRecipientId('');
      setReferInstruction('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارجاع نامه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (letterId: string) => {
    if (!confirm('آیا از حذف این نامه اطمینان دارید؟')) return;
    try {
      await onDeleteLetter(letterId);
      if (selectedLetter?.id === letterId) setSelectedLetter(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف نامه');
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">آنی ⚡</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">فوری ⚠️</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">عادی</span>;
    }
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'SECRET':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">🔒 به کلی سری</span>;
      case 'CONFIDENTIAL':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">محرمانه</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">عادی</span>;
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📬</span>
            <h2 className="text-xl font-black text-slate-800">
              کارتابل مکاتبات اداری و دبیرخانه سازمانی (مدل میزیتو)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            شماره‌گذاری خودکار اندیکاتور دبیرخانه، گردش و ارجاع نامه‌ها، ثبت پاراف و قوانین رویت مخاطب
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2"
          >
            <span>✉️</span>
            <span>ایجاد و ارسال نامه جدید</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {/* Filter and Mailbox Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMailbox('inbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMailbox === 'inbox'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📥 نامه‌های دریافتی (صندوق ورودی)
          </button>
          <button
            onClick={() => setActiveMailbox('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMailbox === 'sent'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📤 نامه‌های ارسالی من
          </button>
          <button
            onClick={() => setActiveMailbox('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMailbox === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📑 همه مکاتبات
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در موضوع، شماره اندیکاتور یا فرستنده..."
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Grid: Letter List + Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Letters List Column */}
        <div className="lg:col-span-5 space-y-3">
          {filteredLetters.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              هیچ نامه‌ای در این کارتابل یافت نشد.
            </div>
          ) : (
            filteredLetters.map((l) => (
              <div
                key={l.id}
                onClick={() => setSelectedLetter(l)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedLetter?.id === l.id
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {l.indicatorNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getUrgencyBadge(l.urgency)}
                    {getClassificationBadge(l.classification)}
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">
                  {l.subject}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {l.content}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>از: <strong className="text-slate-700">{l.senderName}</strong></span>
                  <div className="flex items-center gap-2">
                    {l.paraffs && l.paraffs.length > 0 && (
                      <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        💬 {l.paraffs.length} پاراف
                      </span>
                    )}
                    <span>{new Date(l.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Letter Detail Column */}
        <div className="lg:col-span-7">
          {selectedLetter ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Letter Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                      شماره اندیکاتور: {selectedLetter.indicatorNumber}
                    </span>
                    {getUrgencyBadge(selectedLetter.urgency)}
                    {getClassificationBadge(selectedLetter.classification)}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    {selectedLetter.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsReferOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                  >
                    ارجاع به همکار ↪
                  </button>
                  <button
                    onClick={() => handleDelete(selectedLetter.id)}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                  >
                    حذف نامه 🗑️
                  </button>
                </div>
              </div>

              {/* Metadata details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block mb-0.5">فرستنده:</span>
                  <span className="font-bold text-slate-800">{selectedLetter.senderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">نوع نامه:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLetter.letterType === 'INTERNAL'
                      ? 'داخلی'
                      : selectedLetter.letterType === 'OUTGOING'
                      ? 'صادره'
                      : 'وارده'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">وضعیت مطالعه:</span>
                  <span className={`font-bold ${selectedLetter.isRead ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedLetter.isRead ? 'رویت شده ✓' : 'خوانده‌نشده'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تاریخ ثبت:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedLetter.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <h5 className="text-xs font-bold text-slate-400 mb-2">متن رسمی نامه:</h5>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedLetter.content}
                </p>
              </div>

              {/* Paraffs Section (Mizito Style) */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>✍️</span>
                    <span>پاراف‌ها و دستورات اداری</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    (طبق قوانین میزیتو، پاراف پس از رویت مخاطب قفل می‌گردد)
                  </span>
                </div>

                {/* Existing Paraffs List */}
                <div className="space-y-2">
                  {selectedLetter.paraffs && selectedLetter.paraffs.length > 0 ? (
                    selectedLetter.paraffs.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-slate-800">
                            پاراف توسط: {p.authorName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(p.createdAt).toLocaleDateString('fa-IR')}</span>
                            <button
                              onClick={() => onDeleteParaff(selectedLetter.id, p.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{p.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                      تاکنون هیچ پاراف یا دستوری بر روی این نامه ثبت نشده است.
                    </div>
                  )}
                </div>

                {/* Add Paraff Form */}
                <form onSubmit={handleAddParaffSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newParaffText}
                    onChange={(e) => setNewParaffText(e.target.value)}
                    placeholder="ثبت پاراف یا دستور اداری جدید..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newParaffText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                  >
                    ثبت پاراف
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">📄</span>
              <p>جهت مشاهده متن، پاراف‌ها و گردش نامه، یکی از نامه‌های کارتابل را انتخاب نمایید.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Letter Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>✉️</span>
                <span>نگارش و ارسال نامه سازمانی جدید</span>
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع نامه:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['INTERNAL', 'OUTGOING', 'INCOMING'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setComposeType(t)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        composeType === t
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {t === 'INTERNAL' ? 'داخلی' : t === 'OUTGOING' ? 'صادره' : 'وارده'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">موضوع نامه:</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="مثال: گزارش عملکرد سه‌ماهه یا پیش‌نویس قرارداد"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">گیرنده نامه (شناسه یا نام کاربر):</label>
                <input
                  type="text"
                  value={composeRecipient}
                  onChange={(e) => setComposeRecipient(e.target.value)}
                  placeholder="مثال: 22222222-2222-2222-2222-222222222222"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">فوریت:</label>
                  <select
                    value={composeUrgency}
                    onChange={(e: any) => setComposeUrgency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="NORMAL">عادی</option>
                    <option value="URGENT">فوری</option>
                    <option value="IMMEDIATE">آنی (خیلی فوری)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طبقه‌بندی:</label>
                  <select
                    value={composeClassification}
                    onChange={(e: any) => setComposeClassification(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="NORMAL">عادی</option>
                    <option value="CONFIDENTIAL">محرمانه</option>
                    <option value="SECRET">به کلی سری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">متن کامل نامه:</label>
                <textarea
                  rows={5}
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="متن اداری نامه و دستورات اجرایی..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition"
                >
                  {isSubmitting ? 'در حال صدور اندیکاتور...' : 'ثبت در دبیرخانه و ارسال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refer Letter Modal */}
      {isReferOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">ارجاع نامه اداری</h3>
              <button
                onClick={() => setIsReferOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شناسه یا نام همکار گیرنده:</label>
                <input
                  type="text"
                  value={referRecipientId}
                  onChange={(e) => setReferRecipientId(e.target.value)}
                  placeholder="مثال: 55555555-5555-5555-5555-555555555555"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دستور اقدام ارجاع:</label>
                <textarea
                  rows={3}
                  value={referInstruction}
                  onChange={(e) => setReferInstruction(e.target.value)}
                  placeholder="جهت بررسی و اقدام مقتضی تا پایان هفته..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReferOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !referRecipientId.trim() || !referInstruction.trim()}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition"
                >
                  ارسال ارجاع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
