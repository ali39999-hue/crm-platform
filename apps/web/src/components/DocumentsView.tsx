'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type {
  DocumentDetailDto,
  DocumentSpaceDto,
  DocumentSummaryDto,
  DocumentVisibility,
} from '@crm/contracts';
import { CreateDocumentModal } from './CreateDocumentModal';
import { apiClient } from '../lib/api-client';

interface DocumentsViewProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  isCustomerPortal?: boolean;
}

export function DocumentsView({ onNotify, isCustomerPortal = false }: DocumentsViewProps) {
  const [spaces, setSpaces] = useState<DocumentSpaceDto[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all');
  const [documents, setDocuments] = useState<DocumentSummaryDto[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<DocumentDetailDto | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<DocumentVisibility>('WORKSPACE');
  const [editIsPublished, setEditIsPublished] = useState(true);
  const [editSummaryChange, setEditSummaryChange] = useState('');
  const [saving, setSaving] = useState(false);

  const client = apiClient;

  // Load spaces and documents
  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedSpaces, loadedDocs] = await Promise.all([
        client.getSpaces(),
        client.getDocuments(),
      ]);

      const visibleDocs = isCustomerPortal
        ? loadedDocs.filter((d) => d.visibility === 'CUSTOMER_VISIBLE' && d.isPublished !== false)
        : loadedDocs;

      const visibleSpaces = isCustomerPortal
        ? loadedSpaces.filter((s) => visibleDocs.some((d) => d.spaceId === s.id))
        : loadedSpaces;

      setSpaces(visibleSpaces);
      setDocuments(visibleDocs);

      if (visibleDocs.length > 0 && (!selectedDocId || !visibleDocs.some((d) => d.id === selectedDocId))) {
        setSelectedDocId(visibleDocs[0]!.id);
      } else if (visibleDocs.length === 0) {
        setSelectedDocId(null);
      }
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری اسناد', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isCustomerPortal]);

  // Fetch document detail when selected
  useEffect(() => {
    if (!selectedDocId) {
      setSelectedDocDetail(null);
      return;
    }

    let active = true;
    client
      .getDocumentDetail(selectedDocId)
      .then((detail) => {
        if (active) {
          if (isCustomerPortal && (detail.visibility !== 'CUSTOMER_VISIBLE' || !detail.isPublished)) {
            setSelectedDocDetail(null);
            return;
          }
          setSelectedDocDetail(detail);
          setEditTitle(detail.title);
          setEditContent(detail.content);
          setEditVisibility(detail.visibility);
          setEditIsPublished(detail.isPublished);
          setEditSummaryChange('');
          setIsEditMode(false);
        }
      })
      .catch((err) => {
        if (active) {
          onNotify?.(err?.message || 'خطا در بارگذاری جزئیات سند', 'error');
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDocId, isCustomerPortal]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (isCustomerPortal && (doc.visibility !== 'CUSTOMER_VISIBLE' || doc.isPublished === false)) {
        return false;
      }
      if (selectedSpaceId !== 'all' && doc.spaceId !== selectedSpaceId) return false;
      if (visibilityFilter !== 'all' && doc.visibility !== visibilityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchTags) return false;
      }
      return true;
    });
  }, [documents, selectedSpaceId, visibilityFilter, searchQuery, isCustomerPortal]);

  const handleCreateDocument = async (dto: any) => {
    try {
      const created = await client.createDocument(dto);
      onNotify?.(`سند «${created.title}» با موفقیت ایجاد شد`, 'success');
      await loadData();
      setSelectedDocId(created.id);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد سند', 'error');
      throw err;
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocDetail) return;

    try {
      setSaving(true);
      const updated = await client.updateDocument(selectedDocDetail.id, {
        title: editTitle.trim(),
        content: editContent,
        visibility: editVisibility,
        isPublished: editIsPublished,
        summaryChange: editSummaryChange.trim() || undefined,
        expectedVersion: selectedDocDetail.version,
      });

      setSelectedDocDetail(updated);
      setIsEditMode(false);
      onNotify?.('تغییرات سند ذخیره و نسخه جدید ثبت شد', 'success');
      await loadData();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در به‌روزرسانی سند', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRevision = async (version: number) => {
    if (!selectedDocDetail) return;
    if (
      !window.confirm(
        `آیا از بازگردانی محتوای سند به نسخه ${version} اطمینان دارید؟ نسخه فعلی به عنوان نسخه جدید حفظ خواهد شد.`,
      )
    ) {
      return;
    }

    try {
      const restored = await client.restoreDocumentRevision(
        selectedDocDetail.id,
        version,
        `بازگردانی خودکار به نسخه ${version}`,
      );
      setSelectedDocDetail(restored);
      setShowRevisions(false);
      onNotify?.(`سند با موفقیت به محتوای نسخه ${version} بازگردانده شد`, 'success');
      await loadData();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بازگردانی نسخه', 'error');
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocDetail) return;
    if (!window.confirm(`آیا از حذف دائم سند «${selectedDocDetail.title}» مطمئن هستید؟`)) {
      return;
    }

    try {
      await client.deleteDocument(selectedDocDetail.id);
      onNotify?.('سند با موفقیت حذف شد', 'success');
      setSelectedDocDetail(null);
      setSelectedDocId(null);
      await loadData();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در حذف سند', 'error');
    }
  };

  const getVisibilityBadge = (vis: DocumentVisibility) => {
    switch (vis) {
      case 'WORKSPACE':
        return (
          <span className="px-2 py-0.5 text-xs rounded font-medium bg-blue-950/80 text-blue-300 border border-blue-800">
            سازمانی
          </span>
        );
      case 'CUSTOMER_VISIBLE':
        return (
          <span className="px-2 py-0.5 text-xs rounded font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            پورتال مشتریان
          </span>
        );
      case 'TEAM':
        return (
          <span className="px-2 py-0.5 text-xs rounded font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
            تیمی
          </span>
        );
      case 'PRIVATE':
        return (
          <span className="px-2 py-0.5 text-xs rounded font-medium bg-rose-950/80 text-rose-300 border border-rose-800">
            خصوصی
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100" data-testid="documents-workspace">
      {/* Top Header / Actions Bar */}
      <header className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>📚</span>
            <span>پایگاه دانش، مستندات و همکاری سازمانی</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مدیریت دانش، فرآیندها، راهنماهای مشتریان و تاریخچه نسخه‌ها با ایزولاسیون کامل دسترسی
          </p>
        </div>

        {!isCustomerPortal && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="create-doc-btn"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow"
            >
              <span>+</span>
              <span>سند یا مقاله جدید</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Layout: 3 Columns (Spaces sidebar, Documents list, Detail / Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Spaces Tree Sidebar */}
        <aside className="w-64 border-l border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            فضاهای کاری (Spaces)
          </div>

          <button
            type="button"
            onClick={() => setSelectedSpaceId('all')}
            className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
              selectedSpaceId === 'all'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-700/50'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📁</span>
              <span>همه فضاها</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {documents.length}
            </span>
          </button>

          {spaces.map((space) => {
            const count = documents.filter((d) => d.spaceId === space.id).length;
            const isSelected = selectedSpaceId === space.id;
            return (
              <button
                key={space.id}
                type="button"
                onClick={() => setSelectedSpaceId(space.id)}
                className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-700/50'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{space.icon === 'globe' ? '🌐' : '📖'}</span>
                  <span className="truncate">{space.name}</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Column 2: Documents List with Filter & Search */}
        <section className="w-80 border-l border-slate-800 bg-slate-900/20 flex flex-col overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <input
              type="text"
              placeholder="جستجو در عناوین و برچسب‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {!isCustomerPortal && (
              <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
                {['all', 'WORKSPACE', 'CUSTOMER_VISIBLE', 'PRIVATE'].map((vis) => (
                  <button
                    key={vis}
                    type="button"
                    onClick={() => setVisibilityFilter(vis)}
                    className={`px-2 py-1 rounded whitespace-nowrap transition-colors ${
                      visibilityFilter === vis
                        ? 'bg-slate-700 text-slate-100 font-medium'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {vis === 'all'
                      ? 'همه'
                      : vis === 'WORKSPACE'
                        ? 'سازمانی'
                        : vis === 'CUSTOMER_VISIBLE'
                          ? 'مشتریان'
                          : 'خصوصی'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Documents Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {filteredDocs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                هیچ سندی با معیارهای فیلتر یافت نشد.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <article
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    data-testid={`document-item-${doc.id}`}
                    className={`p-3 rounded-lg cursor-pointer transition-colors text-right ${
                      isSelected
                        ? 'bg-indigo-950/40 border border-indigo-700/60 text-slate-100 shadow-sm'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-2">{doc.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {getVisibilityBadge(doc.visibility)}
                      <span className="text-[11px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                        نسخه {doc.version}
                      </span>
                      {doc.spaceName && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                          {doc.spaceName}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{doc.authorName}</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Column 3: Document Content Viewer & Markdown Editor */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              در حال بارگذاری اطلاعات سند...
            </div>
          ) : !selectedDocDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 p-6 text-center">
              <span className="text-4xl">📄</span>
              <p className="text-sm">سندی انتخاب نشده است. از لیست سمت راست یک سند را انتخاب کنید.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Document Header */}
              <header className="p-6 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{selectedDocDetail.spaceName || 'پایگاه دانش'}</span>
                    <span>/</span>
                    <span className="font-mono">{selectedDocDetail.slug}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100" data-testid="selected-doc-title">
                    {selectedDocDetail.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>نویسنده: {selectedDocDetail.authorName}</span>
                    <span>•</span>
                    <span>نسخه فعال: {selectedDocDetail.version}</span>
                    <span>•</span>
                    {getVisibilityBadge(selectedDocDetail.visibility)}
                  </div>
                </div>

                {!isCustomerPortal && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisions(!showRevisions)}
                      data-testid="revisions-toggle-btn"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <span>⏱️</span>
                      <span>تاریخچه ویرایش‌ها ({selectedDocDetail.revisions?.length || 1})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditMode(!isEditMode)}
                      data-testid="edit-doc-btn"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <span>{isEditMode ? 'انصراف از ویرایش' : 'ویرایش سند'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteDocument}
                      className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-medium transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </header>

              {/* Document Body: Viewer or Edit Form */}
              <div className="flex-1 overflow-y-auto p-8">
                {isEditMode ? (
                  <form onSubmit={handleUpdateDocument} className="max-w-4xl mx-auto space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        عنوان سند
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          سطح دسترسی
                        </label>
                        <select
                          value={editVisibility}
                          onChange={(e) => setEditVisibility(e.target.value as DocumentVisibility)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="WORKSPACE">سازمانی (همگانی)</option>
                          <option value="TEAM">تیمی</option>
                          <option value="CUSTOMER_VISIBLE">پورتال مشتریان</option>
                          <option value="PRIVATE">خصوصی</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          خلاصه تغییرات این ویرایش
                        </label>
                        <input
                          type="text"
                          value={editSummaryChange}
                          onChange={(e) => setEditSummaryChange(e.target.value)}
                          placeholder="مثال: اصلاح بخش سیاست‌های امنیتی و رفع غلط املایی"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        محتوا (Markdown)
                      </label>
                      <textarea
                        rows={16}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        data-testid="edit-doc-textarea"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        data-testid="save-doc-btn"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow"
                      >
                        {saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات و ثبت نسخه جدید'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="max-w-4xl mx-auto prose prose-invert prose-indigo">
                    <div
                      data-testid="document-content-view"
                      className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed text-sm md:text-base space-y-4"
                    >
                      {selectedDocDetail.content}
                    </div>
                  </div>
                )}
              </div>

              {/* Revisions History Drawer */}
              {showRevisions && (
                <div
                  data-testid="revisions-drawer"
                  className="absolute top-0 bottom-0 left-0 w-80 bg-slate-900/95 border-r border-slate-800 p-4 shadow-2xl flex flex-col z-20 backdrop-blur"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                      <span>⏱️</span>
                      <span>تاریخچه ویرایش‌ها</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowRevisions(false)}
                      className="text-slate-400 hover:text-slate-200 text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {selectedDocDetail.revisions?.map((rev) => (
                      <div
                        key={rev.id}
                        data-testid={`revision-item-${rev.version}`}
                        className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-400">نسخه {rev.version}</span>
                          <span className="text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>

                        <p className="text-slate-300 font-medium">{rev.summaryChange || 'بدون توضیح'}</p>

                        <div className="text-slate-400 text-[11px]">نویسنده: {rev.authorName}</div>

                        {rev.version !== selectedDocDetail.version && (
                          <button
                            type="button"
                            onClick={() => handleRestoreRevision(rev.version)}
                            data-testid={`restore-btn-${rev.version}`}
                            className="w-full mt-2 py-1 px-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded text-center transition-colors font-medium"
                          >
                            بازگردانی به این نسخه
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        spaces={spaces}
        selectedSpaceId={selectedSpaceId !== 'all' ? selectedSpaceId : undefined}
        onSubmit={handleCreateDocument}
      />
    </div>
  );
}
