'use client';

import React, { useState, useEffect } from 'react';
import type {
  CreateSupportMacroRequest,
  SupportMacroDto,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface SupportMacrosViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
  onApplyMacro?: ((content: string) => void) | undefined;
}

export function SupportMacrosView({ onNotify, onApplyMacro }: SupportMacrosViewProps) {
  const [macros, setMacros] = useState<SupportMacroDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [category, setCategory] = useState('عمومی');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMacros = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getSupportMacros();
      setMacros(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری قالب‌های پاسخ سریع', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMacros();
  }, []);

  const handleCreateMacro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      const tags = tagsStr
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const req: CreateSupportMacroRequest = {
        title: title.trim(),
        shortcut: shortcut.trim().replace(/^!/, '').toLowerCase() || 'macro',
        category: category.trim() || 'عمومی',
        content: content.trim(),
        tags,
      };

      const created = await apiClient.createSupportMacro(req);
      setMacros((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setShortcut('');
      setContent('');
      setTagsStr('');
      onNotify?.(`قالب پاسخ سریع «${created.title}» ایجاد شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد قالب پاسخ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMacro = async (m: SupportMacroDto) => {
    if (!window.confirm(`آیا از حذف قالب پاسخ «${m.title}» اطمینان دارید؟`)) return;

    try {
      await apiClient.deleteSupportMacro(m.id);
      setMacros((prev) => prev.filter((item) => item.id !== m.id));
      onNotify?.('قالب پاسخ با موفقیت حذف شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در حذف قالب پاسخ', 'error');
    }
  };

  const handleCopyOrInsert = (m: SupportMacroDto) => {
    if (onApplyMacro) {
      onApplyMacro(m.content);
      onNotify?.(`قالب «${m.title}» به متن پیام الصاق شد`, 'success');
    } else {
      navigator.clipboard.writeText(m.content);
      onNotify?.('متن قالب در کلیپ‌بورد کپی شد', 'success');
    }
  };

  const categories = ['ALL', ...Array.from(new Set(macros.map((m) => m.category)))];

  const filteredMacros = macros.filter((m) => {
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchShortcut = m.shortcut.toLowerCase().includes(q);
      const matchContent = m.content.toLowerCase().includes(q);
      const matchTags = m.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchShortcut && !matchContent && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4" data-testid="support-macros-view">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>💬</span>
            <span>قالب‌های پاسخ آماده و ماکروهای پشتیبانی (Canned Responses / Macros)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            صرفه‌جویی در زمان پاسخگویی به درخواست‌های تکراری با کلیدهای میانبر سریع و الگوهای تاییدشده
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          data-testid="create-macro-btn"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>تعریف ماکرو / پاسخ جدید</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
        <div className="flex gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-slate-100 font-bold'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'همه دسته‌ها' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در عنوان، کلید میانبر و متن پاسخ..."
          data-testid="search-macros-input"
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
        />
      </div>

      {/* Macros Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">در حال بارگذاری قالب‌ها...</div>
      ) : filteredMacros.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          هیچ قالب پاسخی با معیارهای جستجو یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="macros-grid">
          {filteredMacros.map((macro) => (
            <div
              key={macro.id}
              data-testid={`macro-card-${macro.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow transition-colors"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-xs text-slate-100">{macro.title}</h4>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    !{macro.shortcut}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-800/60 p-2.5 rounded-lg border border-slate-800/80 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {macro.content}
                </div>

                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    دسته: {macro.category}
                  </span>
                  {macro.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/40 text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleCopyOrInsert(macro)}
                  data-testid={`use-macro-btn-${macro.id}`}
                  className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                >
                  <span>📋</span>
                  <span>{onApplyMacro ? 'الصاق به گفتگو' : 'کپی متن'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMacro(macro)}
                  data-testid={`delete-macro-btn-${macro.id}`}
                  className="px-2 py-1 text-rose-400 hover:text-rose-300 text-[11px] transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Macro Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-macro-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">تعریف قالب پاسخ آماده جدید (Canned Macro)</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMacro} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  عنوان پاسخ آماده *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: پاسخ اولیه به درخواست‌های فنی"
                  data-testid="macro-title-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    کلید میانبر (Shortcut Tag) *
                  </label>
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
                    <span className="px-2.5 text-slate-400 text-xs font-mono">!</span>
                    <input
                      type="text"
                      value={shortcut}
                      onChange={(e) => setShortcut(e.target.value)}
                      placeholder="ack"
                      data-testid="macro-shortcut-input"
                      className="w-full py-2 bg-transparent text-slate-100 text-xs font-mono focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">دسته‌بندی</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="عمومی، مالی، فنی"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  متن پاسخ آماده *
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="متن پیام استاندارد را وارد کنید..."
                  data-testid="macro-content-textarea"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  برچسب‌ها (با کاما یا ویرگول جدا کنید)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="پشتیبانی، فوری، مالی"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
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
                  data-testid="submit-macro-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'ذخیره ماکرو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportMacrosView;
