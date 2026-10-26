'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AccountDto,
  ContactDto,
  CreateContactRequest,
  CreateDealRequest,
  CustomerTimelineItem,
  DealDto,
  LeadDto,
  TaskDetails,
  TaskPriority,
  TicketDto,
} from '@crm/contracts';
import { isBirthdayToday } from '@crm/domain';
import { apiClient } from '../lib/api-client';
import { PriorityBadge, TicketStatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface Customer360DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountDto | null;
  // Optional preloaded collections from parent
  contacts?: ContactDto[];
  deals?: DealDto[];
  tickets?: TicketDto[];
  leads?: LeadDto[];
  // Callbacks
  onContactCreated?: (contact: ContactDto) => void;
  onDealCreated?: (deal: DealDto) => void;
  onTaskCreated?: (task: TaskDetails) => void;
  onLeadConverted?: (leadId: string, accountId: string) => void;
  onToast?: (message: string) => void;
}

type TabType = 'overview' | 'contacts' | 'deals' | 'tickets' | 'timeline';

export function getDealStageBadge(stage: string): { label: string; className: string } {
  switch (stage?.toUpperCase()) {
    case 'LEAD':
      return { label: 'سرنخ اولیه', className: 'badge-stage-lead' };
    case 'PROPOSAL':
      return { label: 'ارسال پروپوزال', className: 'badge-stage-proposal' };
    case 'NEGOTIATION':
      return { label: 'مذاکره قرارداد', className: 'badge-stage-negotiation' };
    case 'WON':
      return { label: 'موفق و بسته‌شده', className: 'badge-stage-won' };
    case 'LOST':
      return { label: 'از دست‌رفته', className: 'badge-stage-lost' };
    default:
      return { label: stage || 'نامشخص', className: 'badge-stage-lead' };
  }
}

export function getAccountTypeLabel(type: string): string {
  switch (type) {
    case 'CUSTOMER':
      return 'مشتری سازمانی';
    case 'PROSPECT':
      return 'مشتری بالقوه';
    case 'PARTNER':
      return 'شریک تجاری';
    case 'VENDOR':
      return 'تأمین‌کننده';
    default:
      return type;
  }
}

export function getAccountStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'فعال';
    case 'INACTIVE':
      return 'غیرفعال';
    case 'SUSPENDED':
      return 'معلق';
    default:
      return status;
  }
}

