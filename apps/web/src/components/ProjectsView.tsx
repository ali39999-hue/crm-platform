'use client';

import React, { useState, useEffect } from 'react';
import type {
  CreateMilestoneRequest,
  CreateProjectRequest,
  ProjectDetailDto,
  ProjectHealth,
  ProjectStatus,
  ProjectSummaryDto,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface ProjectsViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function ProjectsView({ onNotify }: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [health, setHealth] = useState<ProjectHealth>('ON_TRACK');
  const [targetDate, setTargetDate] = useState('۱۴۰۵/۰۹/۳۰');
  const [submitting, setSubmitting] = useState(false);

  // Add Milestone Form
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProjects();
      setProjects(res);
      if (res.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res[0]!.id);
      }
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری پروژه‌ها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectDetail(null);
      return;
    }
    let active = true;
    apiClient
      .getProjectDetail(selectedProjectId)
      .then((detail) => {
        if (active) setSelectedProjectDetail(detail);
      })
      .catch((err) => {
        if (active) onNotify?.(err?.message || 'خطا در دریافت جزئیات پروژه', 'error');
      });

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !name.trim()) return;

    try {
      setSubmitting(true);
      const req: CreateProjectRequest = {
        key: key.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        health,
        targetDate: targetDate.trim() || undefined,
      };

      const created = await apiClient.createProject(req);
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      setIsCreateOpen(false);
      setKey('');
      setName('');
      setDescription('');
      onNotify?.(`پروژه «${created.name}» با کلید ${created.key} ایجاد شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد پروژه', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newMilestoneTitle.trim()) return;

    try {
      setAddingMilestone(true);
      const ms = await apiClient.addProjectMilestone(selectedProjectId, {
        title: newMilestoneTitle.trim(),
        dueDate: newMilestoneDate || new Date().toISOString(),
      });

      if (selectedProjectDetail) {
        const nextMilestones = [...selectedProjectDetail.milestones, ms];
        const comp = nextMilestones.filter((m) => m.isCompleted).length;
        const progress = Math.round((comp / nextMilestones.length) * 100);

        setSelectedProjectDetail({
          ...selectedProjectDetail,
          milestones: nextMilestones,
          milestonesCount: nextMilestones.length,
          progressPercent: progress,
        });
      }

      setNewMilestoneTitle('');
      setNewMilestoneDate('');
      onNotify?.('مرحله/مایل‌استون جدید به پروژه اضافه شد', 'success');
      loadProjects();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در افزودن مایل‌استون', 'error');
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
    if (!selectedProjectId) return;

    try {
      const nextStatus = !currentStatus;
      await apiClient.toggleProjectMilestone(selectedProjectId, milestoneId, nextStatus);

      if (selectedProjectDetail) {
        const nextMilestones = selectedProjectDetail.milestones.map((m) =>
          m.id === milestoneId ? { ...m, isCompleted: nextStatus } : m,
        );
        const comp = nextMilestones.filter((m) => m.isCompleted).length;
        const progress = Math.round((comp / nextMilestones.length) * 100);

        setSelectedProjectDetail({
          ...selectedProjectDetail,
          milestones: nextMilestones,
          progressPercent: progress,
        });
      }

      onNotify?.('وضعیت مایل‌استون به‌روزرسانی شد', 'success');
      loadProjects();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تغییر وضعیت مایل‌استون', 'error');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const getHealthBadge = (healthVal: ProjectHealth) => {
    switch (healthVal) {
      case 'ON_TRACK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            🟢 طبق برنامه (On Track)
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
            🟡 در معرض ریسک (At Risk)
          </span>
        );
      case 'OFF_TRACK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
            🔴 نیازمند مداخله (Off Track)
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (statusVal: ProjectStatus) => {
    switch (statusVal) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">در حال اجرا</span>;
      case 'PLANNING':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">برنامه‌ریزی</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">تکمیل‌شده</span>;
      case 'ON_HOLD':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">متوقف‌شده</span>;
      default:
        return statusVal;
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden"
      data-testid="projects-workspace"
    >
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📁</span>
            <span>پروژه‌ها و مدیریت اهداف سازمانی (Projects & Milestones)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            برنامه‌ریزی، پیگیری مایل‌استون‌ها، درصد پیشرفت واقعی و پایش سلامت پروژه‌ها
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          data-testid="create-project-btn"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>تعریف پروژه جدید</span>
        </button>
      </header>

      {/* Main 2-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Projects List */}
        <section className="w-96 border-l border-slate-800 bg-slate-900/30 flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-800 flex gap-1.5 text-xs">
            {['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-700 text-slate-100 font-bold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {s === 'ALL'
                  ? 'همه'
                  : s === 'ACTIVE'
                    ? 'فعال'
                    : s === 'PLANNING'
                      ? 'طرح اولیه'
                      : 'تکمیل‌شده'}
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                در حال بارگذاری پروژه‌ها...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">پروژه‌ای یافت نشد.</div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = selectedProjectId === p.id;
                return (
                  <article
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    data-testid={`project-card-${p.id}`}
                    className={`p-4 rounded-xl cursor-pointer border transition-all text-right space-y-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-600/70 shadow'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-xs text-indigo-400 font-bold">{p.key}</span>
                      <div className="flex gap-1.5">{getHealthBadge(p.health)}</div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 line-clamp-2">{p.name}</h3>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>پیشرفت فازها:</span>
                        <strong className="text-slate-200">{p.progressPercent}٪</strong>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(p.progressPercent, 4)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>{getStatusBadge(p.status)}</span>
                      <span>{p.milestonesCount} مایل‌استون</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Project Detail & Milestones */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedProjectDetail ? (
            <div className="py-24 text-center text-slate-500 text-sm">
              یک پروژه را برای مشاهده اهداف و مایل‌استون‌ها انتخاب کنید.
            </div>
          ) : (
            <>
              {/* Project Hero Detail */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-indigo-400 font-bold">
                      {selectedProjectDetail.key}
                    </span>
                    <h3
                      className="text-xl font-bold text-slate-100"
                      data-testid="selected-project-title"
                    >
                      {selectedProjectDetail.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {getHealthBadge(selectedProjectDetail.health)}
                    {getStatusBadge(selectedProjectDetail.status)}
                  </div>
                </div>

                {selectedProjectDetail.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedProjectDetail.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">مالک پروژه:</span>
                    <strong className="text-slate-200">{selectedProjectDetail.ownerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">تاریخ هدف اتمام:</span>
                    <strong className="text-slate-200">
                      {selectedProjectDetail.targetDate || '۱۴۰۵/۰۹/۳۰'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">مشتری مرتبط:</span>
                    <strong className="text-slate-200">
                      {selectedProjectDetail.associatedAccountName || 'داخلی'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">درصد تحقق:</span>
                    <strong className="text-indigo-400 font-bold">
                      {selectedProjectDetail.progressPercent}٪
                    </strong>
                  </div>
                </div>
              </div>

              {/* Milestones & Sprint Cycles */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <span>🎯</span>
                    <span>اهداف کلیدی و مایل‌استون‌های پروژه (Project Milestones)</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    {selectedProjectDetail.milestones.filter((m) => m.isCompleted).length} از{' '}
                    {selectedProjectDetail.milestones.length} هدف محقق شده
                  </span>
                </h4>

                {/* Milestones List */}
                <div className="space-y-2" data-testid="milestones-list">
                  {selectedProjectDetail.milestones.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      هنوز مایل‌استونی برای این پروژه تعریف نشده است.
                    </div>
                  ) : (
                    selectedProjectDetail.milestones.map((ms) => (
                      <div
                        key={ms.id}
                        data-testid={`milestone-item-${ms.id}`}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                          ms.isCompleted
                            ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                            : 'bg-slate-800/80 border-slate-700/70 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={ms.isCompleted}
                            onChange={() => handleToggleMilestone(ms.id, ms.isCompleted)}
                            data-testid={`milestone-check-${ms.id}`}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span
                            className={`text-xs font-medium ${
                              ms.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                            }`}
                          >
                            {ms.title}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          سررسید: {new Date(ms.dueDate).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Milestone Form */}
                <form
                  onSubmit={handleAddMilestone}
                  className="flex gap-2 pt-3 border-t border-slate-800/80"
                >
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="عنوان هدف یا مایل‌استون جدید..."
                    data-testid="new-milestone-input"
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={addingMilestone}
                    data-testid="add-milestone-btn"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                  >
                    {addingMilestone ? '...' : '+ ثبت مایل‌استون'}
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-project-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">تعریف پروژه سازمانی جدید</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">کلید پروژه *</label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="PRJ-PORTAL"
                    data-testid="project-key-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    وضعیت اولیه *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">در حال اجرا (ACTIVE)</option>
                    <option value="PLANNING">برنامه‌ریزی (PLANNING)</option>
                    <option value="ON_HOLD">متوقف‌شده (ON_HOLD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نام و عنوان پروژه *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: پیاده‌سازی زیرساخت گزارش‌گیری بلادرنگ"
                  data-testid="project-name-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">شرح و اهداف پروژه</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات و نیازمندی‌های کلیدی پروژه..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">سلامت پروژه</label>
                  <select
                    value={health}
                    onChange={(e) => setHealth(e.target.value as ProjectHealth)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ON_TRACK">🟢 طبق برنامه (On Track)</option>
                    <option value="AT_RISK">🟡 در معرض ریسک (At Risk)</option>
                    <option value="OFF_TRACK">🔴 نیازمند مداخله (Off Track)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">تاریخ هدف اتمام</label>
                  <input
                    type="text"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    placeholder="۱۴۰۵/۱۰/۱۵"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-project-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'ایجاد پروژه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsView;
