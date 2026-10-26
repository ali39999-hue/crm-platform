'use client';

import React, { useState, useEffect } from 'react';
import type { CreateMentionRequest, MentionDto, MentionEntityType } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface MentionsInboxViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function MentionsInboxView({ onNotify }: MentionsInboxViewProps) {
  const [mentions, setMentions] = useState<MentionDto[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [loading, setLoading] = useState(true);

  // New Mention Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState<MentionEntityType>('TASK');
  const [sourceTitle, setSourceTitle] = useState('');
  const [contextSnippet, setContextSnippet] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMentions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getMentions();
      setMentions(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری منشن‌ها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentions();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const updated = await apiClient.markMentionAsRead(id);
      setMentions((prev) => prev.map((m) => (m.id === id ? updated : m)));
      onNotify?.('منشن به عنوان خوانده‌شده علامت‌گذاری شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در به‌روزرسانی منشن', 'error');
    }
  };

  const handleCreateMention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim() || !contextSnippet.trim()) return;

    try {
      setSubmitting(true);
      const req: CreateMentionRequest = {
        sourceEntityType: sourceType,
        sourceEntityId: `item-${Date.now()}`,
        sourceTitle: sourceTitle.trim(),
        recipientId: '22222222-2222-2222-2222-222222222222', // Current user
        contextSnippet: contextSnippet.trim(),
      };

      const created = await apiClient.createMention(req);
      setMentions((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setSourceTitle('');
      setContextSnippet('');
      onNotify?.('منشن جدید برای همکار ثبت شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت منشن', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const unreadCount = mentions.filter((m) => !m.readAt).length;

  const filteredMentions = mentions.filter((m) => {
    if (filter === 'UNREAD') return !m.readAt;
    return true;
  });

  const getEntityBadge = (type: MentionEntityType) => {
    switch (type) {
      case 'TASK':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">وظیفه (Task)</span>;
      case 'TICKET':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">تیکت (Ticket)</span>;
      case 'DOCUMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">سند (Doc)</span>;
      case 'DEAL':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800">معامله (Deal)</span>;
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4" data-testid="mentions-inbox-view">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>📢</span>
            <span>صندوق منشن‌ها و همکاری تیمی (Team Mentions & Collaboration)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            مشاهده ارجاعات، منشن‌های مستقیم همکاران (@نام) در وظایف، اسناد و تیکت‌ها
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg p-1 text-xs border border-slate-700">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-700 text-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              همه ({mentions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              data-testid="filter-unread-mentions"
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'UNREAD'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              خوانده‌نشده ({unreadCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            data-testid="create-mention-btn"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
          >
            <span>+</span>
            <span>ثبت منشن جدید</span>
          </button>
        </div>
      </div>

      {/* Mentions List */}
      <div className="space-y-3" data-testid="mentions-list">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">در حال بارگذاری منشن‌ها...</div>
        ) : filteredMentions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {filter === 'UNREAD' ? 'هیچ منشن خوانده‌نشده‌ای ندارید.' : 'منشنی یافت نشد.'}
          </div>
        ) : (
          filteredMentions.map((m) => (
            <div
              key={m.id}
              data-testid={`mention-item-${m.id}`}
              className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${
                !m.readAt
                  ? 'bg-indigo-950/30 border-indigo-700/60 shadow'
                  : 'bg-slate-900 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getEntityBadge(m.sourceEntityType)}
                  <strong className="text-xs text-slate-200">{m.sourceTitle}</strong>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">توسط {m.authorName}</span>
                  {!m.readAt && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-bold">
                      جدید
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                  {m.contextSnippet}
                </div>

                <div className="text-[11px] text-slate-500">
                  {new Date(m.createdAt).toLocaleDateString('fa-IR')} •{' '}
                  {new Date(m.createdAt).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {!m.readAt && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(m.id)}
                  data-testid={`read-mention-btn-${m.id}`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors whitespace-nowrap"
                >
                  ✓ علامت به عنوان خوانده‌شده
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Mention Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-mention-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">ثبت منشن و ارجاع تیمی</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMention} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نوع موجودیت</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as MentionEntityType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="TASK">وظیفه (Task)</option>
                  <option value="TICKET">تیکت پشتیبانی (Ticket)</option>
                  <option value="DOCUMENT">سند سازمانی (Document)</option>
                  <option value="DEAL">فرصت تجاری (Deal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">عنوان منبع *</label>
                <input
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="مثال: تسک TSK-1001 یا سند خط‌مشی"
                  data-testid="mention-source-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  متن پیام و ارجاع (@نام) *
                </label>
                <textarea
                  rows={4}
                  value={contextSnippet}
                  onChange={(e) => setContextSnippet(e.target.value)}
                  placeholder="مثال: @سارا لطفاً بخش سوم گزارش را قبل از جلسه بازبینی کن..."
                  data-testid="mention-context-textarea"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-mention-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'ارسال منشن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MentionsInboxView;
