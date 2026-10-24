'use client';

import React, { useState } from 'react';
import type { TicketDto, TicketMessageDto, TicketPriority } from '@crm/contracts';

const INITIAL_CUSTOMER_TICKETS: TicketDto[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    reference: 'TKT-1042',
    title: 'عدم دسترسی به ماژول گزارش‌گیری برای کاربر جدید',
    status: 'OPEN',
    priority: 'HIGH',
    accountId: '50000000-0000-0000-0000-000000000001',
    accountName: 'پتروشیمی سپهر',
    assigneeName: 'کارشناس پشتیبانی',
    targetResolutionAt: 'امروز، ساعت ۱۸:۰۰',
    messagesCount: 2,
    createdAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۰:۳۰',
    updatedAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۱:۴۵',
  },
  {
    id: '90000000-0000-0000-0000-000000000003',
    reference: 'TKT-1038',
    title: 'درخواست وب‌هوک برای یکپارچه‌سازی با سامانه مالی',
    status: 'RESOLVED',
    priority: 'NORMAL',
    accountId: '50000000-0000-0000-0000-000000000001',
    accountName: 'پتروشیمی سپهر',
    assigneeName: 'کارشناس فنی',
    targetResolutionAt: '۱۴۰۵/۰۷/۲۸',
    messagesCount: 3,
    createdAt: '۱۴۰۵/۰۷/۲۷',
    updatedAt: '۱۴۰۵/۰۷/۲۸',
  },
];

const INITIAL_MESSAGES: Record<string, TicketMessageDto[]> = {
  '90000000-0000-0000-0000-000000000001': [
    {
      id: 'msg-1',
      ticketId: '90000000-0000-0000-0000-000000000001',
      authorName: 'کاربر مشتری (شما)',
      body: 'سلام، ما نمی‌توانیم گزارش خروجی ماهانه را دریافت کنیم. لطفاً دسترسی ما را فعال کنید.',
      visibility: 'CUSTOMER_SHARED',
      createdAt: '۱۰:۳۰',
    },
    {
      id: 'msg-3',
      ticketId: '90000000-0000-0000-0000-000000000001',
      authorName: 'پشتیبانی فنی پلتفرم',
      body: 'با سلام، درخواست شما دریافت و در حال بررسی سطح دسترسی سازمانی شما هستیم.',
      visibility: 'CUSTOMER_SHARED',
      createdAt: '۱۱:۴۵',
    },
    // NOTE: Internal notes from staff are strictly excluded from customer portal data!
  ],
};

