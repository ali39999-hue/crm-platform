'use client';

import React, { useState } from 'react';
import type {
  CreateDocumentRequest,
  DocumentSpaceDto,
  DocumentVisibility,
} from '@crm/contracts';

interface CreateDocumentModalProps {
  spaces: DocumentSpaceDto[];
  selectedSpaceId?: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateDocumentRequest) => Promise<void>;
}

export function CreateDocumentModal({
  spaces,
  selectedSpaceId,
  isOpen,
  onClose,
  onSubmit,
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState(selectedSpaceId || spaces[0]?.id || '');
  const [visibility, setVisibility] = useState<DocumentVisibility>('WORKSPACE');
  const [isPublished, setIsPublished] = useState(true);
  const [tagsStr, setTagsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('عنوان سند الزامی است.');
      return;
    }
    if (!spaceId) {
      setError('انتخاب فضای سند الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const tags = tagsStr
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        spaceId,
        title: title.trim(),
        content: content.trim(),
        visibility,
        isPublished,
        tags,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت سند جدید');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      data-testid="create-document-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📄</span>
            <span>ایجاد سند یا مقاله جدید در پایگاه دانش</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 bg-red-950/80 border border-red-800 text-red-200 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              عنوان سند *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: راهنمای گام‌به‌گام استقرار سامانه‌ها"
              data-testid="doc-title-input"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                فضای سند (Space) *
              </label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                data-testid="doc-space-select"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {spaces.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                سطح دسترسی و محرمانگی (Visibility) *
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
                data-testid="doc-visibility-select"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WORKSPACE">سازمانی (قابل مشاهده برای همه کارکنان)</option>
                <option value="TEAM">تیمی (ویژه تیم مربوطه)</option>
                <option value="CUSTOMER_VISIBLE">
                  پورتال مشتریان (قابل مشاهده برای مشتریان مجاز)
                </option>
                <option value="PRIVATE">خصوصی (فقط نویسنده و مدیر ارشد)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              برچسب‌ها (با کاما یا ویرگول فارسی جدا کنید)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="امنیت، راهنما، پایگاه‌دانش"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              محتوای سند (Markdown پشتیبانی می‌شود)
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# عنوان بخش اول&#10;متن دستورالعمل و توضیحات را در این قسمت وارد کنید..."
              data-testid="doc-content-textarea"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublishedCheck"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
            />
            <label htmlFor="isPublishedCheck" className="text-sm text-slate-300 cursor-pointer">
              انتشار عمومی (سند فوراً منتشر شده و از حالت پیش‌نویس خارج شود)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="doc-submit-btn"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow transition-colors flex items-center gap-2"
            >
              {submitting ? 'در حال ثبت...' : 'ایجاد و ذخیره سند'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