export function formatPersianCurrency(amountMinor?: number | null, currency = 'ریال'): string {
  if (amountMinor === null || amountMinor === undefined) return '۰ ریال';
  return `${Number(amountMinor).toLocaleString('fa-IR')} ${currency}`;
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return `${d.toLocaleDateString('fa-IR')}، ساعت ${d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return isoString;
  }
}

export function Customer360Drawer({
  isOpen,
  onClose,
  account,
  contacts: initialContacts = [],
  deals: initialDeals = [],
  tickets: initialTickets = [],
  leads = [],
  onContactCreated,
  onDealCreated,
  onTaskCreated,
  onLeadConverted,
  onToast,
}: Customer360DrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeline, setTimeline] = useState<CustomerTimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Local synced entity states
  const [localContacts, setLocalContacts] = useState<ContactDto[]>([]);
  const [localDeals, setLocalDeals] = useState<DealDto[]>([]);
  const [localTickets, setLocalTickets] = useState<TicketDto[]>([]);

  // Sub-modals for quick actions
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isConvertLeadOpen, setIsConvertLeadOpen] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [dealForm, setDealForm] = useState({
    name: '',
    amountMinor: '',
    stage: 'PROPOSAL',
    probability: 60,
    targetCloseAt: '',
  });
  const [callForm, setCallForm] = useState({
    direction: 'OUTBOUND',
    contactPerson: '',
    durationMinutes: '10',
    outcome: 'COMPLETED',
    summary: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    dueAt: '',
  });
  const [convertForm, setConvertForm] = useState({
    selectedLeadId: '',
    dealName: '',
    dealAmount: '',
  });

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const notify = useCallback(
    (msg: string) => {
      if (onToast) onToast(msg);
    },
    [onToast],
  );

  // Sync local data whenever account or initial props change
  useEffect(() => {
    if (!account) return;
    setLocalContacts(initialContacts.filter((c) => c.accountId === account.id));
    setLocalDeals(initialDeals.filter((d) => d.accountId === account.id));
    setLocalTickets(initialTickets.filter((t) => t.accountId === account.id));
  }, [account, initialContacts, initialDeals, initialTickets]);

  // Fetch timeline whenever account changes or drawer opens
  const fetchTimeline = useCallback(async () => {
    if (!account) return;
    setIsLoadingTimeline(true);
    try {
      // Prioritize getCustomerTimeline, fallback to getEntityTimeline
      const items = await apiClient.getCustomerTimeline(account.id);
      setTimeline(items);
    } catch {
      try {
        const items = await apiClient.getEntityTimeline('ACCOUNT', account.id);
        setTimeline(items);
      } catch (err) {
        console.error('[Customer360Drawer] Error fetching timeline:', err);
      }
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [account]);

  useEffect(() => {
    if (isOpen && account) {
      void fetchTimeline();
      setActiveTab('overview');
    }
  }, [isOpen, account, fetchTimeline]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // If a submodal is open, close it first; otherwise close drawer
        if (
          isAddContactOpen ||
          isAddDealOpen ||
          isLogCallOpen ||
          isCreateTaskOpen ||
          isConvertLeadOpen
        ) {
          setIsAddContactOpen(false);
          setIsAddDealOpen(false);
          setIsLogCallOpen(false);
          setIsCreateTaskOpen(false);
          setIsConvertLeadOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isAddContactOpen,
    isAddDealOpen,
    isLogCallOpen,
    isCreateTaskOpen,
    isConvertLeadOpen,
    onClose,
  ]);

  // Quick stats calculation
  const totalDealsValue = useMemo(() => {
    return localDeals.reduce((sum, d) => sum + (d.amountMinor || 0), 0);
  }, [localDeals]);

  const openTicketsCount = useMemo(() => {
    return localTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  }, [localTickets]);

  const wonDealsCount = useMemo(() => {
    return localDeals.filter((d) => d.stage?.toUpperCase() === 'WON').length;
  }, [localDeals]);

  if (!isOpen || !account) return null;

  // Handler: Add Contact
  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim() || isSubmittingAction) return;

    try {
      setIsSubmittingAction(true);
      const req: CreateContactRequest = {
        accountId: account.id,
        firstName: contactForm.firstName.trim(),
        lastName: contactForm.lastName.trim(),
        ...(contactForm.email.trim() ? { email: contactForm.email.trim() } : {}),
        ...(contactForm.phone.trim() ? { phone: contactForm.phone.trim() } : {}),
      };

      const newContact = await apiClient.createContact(req);
      setLocalContacts((prev) => [newContact, ...prev]);
      if (onContactCreated) onContactCreated(newContact);

      // Log activity
      const activitySummary = `مخاطب جدید «${newContact.firstName} ${newContact.lastName}» به حساب افزوده شد`;
      const act = await apiClient.logTimelineActivity({
        entityType: 'ACCOUNT',
        entityId: account.id,
        kind: 'CONTACT_ADDED',
        summary: activitySummary,
        metadata: { contactId: newContact.id },
      });
      setTimeline((prev) => [act, ...prev]);

      notify(`مخاطب «${newContact.firstName} ${newContact.lastName}» با موفقیت افزوده شد`);
      setContactForm({ firstName: '', lastName: '', email: '', phone: '' });
      setIsAddContactOpen(false);
    } catch (err: any) {
      notify(`خطا در ایجاد مخاطب: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSendBirthdaySms = async (contactId: string, contactName: string) => {
    try {
      const res = await apiClient.sendBirthdaySms(contactId);
      notify(res.message);
    } catch (err: any) {
      notify(`خطا در ارسال پیامک تبریک: ${err.message || 'خطای شبکه'}`);
    }
  };

  const handleTogglePinTimelineItem = (itemId: string) => {
    setTimeline((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isPinned: !item.isPinned } : item)),
    );
    notify('وضعیت پین یادداشت تغییر یافت 📌');
  };

  // Handler: Add Deal
  const handleAddDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.name.trim() || isSubmittingAction) return;

    try {
      setIsSubmittingAction(true);
      const parsedAmount = dealForm.amountMinor ? parseInt(dealForm.amountMinor, 10) : undefined;
      const req: CreateDealRequest = {
        accountId: account.id,
        name: dealForm.name.trim(),
        stage: dealForm.stage,
        currency: 'IRR',
        probability: Number(dealForm.probability),
        ...(!isNaN(parsedAmount as number) && parsedAmount !== undefined ? { amountMinor: parsedAmount } : {}),
        ...(dealForm.targetCloseAt.trim() ? { targetCloseAt: dealForm.targetCloseAt.trim() } : {}),
      };

      const newDeal = await apiClient.createDeal(req);
      setLocalDeals((prev) => [newDeal, ...prev]);
      if (onDealCreated) onDealCreated(newDeal);

      // Log activity
      const formattedAmount = formatPersianCurrency(newDeal.amountMinor);
      const activitySummary = `فرصت معامله جدید «${newDeal.name}» به مبلغ ${formattedAmount} در مرحله ${getDealStageBadge(newDeal.stage).label} ثبت گردید`;
      const act = await apiClient.logTimelineActivity({
        entityType: 'ACCOUNT',
        entityId: account.id,
        kind: 'DEAL_CREATED',
        summary: activitySummary,
        metadata: { dealId: newDeal.id, amountMinor: newDeal.amountMinor },
      });
      setTimeline((prev) => [act, ...prev]);

      notify(`فرصت معامله «${newDeal.name}» با موفقیت ثبت شد`);
      setDealForm({
        name: '',
        amountMinor: '',
        stage: 'PROPOSAL',
        probability: 60,
        targetCloseAt: '',
      });
      setIsAddDealOpen(false);
    } catch (err: any) {
      notify(`خطا در ثبت معامله: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler: Quick Log Call
  const handleLogCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.summary.trim() || isSubmittingAction) return;

    try {
      setIsSubmittingAction(true);
      const dirText = callForm.direction === 'OUTBOUND' ? 'تماس خروجی' : 'تماس ورودی';
      const outcomeText =
        callForm.outcome === 'COMPLETED'
          ? 'موفق'
          : callForm.outcome === 'FOLLOWUP'
          ? 'نیاز به پیگیری مجدد'
          : 'بی‌پاسخ';

      const fullSummary = `${dirText} (${callForm.durationMinutes} دقیقه) با نتیجه [${outcomeText}]: ${callForm.summary.trim()}`;

      const act = await apiClient.logTimelineActivity({
        entityType: 'ACCOUNT',
        entityId: account.id,
        kind: 'CALL_LOGGED',
        summary: fullSummary,
        metadata: {
          direction: callForm.direction,
          durationMinutes: callForm.durationMinutes,
          outcome: callForm.outcome,
          contactPerson: callForm.contactPerson || undefined,
        },
      });

      setTimeline((prev) => [act, ...prev]);
      notify('گزارش تماس تلفنی با موفقیت در تایم‌لاین ثبت شد');
      setCallForm({
        direction: 'OUTBOUND',
        contactPerson: '',
        durationMinutes: '10',
        outcome: 'COMPLETED',
        summary: '',
      });
      setIsLogCallOpen(false);
      setActiveTab('timeline');
    } catch (err: any) {
      notify(`خطا در ثبت تماس: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler: Quick Create Task
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || isSubmittingAction) return;

    try {
      setIsSubmittingAction(true);
      const prefixTitle = `[${account.name}] ${taskForm.title.trim()}`;
      const createdTask = await apiClient.createTask({
        title: prefixTitle,
        ...(taskForm.description.trim() ? { description: taskForm.description.trim() } : {}),
        priority: taskForm.priority,
        ...(taskForm.dueAt.trim() ? { dueAt: taskForm.dueAt.trim() } : {}),
      });

      if (onTaskCreated) onTaskCreated(createdTask);

      // Log activity
      const act = await apiClient.logTimelineActivity({
        entityType: 'ACCOUNT',
        entityId: account.id,
        kind: 'TASK_CREATED',
        summary: `تسک پیگیری «${createdTask.title}» ایجاد شد (${createdTask.key})`,
        metadata: { taskId: createdTask.id, taskKey: createdTask.key },
      });
      setTimeline((prev) => [act, ...prev]);

      notify(`تسک ${createdTask.key} با موفقیت ایجاد شد`);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueAt: '' });
      setIsCreateTaskOpen(false);
    } catch (err: any) {
      notify(`خطا در ایجاد تسک: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler: Quick Convert Lead
  const handleConvertLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertForm.selectedLeadId || isSubmittingAction) return;

    try {
      setIsSubmittingAction(true);
      const selectedLead = leads.find((l) => l.id === convertForm.selectedLeadId);
      const leadTitle = selectedLead?.displayName ?? 'سرنخ انتخابی';

      const parsedAmount = convertForm.dealAmount ? parseInt(convertForm.dealAmount, 10) : undefined;

      const res = await apiClient.convertLead(convertForm.selectedLeadId, {
        idempotencyKey: `conv-${Date.now()}`,
        accountName: account.name,
        ...(convertForm.dealName.trim() ? { dealName: convertForm.dealName.trim() } : {}),
        ...(!isNaN(parsedAmount as number) && parsedAmount !== undefined ? { dealAmountMinor: parsedAmount } : {}),
      });

      if (onLeadConverted) {
        onLeadConverted(convertForm.selectedLeadId, account.id);
      }

      // Log activity
      const act = await apiClient.logTimelineActivity({
        entityType: 'ACCOUNT',
        entityId: account.id,
        kind: 'LEAD_CONVERTED',
        summary: `سرنخ «${leadTitle}» با موفقیت به این حساب تجاری متصل گردید`,
        metadata: { leadId: convertForm.selectedLeadId, res },
      });
      setTimeline((prev) => [act, ...prev]);

      notify(`سرنخ «${leadTitle}» با موفقیت تبدیل و به حساب ملحق شد`);
      setConvertForm({ selectedLeadId: '', dealName: '', dealAmount: '' });
      setIsConvertLeadOpen(false);
    } catch (err: any) {
      notify(`خطا در تبدیل سرنخ: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const unconvertedLeads = leads.filter((l) => l.status !== 'CONVERTED');

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`نمای جامع ۳۶۰ درجه مشتری ${account.name}`}
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="drawer-header">
          <div className="drawer-header-top">
            <div className="drawer-title-row">
              <div className="drawer-avatar" aria-hidden="true">
                {account.name.charAt(0) || 'ح'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                    {account.name}
                  </h2>
                  <span className={`badge ${account.status === 'ACTIVE' ? 'badge-done' : 'badge-todo'}`}>
                    {getAccountStatusLabel(account.status)}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'var(--soft)',
                      color: 'var(--accent)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {getAccountTypeLabel(account.type)}
                  </span>
                </div>
                <div className="drawer-meta-pills" style={{ marginTop: '6px' }}>
                  {account.phone && (
                    <span>
                      شماره تماس:{' '}
                      <a
                        href={`tel:${account.phone}`}
                        style={{ color: 'var(--accent)', direction: 'ltr', display: 'inline-block' }}
                      >
                        {account.phone}
                      </a>
                    </span>
                  )}
                  {account.website && (
                    <span>
                      وب‌سایت:{' '}
                      <a
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent)', direction: 'ltr', display: 'inline-block' }}
                      >
                        {account.website.replace(/^https?:\/\//, '')}
                      </a>
                    </span>
                  )}
                  <span>مالک حساب: {account.ownerId ? 'کارشناس فروش سازمانی' : 'کارمند عملیات'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              title="بستن پنجره (Esc)"
              aria-label="بستن پنجره"
            >
              ✕
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="drawer-quick-actions">
            <button
              type="button"
              className="primary-button"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setIsLogCallOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              ثبت تماس
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setIsCreateTaskOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              ایجاد تسک پیگیری
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setIsConvertLeadOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              تبدیل سرنخ
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="drawer-tabs" aria-label="تب‌های اطلاعات مشتری">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            نمای کلی
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            مخاطبان ({localContacts.length})
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
            onClick={() => setActiveTab('deals')}
          >
            معاملات ({localDeals.length})
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            تیکت‌ها ({localTickets.length})
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            تایم‌لاین تعاملات ({timeline.length})
          </button>
        </nav>

        {/* Drawer Body */}
        <main className="drawer-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Didar Pinned Notes Banner */}
              {timeline.filter((item) => item.isPinned).length > 0 && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                  }}
                  data-testid="customer-pinned-notes-banner"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#f59e0b',
                      fontWeight: 800,
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}
                  >
                    <span>📌</span>
                    <span>یادداشت‌ها و نکات حیاتی سنجاق‌شده پرونده (Didar Pinned Notes)</span>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {timeline
                      .filter((item) => item.isPinned)
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: 'var(--paper)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>
                              {item.summary}
                            </div>
                            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                              ثبت شده توسط {item.actorName || 'کارشناس'} • {formatDateTime(item.occurredAt)}
                            </small>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePinTimelineItem(item.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f59e0b',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            برداشتن پین
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <p style={{ color: 'var(--muted)', fontSize: '11px', margin: '0 0 4px' }}>
                    ارزش کل فرصت‌ها
                  </p>
                  <strong style={{ fontSize: '15px', color: 'var(--accent)', display: 'block' }}>
                    {formatPersianCurrency(totalDealsValue)}
                  </strong>
                  <small style={{ color: 'var(--muted)', fontSize: '10px' }}>
                    {localDeals.length} معامله ثبت‌شده
                  </small>
                </div>

                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <p style={{ color: 'var(--muted)', fontSize: '11px', margin: '0 0 4px' }}>
                    تیکت‌های در انتظار
                  </p>
                  <strong
                    style={{
                      fontSize: '18px',
                      color: openTicketsCount > 0 ? 'var(--warning)' : 'var(--success)',
                      display: 'block',
                    }}
                  >
                    {openTicketsCount.toLocaleString('fa-IR')}
                  </strong>
                  <small style={{ color: 'var(--muted)', fontSize: '10px' }}>
                    از مجموع {localTickets.length} تیکت
                  </small>
                </div>

                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <p style={{ color: 'var(--muted)', fontSize: '11px', margin: '0 0 4px' }}>
                    مخاطبان کلیدی
                  </p>
                  <strong style={{ fontSize: '18px', color: 'var(--ink)', display: 'block' }}>
                    {localContacts.length.toLocaleString('fa-IR')}
                  </strong>
                  <small style={{ color: 'var(--muted)', fontSize: '10px' }}>افراد تصمیم‌گیرنده</small>
                </div>

                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <p style={{ color: 'var(--muted)', fontSize: '11px', margin: '0 0 4px' }}>
                    قراردادهای برنده
                  </p>
                  <strong style={{ fontSize: '18px', color: 'var(--success)', display: 'block' }}>
                    {wonDealsCount.toLocaleString('fa-IR')}
                  </strong>
                  <small style={{ color: 'var(--muted)', fontSize: '10px' }}>موفقیت پایپ‌لاین</small>
                </div>
              </div>

              {/* Account Details Card */}
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                }}
              >
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800 }}>
                  اطلاعات ثبتی و مشخصات حساب
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
                      شناسه سامانه (ID)
                    </span>
                    <code style={{ fontSize: '11px', direction: 'ltr', display: 'inline-block' }}>
                      {account.id}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
                      دسته‌بندی تجاری
                    </span>
                    <strong>{getAccountTypeLabel(account.type)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
                      تلفن رسمی
                    </span>
                    <span style={{ direction: 'ltr', display: 'inline-block' }}>
                      {account.phone ?? 'ثبت نشده'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
                      درگاه اینترنتی
                    </span>
                    {account.website ? (
                      <a
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent)', direction: 'ltr', display: 'inline-block' }}
                      >
                        {account.website}
                      </a>
                    ) : (
                      'ثبت نشده'
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
                      تاریخ ایجاد پرونده
                    </span>
                    <span>{formatDateTime(account.createdAt)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
                      آخرین به‌روزرسانی
                    </span>
                    <span>{formatDateTime(account.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>
                    آخرین تعاملات و رخدادها
                  </h4>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => setActiveTab('timeline')}
                  >
                    مشاهده کل تایم‌لاین ({timeline.length})
                  </button>
                </div>

                {isLoadingTimeline ? (
                  <LoadingSkeleton count={2} />
                ) : timeline.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                    هنوز تعاملی برای این مشتری ثبت نشده است. از دکمه‌های ثبت تماس برای آغاز تعامل استفاده کنید.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {timeline.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: item.isPinned ? 'rgba(245, 158, 11, 0.08)' : 'var(--canvas)',
                          borderRight: item.isPinned ? '3px solid #f59e0b' : '3px solid var(--accent)',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>
                            {item.summary}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', color: 'var(--muted)', fontSize: '11px' }}>
                            <span>{item.actorName ?? 'کارمند سیستم'}</span>
                            <span>•</span>
                            <span>{formatDateTime(item.occurredAt)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePinTimelineItem(item.id)}
                          title={item.isPinned ? 'برداشتن پین' : 'پین کردن این یادداشت'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            opacity: item.isPinned ? 1 : 0.4,
                          }}
                        >
                          📌
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS */}
          {activeTab === 'contacts' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800 }}>
                    فهرست مخاطبان و افراد رابط
                  </h4>
                  <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                    افراد کلیدی و تصمیم‌گیرنده در سازمان مشتری
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => setIsAddContactOpen(true)}
                >
                  + افزودن مخاطب جدید
                </button>
              </div>

              {localContacts.length === 0 ? (
                <EmptyState
                  title="هیچ مخاطبی برای این حساب ثبت نشده است"
                  description="با ثبت اولین مخاطب، راه‌های ارتباطی و افراد کلیدی این مشتری را مشخص کنید."
                />
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {localContacts.map((contact) => (
                    <div
                      key={contact.id}
                      style={{
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--soft)',
                            color: 'var(--accent)',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          {contact.firstName?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block', color: 'var(--ink)' }}>
                            {contact.firstName} {contact.lastName}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>
                              شناسه: {contact.id.slice(0, 8)}
                            </span>
                            {isBirthdayToday(contact.birthDate) && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  background: 'rgba(234, 179, 8, 0.15)',
                                  color: '#eab308',
                                  border: '1px solid rgba(234, 179, 8, 0.3)',
                                  fontWeight: 700,
                                }}
                              >
                                🎉 امروز روز تولد این مخاطب است!
                              </span>
                            )}
                            {contact.isDormant && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  color: '#f43f5e',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  fontWeight: 600,
                                }}
                              >
                                ⚠️ عدم تعامل ۶۰+ روز (پیگیری دوره‌ای)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {isBirthdayToday(contact.birthDate) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSendBirthdaySms(
                                contact.id,
                                `${contact.firstName} ${contact.lastName}`,
                              )
                            }
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            📱 ارسال پیامک تبریک تولد
                          </button>
                        )}
                        {contact.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--muted)' }}>تلفن:</span>
                            <a
                              href={`tel:${contact.phone}`}
                              style={{ color: 'var(--accent)', direction: 'ltr', display: 'inline-block' }}
                            >
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--muted)' }}>ایمیل:</span>
                            <a
                              href={`mailto:${contact.email}`}
                              style={{ color: 'var(--accent)', direction: 'ltr', display: 'inline-block' }}
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEALS */}
          {activeTab === 'deals' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800 }}>
                    خط‌لوله و فرصت‌های فروش (Deals)
                  </h4>
                  <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                    فرصت‌های تجاری و قراردادهای در جریان این حساب
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => setIsAddDealOpen(true)}
                >
                  + ثبت معامله جدید
                </button>
              </div>

              {localDeals.length === 0 ? (
                <EmptyState
                  title="هیچ معامله‌ای برای این شرکت ثبت نشده است"
                  description="برای ثبت پیشنهاد، استعلام قیمت یا قرارداد فروش جدید، دکمه بالا را بزنید."
                />
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {localDeals.map((deal) => {
                    const stageBadge = getDealStageBadge(deal.stage);
                    return (
                      <div
                        key={deal.id}
                        style={{
                          background: 'var(--paper)',
                          border: '1px solid var(--line)',
                          borderRadius: '10px',
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{deal.name}</strong>
                            <span className={`badge ${stageBadge.className}`}>{stageBadge.label}</span>
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '12px', display: 'flex', gap: '12px' }}>
                            <span>احتمال موفقیت: {deal.probability ?? 50}٪</span>
                            {deal.targetCloseAt && <span>هدف بستن: {deal.targetCloseAt}</span>}
                          </div>
                        </div>

                        <div style={{ textAlign: 'left' }}>
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: 'var(--accent)',
                              display: 'block',
                            }}
                          >
                            {formatPersianCurrency(deal.amountMinor, deal.currency || 'ریال')}
                          </span>
                          <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                            {formatDateTime(deal.createdAt)}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TICKETS */}
          {activeTab === 'tickets' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800 }}>
                  تیکت‌ها و درخواست‌های پشتیبانی (Support)
                </h4>
                <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                  پیگیری وضعیت رفع اشکال، تعهدات سطح خدمات (SLA) و پیام‌های ردوبدل‌شده
                </p>
              </div>

              {localTickets.length === 0 ? (
                <EmptyState
                  title="هیچ تیکت پشتیبانی برای این حساب ثبت نشده است"
                  description="تمام درخواست‌های این مشتری حل شده‌اند یا درخواستی ارسال نشده است."
                />
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {localTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      style={{
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="task-key">{ticket.reference}</span>
                          <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{ticket.title}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: 'var(--muted)', fontSize: '12px' }}>
                          <span>پاسخگو: {ticket.assigneeName ?? 'کارشناس پشتیبانی'}</span>
                          {ticket.targetResolutionAt && <span>مهلت SLA: {ticket.targetResolutionAt}</span>}
                          <span>پیام‌ها: {ticket.messagesCount}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <PriorityBadge priority={ticket.priority} />
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800 }}>
                    تایم‌لاین تعاملات و تاریخچه رخدادها
                  </h4>
                  <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                    جریان زمانی ثبت تماس‌ها، پروپوزال‌ها، تیکت‌ها و تغییرات حساب به ترتیب زمانی
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={fetchTimeline}
                  disabled={isLoadingTimeline}
                >
                  {isLoadingTimeline ? 'در حال دریافت...' : '⟳ به‌روزرسانی'}
                </button>
              </div>

              {isLoadingTimeline ? (
                <LoadingSkeleton count={4} />
              ) : timeline.length === 0 ? (
                <EmptyState
                  title="هیچ رویدادی در تایم‌لاین ثبت نشده است"
                  description="برای ثبت اولین تعامل، از دکمه «ثبت تماس» یا دیگر گزینه‌های سریع استفاده کنید."
                />
              ) : (
                <div className="timeline-feed">
                  {timeline.map((item) => {
                    let dotClass = 'dot-note';
                    let iconText = '📝';
                    if (item.kind?.includes('CALL')) {
                      dotClass = 'dot-call';
                      iconText = '📞';
                    } else if (item.kind?.includes('DEAL') || item.entityType === 'DEAL') {
                      dotClass = 'dot-deal';
                      iconText = '💼';
                    } else if (item.kind?.includes('TICKET') || item.entityType === 'TICKET') {
                      dotClass = 'dot-ticket';
                      iconText = '🎫';
                    } else if (item.kind?.includes('ACCOUNT') || item.entityType === 'ACCOUNT') {
                      dotClass = 'dot-account';
                      iconText = '🏢';
                    }

                    return (
                      <div key={item.id} className="timeline-item">
                        <div className={`timeline-dot ${dotClass}`} aria-hidden="true">
                          {iconText}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.kind}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {formatDateTime(item.occurredAt)}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                          {item.summary}
                        </p>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          مجری اقدام: {item.actorName ?? 'کارمند عملیات'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Submodal: Add Contact */}
      {isAddContactOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddContactOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>افزودن مخاطب به {account.name}</h3>
              <button
                type="button"
                onClick={() => setIsAddContactOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddContactSubmit}>
              <div className="form-group">
                <label>
                  نام <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: علیرضا"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                  disabled={isSubmittingAction}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>
                  نام خانوادگی <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: رضوانی"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>آدرس ایمیل</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="rezvani@company.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>شماره تلفن همراه</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="09121112233"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddContactOpen(false)}
                  disabled={isSubmittingAction}
                >
                  انصراف
                </button>
                <button type="submit" className="primary-button" disabled={isSubmittingAction}>
                  {isSubmittingAction ? 'در حال ثبت...' : 'ثبت مخاطب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Add Deal */}
      {isAddDealOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddDealOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>ثبت معامله جدید برای {account.name}</h3>
              <button
                type="button"
                onClick={() => setIsAddDealOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddDealSubmit}>
              <div className="form-group">
                <label>
                  عنوان معامله / قرارداد <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: تمدید قرارداد پشتیبانی فنی سالانه"
                  value={dealForm.name}
                  onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                  disabled={isSubmittingAction}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>مبلغ معامله (ریال)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="مثال: 500000000"
                  value={dealForm.amountMinor}
                  onChange={(e) => setDealForm({ ...dealForm, amountMinor: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>مرحله معامله در خط‌لوله (Stage)</label>
                <select
                  className="form-control"
                  value={dealForm.stage}
                  onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                  disabled={isSubmittingAction}
                >
                  <option value="LEAD">سرنخ اولیه (Lead)</option>
                  <option value="PROPOSAL">ارسال پروپوزال (Proposal)</option>
                  <option value="NEGOTIATION">مذاکره و تبادل پیش‌نویس (Negotiation)</option>
                  <option value="WON">بسته‌شده و برنده (Won)</option>
                  <option value="LOST">از دست‌رفته (Lost)</option>
                </select>
              </div>
              <div className="form-group">
                <label>احتمال موفقیت ({dealForm.probability}٪)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="form-control"
                  value={dealForm.probability}
                  onChange={(e) => setDealForm({ ...dealForm, probability: Number(e.target.value) })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>تاریخ پیش‌بینی بستن قرارداد</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: ۱۴۰۵/۰۹/۳۰"
                  value={dealForm.targetCloseAt}
                  onChange={(e) => setDealForm({ ...dealForm, targetCloseAt: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddDealOpen(false)}
                  disabled={isSubmittingAction}
                >
                  انصراف
                </button>
                <button type="submit" className="primary-button" disabled={isSubmittingAction}>
                  {isSubmittingAction ? 'در حال ثبت...' : 'ثبت معامله'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Quick Log Call */}
      {isLogCallOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogCallOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>ثبت تماس تلفنی با {account.name}</h3>
              <button
                type="button"
                onClick={() => setIsLogCallOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogCallSubmit}>
              <div className="form-group">
                <label>نوع تماس</label>
                <select
                  className="form-control"
                  value={callForm.direction}
                  onChange={(e) => setCallForm({ ...callForm, direction: e.target.value })}
                  disabled={isSubmittingAction}
                >
                  <option value="OUTBOUND">تماس خروجی (ما تماس گرفتیم)</option>
                  <option value="INBOUND">تماس ورودی (مشتری تماس گرفت)</option>
                </select>
              </div>
              <div className="form-group">
                <label>مخاطب گفتگو</label>
                <select
                  className="form-control"
                  value={callForm.contactPerson}
                  onChange={(e) => setCallForm({ ...callForm, contactPerson: e.target.value })}
                  disabled={isSubmittingAction}
                >
                  <option value="">انتخاب از مخاطبان ثبت‌شده (یا تماس با شماره اصلی شرکت)</option>
                  {localContacts.map((c) => (
                    <option key={c.id} value={`${c.firstName} ${c.lastName}`}>
                      {c.firstName} {c.lastName} ({c.phone || 'بدون شماره'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>مدت زمان مکالمه (دقیقه)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={callForm.durationMinutes}
                  onChange={(e) => setCallForm({ ...callForm, durationMinutes: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>نتیجه تماس</label>
                <select
                  className="form-control"
                  value={callForm.outcome}
                  onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                  disabled={isSubmittingAction}
                >
                  <option value="COMPLETED">موفق / توافق بر سر گام بعدی</option>
                  <option value="FOLLOWUP">نیاز به پیگیری مجدد</option>
                  <option value="BUSY">اشغال یا عدم پاسخگویی</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  خلاصه و یادداشت گفتگو <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  className="form-control"
                  placeholder="موضوع صحبت، نکات کلیدی و قرارهای تعیین شده..."
                  value={callForm.summary}
                  onChange={(e) => setCallForm({ ...callForm, summary: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsLogCallOpen(false)}
                  disabled={isSubmittingAction}
                >
                  انصراف
                </button>
                <button type="submit" className="primary-button" disabled={isSubmittingAction}>
                  {isSubmittingAction ? 'در حال ثبت...' : 'ثبت تماس در تایم‌لاین'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Quick Create Task */}
      {isCreateTaskOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateTaskOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>ایجاد تسک پیگیری برای {account.name}</h3>
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTaskSubmit}>
              <div className="form-group">
                <label>
                  عنوان وظیفه <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: ارسال پیش‌فاکتور رسمی و پیگیری با امور مالی"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  disabled={isSubmittingAction}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>توضیحات تکمیلی</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="دستورالعمل‌ها و جزئیات تسک..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>اولویت انجام</label>
                <select
                  className="form-control"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                  disabled={isSubmittingAction}
                >
                  <option value="LOW">پایین</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">بالا</option>
                  <option value="URGENT">خیلی فوری</option>
                </select>
              </div>
              <div className="form-group">
                <label>مهلت سررسید</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: ۱۴۰۵/۰۸/۱۰"
                  value={taskForm.dueAt}
                  onChange={(e) => setTaskForm({ ...taskForm, dueAt: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsCreateTaskOpen(false)}
                  disabled={isSubmittingAction}
                >
                  انصراف
                </button>
                <button type="submit" className="primary-button" disabled={isSubmittingAction}>
                  {isSubmittingAction ? 'در حال ثبت...' : 'ایجاد تسک'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Quick Convert Lead */}
      {isConvertLeadOpen && (
        <div className="modal-backdrop" onClick={() => setIsConvertLeadOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>تبدیل سرنخ به حساب {account.name}</h3>
              <button
                type="button"
                onClick={() => setIsConvertLeadOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConvertLeadSubmit}>
              <div className="form-group">
                <label>
                  انتخاب سرنخ موجود <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                {unconvertedLeads.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    سرنخ تبدیل‌نشده‌ای در سیستم یافت نشد. می‌توانید از بخش سرنخ‌ها ابتدا سرنخ جدید ایجاد کنید.
                  </p>
                ) : (
                  <select
                    className="form-control"
                    required
                    value={convertForm.selectedLeadId}
                    onChange={(e) => setConvertForm({ ...convertForm, selectedLeadId: e.target.value })}
                    disabled={isSubmittingAction}
                  >
                    <option value="">انتخاب سرنخ...</option>
                    {unconvertedLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.displayName} ({l.phone || l.email || l.source || 'بدون مشخصات'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>ایجاد همزمان معامله جدید (اختیاری)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="عنوان معامله اولیه (مثال: خرید لایسنس)"
                  value={convertForm.dealName}
                  onChange={(e) => setConvertForm({ ...convertForm, dealName: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="form-group">
                <label>مبلغ تخمینی معامله (ریال)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="مثال: 200000000"
                  value={convertForm.dealAmount}
                  onChange={(e) => setConvertForm({ ...convertForm, dealAmount: e.target.value })}
                  disabled={isSubmittingAction}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsConvertLeadOpen(false)}
                  disabled={isSubmittingAction}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmittingAction || !convertForm.selectedLeadId}
                >
                  {isSubmittingAction ? 'در حال تبدیل...' : 'تأیید و تبدیل سرنخ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Customer360Drawer;
