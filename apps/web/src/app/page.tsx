'use client';

import React, { useState } from 'react';
import type { TaskPriority, TaskStatus, TaskSummary } from '@crm/contracts';
import { canTransitionTask } from '@crm/domain';

type AuditItem = {
  id: string;
  action: string;
  actor: string;
  entity: string;
  time: string;
  details: string;
};

const INITIAL_TASKS: TaskSummary[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    key: 'TSK-1001',
    title: 'بررسی مدارک و اعتبارسنجی قرارداد مشتری جدید',
    status: 'TODO',
    priority: 'HIGH',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    projectId: null,
    dueAt: '۱۴۰۵/۰۸/۰۴',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    key: 'TSK-1002',
    title: 'پیاده‌سازی تست‌های امنیتی احراز هویت و مجوزها',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    projectId: null,
    dueAt: '۱۴۰۵/۰۸/۰۲',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    key: 'TSK-1003',
    title: 'بازبینی معماری پایگاه داده و شاخص‌گذاری جدول‌های CRM',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    projectId: null,
    dueAt: '۱۴۰۵/۰۸/۰۶',
    version: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_AUDITS: AuditItem[] = [
  {
    id: 'aud-1',
    action: 'TASK_CREATED',
    actor: 'کارمند عملیات (شما)',
    entity: 'Task:TSK-1001',
    time: '۱۰ دقیقه پیش',
    details: 'ایجاد تسک با اولویت بالا',
  },
  {
    id: 'aud-2',
    action: 'TASK_TRANSITIONED',
    actor: 'کارمند عملیات (شما)',
    entity: 'Task:TSK-1002',
    time: '۵ دقیقه پیش',
    details: 'تغییر وضعیت از TODO به IN_PROGRESS',
  },
];

export default function WorkspaceApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'my-work' | 'crm' | 'support' | 'audit'>('my-work');
  const [tasks, setTasks] = useState<TaskSummary[]>(INITIAL_TASKS);
  const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const nextNum = tasks.length + 1001;
    const newTask: TaskSummary = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tsk-${Date.now()}`,
      key: `TSK-${nextNum}`,
      title: newTitle.trim(),
      status: 'TODO',
      priority: newPriority,
      visibility: 'INTERNAL',
      assigneeId: '22222222-2222-2222-2222-222222222222',
      projectId: null,
      dueAt: '۱۴۰۵/۰۸/۱۰',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setAudits([
      {
        id: `aud-${Date.now()}`,
        action: 'TASK_CREATED',
        actor: 'کارمند عملیات',
        entity: `Task:${newTask.key}`,
        time: 'هم‌اکنون',
        details: `ایجاد تسک «${newTask.title}»`,
      },
      ...audits,
    ]);

    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    showToast(`تسک ${newTask.key} با موفقیت ایجاد شد`);
  };

  const handleTransition = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Validate with domain rule
    const allowed = canTransitionTask(task.status, targetStatus, {
      canReopenDoneTask: true,
      canRestoreCanceledTask: true,
    });

    if (!allowed) {
      showToast(`خطای دامنه: انتقال از ${task.status} به ${targetStatus} مجاز نیست`);
      return;
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: targetStatus,
          version: t.version + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setAudits([
      {
        id: `aud-${Date.now()}`,
        action: 'TASK_TRANSITIONED',
        actor: 'کارمند عملیات',
        entity: `Task:${task.key}`,
        time: 'هم‌اکنون',
        details: `انتقال وضعیت از ${task.status} به ${targetStatus} (نسخه ${task.version + 1})`,
      },
      ...audits,
    ]);

    showToast(`وضعیت تسک ${task.key} به ${statusLabel(targetStatus)} تغییر یافت`);
  };

  const statusLabel = (s: TaskStatus) => {
    switch (s) {
      case 'TODO': return 'در انتظار شروع';
      case 'IN_PROGRESS': return 'در حال انجام';
      case 'IN_REVIEW': return 'در انتظار بازبینی';
      case 'DONE': return 'تکمیل‌شده';
      case 'BLOCKED': return 'مسدود';
      case 'CANCELED': return 'لغوشده';
      default: return s;
    }
  };

  const priorityLabel = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT': return 'فوری';
      case 'HIGH': return 'بالا';
      case 'MEDIUM': return 'متوسط';
      case 'LOW': return 'پایین';
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar" aria-label="ناوبری اصلی">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span>پلتفرم یکپارچه سازمانی</span>
        </div>

        <div>
          <div className="workspace-label">فضای کاری فعال</div>
          <div className="workspace-switch">
            <span>شرکت آلفا (اصلی)</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--soft)', padding: '2px 6px', borderRadius: '4px' }}>عضو فعال</span>
          </div>
        </div>

        <nav className="nav-list">
          <button
            type="button"
            className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>📊</span> نمای کلی
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'my-work' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-work')}
          >
            <span>✓</span> کارهای من ({tasks.filter((t) => t.status !== 'DONE').length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <span>👥</span> مشتریان و فرصت‌ها
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span>🎫</span> تیکت‌ها و پشتیبانی
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <span>📜</span> رویدادهای ممیزی ({audits.length})
          </button>
        </nav>

        <div className="sidebar-foot">
          <strong>برش عمودی امن (Vertical Slice)</strong>
          <div>اعتبارسنجی قوانین سرور، تفکیک سازمانی و ثبت Audit Event فعال است.</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div>
            <p className="eyebrow">پنل عملیات کارکنان | نقش: SystemOwner / Employee</p>
            <h1>
              {activeTab === 'my-work' && 'وظایف و پیگیری‌های من'}
              {activeTab === 'overview' && 'داشبورد سلامت و شاخص‌ها'}
              {activeTab === 'crm' && 'مدیریت ارتباط با مشتریان (CRM)'}
              {activeTab === 'support' && 'میز پشتیبانی و درخواست‌ها'}
              {activeTab === 'audit' && 'تاریخچه رویدادهای ممیزی (Audit Trail)'}
            </h1>
            <p className="muted">
              تمام تغییرات وضعیت بر اساس ماشین حالت دامنه اجرا و ثبت ممیزی می‌شوند.
            </p>
          </div>
          <div className="top-actions">
            {activeTab === 'my-work' && (
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsModalOpen(true)}
              >
                + تسک جدید
              </button>
            )}
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="summary-grid">
              <article className="summary-card">
                <p>وظایف فعال من</p>
                <strong>{tasks.filter((t) => t.status !== 'DONE').length}</strong>
                <small>نیازمند اقدام و پیگیری</small>
              </article>
              <article className="summary-card">
                <p>در حال انجام</p>
                <strong style={{ color: 'var(--accent)' }}>
                  {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                </strong>
                <small>کارهای جاری تیم</small>
              </article>
              <article className="summary-card">
                <p>تکمیل‌شده</p>
                <strong style={{ color: 'var(--success)' }}>
                  {tasks.filter((t) => t.status === 'DONE').length}
                </strong>
                <small>موفق در چرخه کاری</small>
              </article>
              <article className="summary-card">
                <p>رویدادهای ثبت‌شده Audit</p>
                <strong>{audits.length}</strong>
                <small>گزارش‌های ممیزی امنیتی</small>
              </article>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px' }}>معماری و امنیت سیستم</h3>
              <p className="muted" style={{ lineHeight: '1.8' }}>
                پلتفرم از معماری <strong>Modular Monolith</strong> با جداسازی دقیق دامنه، لایه کاربرد و زیرساخت استفاده می‌کند.
                قوانین مجوزدهی و تفکیک سازمانی (Multi-tenant Scope) به طور کامل در سطح API و سرویس‌ها اعمال شده و از دستکاری غیرمجاز
                داده‌ها و آسیب‌پذیری‌های IDOR ممانعت به عمل می‌آورد.
              </p>
            </div>
          </div>
        )}

        {/* My Work Tab */}
        {activeTab === 'my-work' && (
          <div>
            {/* Filter Bar */}
            <div className="filter-bar">
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginLeft: '8px' }}>فیلتر وضعیت:</span>
              {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'ALL' && 'همه وظایف'}
                  {st === 'TODO' && 'در انتظار شروع'}
                  {st === 'IN_PROGRESS' && 'در حال انجام'}
                  {st === 'IN_REVIEW' && 'در انتظار بازبینی'}
                  {st === 'DONE' && 'تکمیل‌شده'}
                </button>
              ))}
            </div>

            {/* Tasks Grid */}
            <div className="task-grid">
              {filteredTasks.map((t) => (
                <article className="task-card" key={t.id}>
                  <div style={{ flex: 1 }}>
                    <div className="task-meta">
                      <span className="task-key">{t.key}</span>
                      <span className={`badge badge-${t.status.toLowerCase()}`}>
                        {statusLabel(t.status)}
                      </span>
                      <span className={`priority-badge priority-${t.priority}`}>
                        اولویت: {priorityLabel(t.priority)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>نسخه هم‌زمانی: v{t.version}</span>
                    </div>
                    <div className="task-title">{t.title}</div>
                    <p className="task-desc">مهلت انجام: {t.dueAt ?? 'تعیین نشده'}</p>
                  </div>

                  {/* Allowed Action Buttons based on Domain State Machine */}
                  <div className="task-actions">
                    {t.status === 'TODO' && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleTransition(t.id, 'IN_PROGRESS')}
                      >
                        ▶ شروع کار
                      </button>
                    )}

                    {t.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                        onClick={() => handleTransition(t.id, 'IN_REVIEW')}
                      >
                        🔍 ارسال برای بازبینی
                      </button>
                    )}

                    {t.status === 'IN_REVIEW' && (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                        onClick={() => handleTransition(t.id, 'DONE')}
                      >
                        ✓ تأیید و اتمام
                      </button>
                    )}

                    {t.status === 'DONE' && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleTransition(t.id, 'TODO')}
                      >
                        ↺ بازگشایی مجدد
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {filteredTasks.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>هیچ وظیفه‌ای در این فیلتر یافت نشد</h3>
                  <p>می‌توانید فیلتر را تغییر دهید یا یک تسک جدید ایجاد کنید.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CRM Tab */}
        {activeTab === 'crm' && (
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px' }}>مشتریان و خط‌لوله فروش (CRM Core)</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              ماژول مدیریت شرکت‌ها (Accounts)، مخاطبان (Contacts)، سرنخ‌ها (Leads) و فرصت‌های فروش (Deals).
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>نام شرکت / حساب</th>
                  <th>صنعت / نوع</th>
                  <th>مالک حساب</th>
                  <th>فرصت‌های فعال</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>فولاد گستر آریا</strong></td>
                  <td>صنعتی و معدنی</td>
                  <td>کارشناس فروش</td>
                  <td>۲ فرصت (۳۵۰,۰۰۰,۰۰۰ ریال)</td>
                  <td><span className="badge badge-done">مشتری فعال</span></td>
                </tr>
                <tr>
                  <td><strong>پتروشیمی سپهر</strong></td>
                  <td>نفت و گاز</td>
                  <td>مدیر سیستم</td>
                  <td>۱ فرصت (۱,۲۰۰,۰۰۰,۰۰۰ ریال)</td>
                  <td><span className="badge badge-in_progress">مذاکره قرارداد</span></td>
                </tr>
                <tr>
                  <td><strong>فناوری داده‌پژوهان</strong></td>
                  <td>نرم‌افزار و IT</td>
                  <td>کارشناس فروش</td>
                  <td>۱ فرصت (۴۵۰,۰۰۰,۰۰۰ ریال)</td>
                  <td><span className="badge badge-todo">سرنخ جدید</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px' }}>صندوق تیکت‌ها و پشتیبانی (Support)</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              تفکیک قطعی میان یادداشت‌های محرمانه داخلی کارشناسان (Internal Notes) و پیام‌های قابل مشاهده برای مشتری.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>عنوان تیکت</th>
                  <th>مشتری درخواست‌دهنده</th>
                  <th>اولویت</th>
                  <th>وضعیت SLA</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="task-key">TKT-1042</span></td>
                  <td><strong>عدم دسترسی به ماژول گزارش‌گیری</strong></td>
                  <td>پتروشیمی سپهر</td>
                  <td><span className="priority-badge priority-HIGH">بالا</span></td>
                  <td>۱ ساعت و ۴۰ دقیقه باقیمانده</td>
                  <td><span className="badge badge-in_progress">در حال بررسی</span></td>
                </tr>
                <tr>
                  <td><span className="task-key">TKT-1041</span></td>
                  <td><strong>درخواست افزایش سهمیه فایل‌های پیوست</strong></td>
                  <td>فولاد گستر آریا</td>
                  <td><span className="priority-badge priority-MEDIUM">متوسط</span></td>
                  <td>پاسخ اول ارسال شد</td>
                  <td><span className="badge badge-todo">در انتظار مشتری</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px' }}>تاریخچه ممیزی امنیتی (Audit Trail)</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              ثبت غیرقابل تغییر (Immutable) تمامی تغییرات حساس و گذارهای حالت همراه با Actor، Action و شناسه رهگیری درخواست.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>اقدام</th>
                  <th>کاربر مجری</th>
                  <th>موجودیت</th>
                  <th>توضیحات</th>
                  <th>زمان</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td><span className="task-key">{a.action}</span></td>
                    <td>{a.actor}</td>
                    <td>{a.entity}</td>
                    <td>{a.details}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px' }}>ایجاد تسک جدید</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>عنوان تسک (اجباری)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: بازبینی پروپوزال مشتری"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>شرح تکمیلی</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="جزئیات و الزامات کار..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>اولویت</label>
                <select
                  className="form-control"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                >
                  <option value="LOW">پایین</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">بالا</option>
                  <option value="URGENT">خیلی فوری</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  انصراف
                </button>
                <button type="submit" className="primary-button">
                  ثبت و ایجاد تسک
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}
