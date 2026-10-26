'use client';

import React, { useState, useEffect } from 'react';
import type { ProjectCardDto, ProjectCardStage } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface CardsPipelineViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

const CARD_STAGES: Array<{ key: ProjectCardStage; title: string; color: string }> = [
  { key: 'DOCUMENTS_RECEIVED', title: 'دریافت مدارک و نیازمندی‌ها', color: '#6366f1' },
  { key: 'TECHNICAL_SETUP', title: 'پیکربندی و استقرار فنی', color: '#0ea5e9' },
  { key: 'USER_TRAINING', title: 'آموزش پرسنل و کاربران', color: '#f59e0b' },
  { key: 'FINAL_HANDOFF', title: 'تحویل موقت / صورتجلسه', color: '#10b981' },
  { key: 'SUPPORT_ACTIVE', title: 'پشتیبانی فعال دوره‌ای', color: '#8b5cf6' },
];

export function CardsPipelineView({ onNotify }: CardsPipelineViewProps) {
  const [cards, setCards] = useState<ProjectCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // New Card Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<ProjectCardStage>('DOCUMENTS_RECEIVED');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProjectCards();
      setCards(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری کاریز پروژه‌ها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: ProjectCardStage) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    setDraggedCardId(null);
    if (!cardId) return;

    await executeStageTransition(cardId, targetStage);
  };

  const executeStageTransition = async (cardId: string, stage: ProjectCardStage) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stage === stage) return;

    try {
      const updated = await apiClient.updateProjectCard(cardId, { stage });
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
      onNotify?.(`کارت «${card.title}» به مرحله ${getStageTitle(stage)} منتقل شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در جابجایی کارت پروژه', 'error');
    }
  };

  const handleCreateCard = async () => {
    if (!newTitle.trim()) return;

    try {
      const created = await apiClient.createProjectCard({
        title: newTitle.trim(),
        stage: newStage,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
        notes: newNotes.trim() || undefined,
        tags: ['پروژه پس از فروش'],
      });
      setCards((prev) => [created, ...prev]);
      onNotify?.(`کارت پروژه «${created.title}» ایجاد شد`, 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewNotes('');
      setNewDueDate('');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد کارت پروژه', 'error');
    }
  };

  const getStageTitle = (key: ProjectCardStage) => {
    return CARD_STAGES.find((s) => s.key === key)?.title || key;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        در حال بارگذاری کاریز کارت‌های پس از فروش...
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="cards-pipeline-view">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗂️</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              کاریز کارت‌ها و فرآیندهای پس از فروش (Didar Cards Pipeline)
            </h3>
            <p className="text-[11px] text-slate-400">
              پیگیری پروژه‌های اجرایی، استقرار و خدمات مشتریان پس از موفقیت معامله در کاریز فروش
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300">
            تعداد کل کارت‌های فعال: <strong>{cards.length}</strong>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            data-testid="create-project-card-btn"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow"
          >
            ➕ ایجاد کارت جدید
          </button>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
        {CARD_STAGES.map((st) => {
          const stageCards = cards.filter((c) => c.stage === st.key);

          return (
            <div
              key={st.key}
              data-testid={`card-stage-column-${st.key}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, st.key)}
              className="bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col min-w-[230px] max-h-[750px] shadow-sm"
            >
              {/* Header */}
              <div
                className="p-3 border-b border-slate-800 flex justify-between items-center text-xs rounded-t-xl"
                style={{ borderTop: `3px solid ${st.color}` }}
              >
                <span className="font-bold text-slate-200 truncate">{st.title}</span>
                <span className="text-[11px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono">
                  {stageCards.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {stageCards.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-800/80 rounded-lg text-slate-600 text-xs">
                    پروژه‌ای در این مرحله نیست
                  </div>
                ) : (
                  stageCards.map((card) => (
                    <article
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      data-testid={`project-card-${card.id}`}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-grab active:cursor-grabbing transition-all space-y-2 shadow"
                    >
                      <div className="font-bold text-xs text-slate-100 line-clamp-2">
                        {card.title}
                      </div>

                      {card.accountName && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>🏢 شرکت:</span>
                          <span className="font-semibold text-slate-300">{card.accountName}</span>
                        </div>
                      )}

                      {card.dueDate && (
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>سررسید تحویل:</span>
                          <span className="font-mono text-sky-400">
                            {new Date(card.dueDate).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      )}

                      {/* Stage Selector */}
                      <div className="pt-1 border-t border-slate-700/40 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">انتقال مرحله:</span>
                        <select
                          value={card.stage}
                          onChange={(e) =>
                            executeStageTransition(card.id, e.target.value as ProjectCardStage)
                          }
                          aria-label={`تغییر مرحله کارت ${card.title}`}
                          className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[10px]"
                        >
                          {CARD_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-sm font-bold text-slate-100">
              <span>🗂️</span>
              <h4>ایجاد کارت جدید در کاریز خدمات پس از فروش</h4>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">عنوان پروژه یا خدمت:</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: استقرار نرم‌افزار و آموزش تیم کارفرما"
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">مرحله اولیه در کاریز:</label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as ProjectCardStage)}
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
              >
                {CARD_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">تاریخ سررسید تحویل تعهدشده:</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">یادداشت‌ها و تعهدات اجرایی:</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                placeholder="اطلاعات تحویل و نیازمندی‌های مشتری..."
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateCard}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-bold"
              >
                ثبت کارت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardsPipelineView;