export default function CustomerPortalPage() {
  const [tickets, setTickets] = useState<TicketDto[]>(INITIAL_CUSTOMER_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(INITIAL_CUSTOMER_TICKETS[0]!.id);
  const [messages, setMessages] = useState<Record<string, TicketMessageDto[]>>(INITIAL_MESSAGES);
  const [replyText, setReplyText] = useState('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('NORMAL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
  const currentMessages = messages[selectedTicketId] || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const nextRef = `TKT-${tickets.length + 1043}`;
    const newTicketId = `tkt-${Date.now()}`;

    const newTicket: TicketDto = {
      id: newTicketId,
      reference: nextRef,
      title: newTitle.trim(),
      status: 'OPEN',
      priority: newPriority,
      accountId: '50000000-0000-0000-0000-000000000001',
      accountName: 'پتروشیمی سپهر',
      assigneeName: 'تخصیص خودکار به پشتیبانی',
      targetResolutionAt: '۲۴ ساعت کاری',
      messagesCount: 1,
      createdAt: 'هم‌اکنون',
      updatedAt: 'هم‌اکنون',
    };

    const initialMessage: TicketMessageDto = {
      id: `msg-${Date.now()}`,
      ticketId: newTicketId,
      authorName: 'کاربر مشتری (شما)',
      body: newDesc.trim(),
      visibility: 'CUSTOMER_SHARED',
      createdAt: 'هم‌اکنون',
    };

    setTickets([newTicket, ...tickets]);
    setMessages({
      ...messages,
      [newTicketId]: [initialMessage],
    });
    setSelectedTicketId(newTicketId);

    setIsNewTicketModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    showToast(`تیکت ${nextRef} با موفقیت ثبت شد`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg: TicketMessageDto = {
      id: `msg-${Date.now()}`,
      ticketId: selectedTicketId,
      authorName: 'کاربر مشتری (شما)',
      body: replyText.trim(),
      visibility: 'CUSTOMER_SHARED', // Customer messages are always CUSTOMER_SHARED
      createdAt: 'هم‌اکنون',
    };

    setMessages({
      ...messages,
      [selectedTicketId]: [...currentMessages, newMsg],
    });

    setReplyText('');
    showToast('پاسخ شما برای کارشناس پشتیبانی ارسال شد');
  };

  const priorityLabel = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT': return 'خیلی فوری';
      case 'HIGH': return 'بالا';
      case 'NORMAL': return 'عادی';
      case 'LOW': return 'پایین';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'OPEN': return 'در حال بررسی';
      case 'PENDING_CUSTOMER': return 'در انتظار پاسخ شما';
      case 'RESOLVED': return 'حل‌شده';
      case 'CLOSED': return 'بسته‌شده';
      default: return s;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--ink)' }}>
      {/* Portal Top Bar */}
      <header style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-mark" style={{ background: '#0284c7' }}>P</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px' }}>پورتال خدمات مشتریان</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>حساب کاربری: پتروشیمی سپهر</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a href="/" className="secondary-button" style={{ fontSize: '12px' }}>
            ← بازگشت به پنل داخلی
          </a>
          <button
            type="button"
            className="primary-button"
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => setIsNewTicketModalOpen(true)}
          >
            + ثبت درخواست جدید
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1300px', margin: '24px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Ticket List Column */}
        <section style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>درخواست‌های من ({tickets.length})</h2>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>محدوده مشتری</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid var(--line)',
                    background: isSelected ? '#f0f9ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="task-key" style={{ color: '#0284c7' }}>{t.reference}</span>
                    <span className={`badge ${t.status === 'RESOLVED' ? 'badge-done' : 'badge-in_progress'}`}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{t.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>اولویت: {priorityLabel(t.priority)}</span>
                    <span>{t.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Selected Ticket Conversation Area */}
        {selectedTicket ? (
          <section style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {/* Ticket Header */}
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="task-key" style={{ fontSize: '14px', background: '#e0f2fe', color: '#0369a1' }}>
                  {selectedTicket.reference}
                </span>
                <span className={`priority-badge priority-${selectedTicket.priority}`}>
                  اولویت: {priorityLabel(selectedTicket.priority)}
                </span>
              </div>
              <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>{selectedTicket.title}</h2>
              <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '20px' }}>
                <span>وضعیت: <strong>{statusLabel(selectedTicket.status)}</strong></span>
                <span>زمان هدف تعهد پاسخ (SLA): <strong>{selectedTicket.targetResolutionAt}</strong></span>
              </div>
            </div>

            {/* Conversation Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: '300px', marginBottom: '20px', overflowY: 'auto' }}>
              {currentMessages.map((m) => {
                const isCustomer = m.authorName?.includes('شما');
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      background: isCustomer ? '#e0f2fe' : '#f8fafc',
                      border: '1px solid',
                      borderColor: isCustomer ? '#bae6fd' : '#e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', fontSize: '11px', color: 'var(--muted)' }}>
                      <strong>{m.authorName}</strong>
                      <span>{m.createdAt}</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{m.body}</div>
                  </div>
                );
              })}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <textarea
                  rows={3}
                  required
                  className="form-control"
                  placeholder="پاسخ یا پیام جدید خود را بنویسید..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  پیام شما به‌صورت ایمن به کارشناس پشتیبانی ارجاع می‌شود.
                </span>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: '#0284c7', borderColor: '#0284c7' }}
                >
                  ارسال پیام
                </button>
              </div>
            </form>
          </section>
        ) : (
          <div className="empty-state">یک تیکت را برای مشاهده گفتگو انتخاب کنید.</div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px' }}>ثبت تیکت پشتیبانی جدید</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>موضوع درخواست (اجباری)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: مشکل در بارگذاری گزارش‌ها"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>اولویت</label>
                <select
                  className="form-control"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                >
                  <option value="LOW">پایین (سؤال عمومی یا راهنمایی)</option>
                  <option value="NORMAL">عادی (عملکرد عادی با اختلال جزیی)</option>
                  <option value="HIGH">بالا (اختلال مهم در فرآیند)</option>
                  <option value="URGENT">خیلی فوری (قطعی کامل سیستم)</option>
                </select>
              </div>

              <div className="form-group">
                <label>شرح کامل مشکل یا درخواست</label>
                <textarea
                  rows={4}
                  required
                  className="form-control"
                  placeholder="جزئیات خطا و مراحل تکرار را توضیح دهید..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: '#0284c7', borderColor: '#0284c7' }}
                >
                  ثبت تیکت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}
