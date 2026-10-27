'use client';

import React, { useState } from 'react';
import type {
  MeetingMinuteDto,
  CreateMeetingMinuteRequest,
  SignatureStatus,
  ConvertResolutionToTaskRequest,
} from '../lib/api-client';

interface MeetingMinutesViewProps {
  meetings: MeetingMinuteDto[];
  currentUserToken: string;
  onRefresh: () => void;
  onCreateMeeting: (dto: CreateMeetingMinuteRequest) => Promise<void>;
  onSignMeeting: (meetingId: string, status: SignatureStatus) => Promise<void>;
  onConvertResolution: (
    meetingId: string,
    resolutionId: string,
    dto: ConvertResolutionToTaskRequest,
  ) => Promise<void>;
}

export function MeetingMinutesView({
  meetings,
  currentUserToken,
  onRefresh,
  onCreateMeeting,
  onSignMeeting,
  onConvertResolution,
}: MeetingMinutesViewProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinuteDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New meeting form states
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [attendeesRaw, setAttendeesRaw] = useState('');
  const [resolutionsRaw, setResolutionsRaw] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !agenda.trim() || !startsAt) {
      setErrorMsg('لطفاً عنوان جلسه، دستور جلسه و تاریخ شروع را وارد نمایید.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Parse attendees (one per line: Name, Role)
      const attendees = attendeesRaw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const parts = line.split(',');
          return {
            userId: `usr-${idx + 1}`,
            name: parts[0]?.trim() || `عضو ${idx + 1}`,
            role: (parts[1]?.trim().toUpperCase() as any) || 'MEMBER',
          };
        });

      if (attendees.length === 0) {
        attendees.push({
          userId: currentUserToken,
          name: 'شما (دبیر جلسه)',
          role: 'SECRETARY',
        });
      }

      // Parse resolutions (one per line: Title, DueDays)
      const resolutions = resolutionsRaw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(',');
          const days = Number(parts[1]?.trim()) || 7;
          return {
            title: parts[0]?.trim() || line,
            assigneeId: currentUserToken,
            dueAt: new Date(Date.now() + 86400000 * days).toISOString(),
          };
        });

      await onCreateMeeting({
        title: title.trim(),
        agenda: agenda.trim(),
        startsAt: new Date(startsAt).toISOString(),
        location: location.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        attendees,
        resolutions,
      });

      setIsCreateOpen(false);
      setTitle('');
      setAgenda('');
      setStartsAt('');
      setLocation('');
      setMeetingUrl('');
      setAttendeesRaw('');
      setResolutionsRaw('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت صورتجلسه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSign = async (meetingId: string, status: SignatureStatus) => {
    setIsSubmitting(true);
    try {
      await onSignMeeting(meetingId, status);
      onRefresh();
      const updated = meetings.find((m) => m.id === meetingId);
      if (updated) setSelectedMeeting(updated);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت امضا');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async (meetingId: string, resolutionId: string) => {
    setIsSubmitting(true);
    try {
      await onConvertResolution(meetingId, resolutionId, {});
      onRefresh();
      const updated = meetings.find((m) => m.id === meetingId);
      if (updated) setSelectedMeeting(updated);
    } catch (err: any) {
      alert(err.message || 'خطا در تبدیل مصوبه به وظیفه');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-black text-slate-800">
              صورتجلسات دیجیتال و پیگیری مصوبات (مدل سازمانی میزیتو)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ثبت نشست‌های رسمی، حاضرین و غایبین، فرآیند امضای دیجیتال و تبدیل خودکار مصوبه به تسک در کارتابل
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>ثبت صورتجلسه سازمانی جدید</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Meetings List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meetings List */}
        <div className="lg:col-span-5 space-y-3">
          {meetings.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              هیچ صورتجلسه‌ای ثبت نشده است.
            </div>
          ) : (
            meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMeeting(m)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedMeeting?.id === m.id
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    📅 {new Date(m.startsAt).toLocaleDateString('fa-IR')}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {m.status === 'COMPLETED' ? 'برگزار شده ✓' : 'برنامه‌ریزی‌شده'}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">
                  {m.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  دستور جلسه: {m.agenda}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>👥 {m.attendees.length} نفر حاضر</span>
                  <span>⚡ {m.resolutions.length} مصوبه</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Meeting Detail */}
        <div className="lg:col-span-7">
          {selectedMeeting ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Meeting Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    تاریخ برگزاری: {new Date(selectedMeeting.startsAt).toLocaleDateString('fa-IR')}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    {selectedMeeting.title}
                  </h3>
                  {selectedMeeting.location && (
                    <p className="text-xs text-slate-500 mt-1">
                      محل برگزاری: {selectedMeeting.location}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSign(selectedMeeting.id, 'SIGNED')}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>✍️</span>
                    <span>تایید و امضای رسمی</span>
                  </button>
                  <button
                    onClick={() => handleSign(selectedMeeting.id, 'REJECTED')}
                    className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                  >
                    عدم تایید
                  </button>
                </div>
              </div>

              {/* Agenda Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h5 className="text-xs font-bold text-slate-400 mb-1">دستور جلسه و اهداف:</h5>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {selectedMeeting.agenda}
                </p>
              </div>

              {/* Attendees & Signature Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>👥</span>
                  <span>حاضرین و وضعیت امضای دیجیتال</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedMeeting.attendees.map((a) => (
                    <div
                      key={a.userId}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-800 block">{a.name}</strong>
                        <span className="text-[10px] text-slate-400">
                          {a.role === 'CHAIR'
                            ? 'رئیس جلسه'
                            : a.role === 'SECRETARY'
                            ? 'دبیر جلسه'
                            : a.role === 'GUEST'
                            ? 'مهمان خارج سازمان'
                            : 'عضو'}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.signatureStatus === 'SIGNED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : a.signatureStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {a.signatureStatus === 'SIGNED'
                          ? 'امضا شد ✓'
                          : a.signatureStatus === 'REJECTED'
                          ? 'رد شد ✕'
                          : 'در انتظار امضا ⏳'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolutions (مصوبات جلسه) */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>⚡</span>
                    <span>بندهای مصوب جلسه (اقدامات بعدی)</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    قابلیت تبدیل مستقیم مصوبه به تسک در پروژه
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedMeeting.resolutions.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-sm">{r.title}</p>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>مسئول اقدام: {r.assigneeName || 'همکار مسئول'}</span>
                          {r.dueAt && (
                            <span>مهلت: {new Date(r.dueAt).toLocaleDateString('fa-IR')}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        {r.status === 'CONVERTED_TO_TASK' ? (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs flex items-center gap-1">
                            <span>✓</span>
                            <span>تبدیل شده به تسک</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConvert(selectedMeeting.id, r.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1 shadow-sm"
                          >
                            <span>⚡</span>
                            <span>ارجاع خودکار به کارتابل وظایف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">📋</span>
              <p>جهت بازبینی مصوبات، امضای صورتجلسه و ارجاع اقدامات، یک جلسه را انتخاب کنید.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Meeting Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>📝</span>
                <span>ثبت صورتجلسه سازمانی جدید</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان جلسه:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: جلسه کمیته راهبری پروژه یا مذاکرات خرید"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دستور جلسه و مباحث مطرح‌شده:</label>
                <textarea
                  rows={3}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="اهداف نشست و خلاصه مذاکرات صورت گرفته..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">زمان شروع:</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">محل برگزاری:</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="اتاق جلسات / آنلاین"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  حاضرین (هر خط یک نفر: نام، سمت مانند CHAIR, MEMBER, GUEST):
                </label>
                <textarea
                  rows={3}
                  value={attendeesRaw}
                  onChange={(e) => setAttendeesRaw(e.target.value)}
                  placeholder="علی مدیر, CHAIR&#10;سارا احمدی, SECRETARY&#10;مهندس رضایی, GUEST"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مصوبات جلسه (هر خط یک مصوبه: عنوان مصوبه، مهلت انجام به روز):
                </label>
                <textarea
                  rows={3}
                  value={resolutionsRaw}
                  onChange={(e) => setResolutionsRaw(e.target.value)}
                  placeholder="تهیه گزارش مالی پروژه, 5&#10;پیاده‌سازی ویژگی اتصال به کالرآیدی, 7"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت صورتجلسه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
