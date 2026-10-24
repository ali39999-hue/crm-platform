'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { TicketDto, TicketMessageDto, TicketPriority } from '@crm/contracts';
import { customerApiClient } from '../../lib/api-client';
import {
  EmptyState,
  ErrorBanner,
  getPriorityLabel,
  getTicketStatusLabel,
  LoadingSkeleton,
  PriorityBadge,
  TicketStatusBadge,
} from '../../components';

const CUSTOMER_ACCOUNT_ID = '50000000-0000-0000-0000-000000000001';

export default function CustomerPortalPage() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, TicketMessageDto[]>>({});
  const [replyText, setReplyText] = useState('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('NORMAL');

  // UI feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch customer-scoped tickets
  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Strictly load customer tickets for this account only
      const ticketList = await customerApiClient.getTickets(CUSTOMER_ACCOUNT_ID);
      setTickets(ticketList);
      if (ticketList.length > 0 && !selectedTicketId) {
        setSelectedTicketId(ticketList[0]!.id);
      }
    } catch (err: any) {
      console.error('[CustomerPortal] Error loading tickets:', err);
      setError('خطا در دریافت لیست تیکت‌ها از سامانه پشتیبانی.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  // Load messages for selected ticket, strictly excluding internal staff notes
  const loadMessages = useCallback(
    async (ticketId: string) => {
      setIsMessagesLoading(true);
      try {
        const rawMessages = await customerApiClient.getTicketMessages(ticketId);
        // Security gate: customer portal NEVER displays internal notes!
        const customerVisibleMessages = rawMessages.filter(
          (m) => m.visibility !== 'INTERNAL',
        );

        setMessages((prev) => ({
          ...prev,
          [ticketId]: customerVisibleMessages,
        }));
      } catch (err: any) {
        console.error('[CustomerPortal] Error loading messages:', err);
        showToast('خطا در بارگذاری پیام‌های تیکت');
      } finally {
        setIsMessagesLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (selectedTicketId) {
      void loadMessages(selectedTicketId);
    }
  }, [selectedTicketId, loadMessages]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
  const currentMessages = selectedTicketId ? messages[selectedTicketId] ?? [] : [];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newTicket = await customerApiClient.createTicket({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        accountId: CUSTOMER_ACCOUNT_ID,
      });

      setTickets((prev) => [newTicket, ...prev]);
      setSelectedTicketId(newTicket.id);

      // Load initial message
      await loadMessages(newTicket.id);

      setIsNewTicketModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      showToast(`تیکت ${newTicket.reference} با موفقیت ثبت شد`);
    } catch (err: any) {
      showToast(`خطا در ثبت تیکت: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newMsg = await customerApiClient.addTicketMessage(selectedTicketId, {
        body: replyText.trim(),
        visibility: 'CUSTOMER_SHARED', // Customer messages are always CUSTOMER_SHARED
      });

      setMessages((prev) => ({
        ...prev,
        [selectedTicketId]: [...(prev[selectedTicketId] ?? []), newMsg],
      }));

      // Update ticket message count in state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicketId
            ? { ...t, messagesCount: t.messagesCount + 1 }
            : t,
        ),
      );

      setReplyText('');
      showToast('پاسخ شما برای کارشناس پشتیبانی ارسال شد');
    } catch (err: any) {
      showToast(`خطا در ارسال پیام: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--ink)' }}>
      {/* Portal Top Bar */}
      <header
        style={{
          background: 'var(--paper)',
          borderBottom: '1px solid var(--line)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-mark" style={{ background: '#0284c7' }}>
            P
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px' }}>پورتال خدمات مشتریان</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              حساب کاربری: پتروشیمی سپهر (مشتری سازمانی)
            </div>
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
      <div
        style={{
          maxWidth: '1300px',
          margin: '24px auto',
          padding: '0 20px',
        }}
      >
        {error && (
          <ErrorBanner
            message={error}
            onRetry={loadTickets}
            onDismiss={() => setError(null)}
          />
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: '24px',
          }}
        >
          {/* Ticket List Column */}
          <section
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: 'calc(100vh - 150px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                درخواست‌های من ({tickets.length})
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>محدوده حساب شما</span>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton skeleton-card"
                    style={{ height: '90px', borderRadius: '10px' }}
                  />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <EmptyState
                title="درخواستی ثبت نشده است"
                description="می‌توانید نخستین تیکت پشتیبانی خود را ثبت کنید."
                action={{
                  label: 'ثبت تیکت جدید',
                  onClick: () => setIsNewTicketModalOpen(true),
                }}
              />
            ) : (
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <span className="task-key" style={{ color: '#0284c7' }}>
                          {t.reference}
                        </span>
                        <TicketStatusBadge status={t.status} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                        {t.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <PriorityBadge priority={t.priority} prefix="اولویت" />
                        <span>{t.createdAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Selected Ticket Conversation Area */}
          {selectedTicket ? (
            <section
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '520px',
              }}
            >
              {/* Ticket Header */}
              <div
                style={{
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '18px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    className="task-key"
                    style={{ fontSize: '14px', background: '#e0f2fe', color: '#0369a1' }}
                  >
                    {selectedTicket.reference}
                  </span>
                  <PriorityBadge priority={selectedTicket.priority} prefix="اولویت" />
                </div>
                <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>{selectedTicket.title}</h2>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    وضعیت: <strong>{getTicketStatusLabel(selectedTicket.status)}</strong>
                  </span>
                  <span>
                    زمان هدف تعهد پاسخ (SLA): <strong>{selectedTicket.targetResolutionAt ?? '۲۴ ساعت'}</strong>
                  </span>
                </div>
              </div>

              {/* Conversation Messages */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  flex: 1,
                  minHeight: '260px',
                  marginBottom: '20px',
                  overflowY: 'auto',
                }}
              >
                {isMessagesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="skeleton" style={{ width: '60%', height: '60px', alignSelf: 'flex-end', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '65%', height: '60px', alignSelf: 'flex-start', borderRadius: '12px' }} />
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    هنوز پیامی در این گفتگو ثبت نشده است.
                  </div>
                ) : (
                  currentMessages.map((m) => {
                    // Security double-check: never display internal notes to customer
                    if (m.visibility === 'INTERNAL') return null;

                    const isCustomer =
                      m.authorName?.includes('شما') ||
                      m.authorId === '33333333-3333-3333-3333-333333333333';

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
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '6px',
                            fontSize: '11px',
                            color: 'var(--muted)',
                          }}
                        >
                          <strong>{m.authorName ?? 'کارشناس پشتیبانی'}</strong>
                          <span>{m.createdAt}</span>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                          {m.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <textarea
                    rows={3}
                    required
                    className="form-control"
                    placeholder="پاسخ یا پیام جدید خود را بنویسید..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    پیام شما به‌صورت ایمن به کارشناس پشتیبانی ارجاع می‌شود.
                  </span>
                  <button
                    type="submit"
                    className="primary-button"
                    style={{ background: '#0284c7', borderColor: '#0284c7' }}
                    disabled={isSubmitting || !replyText.trim()}
                  >
                    {isSubmitting ? 'در حال ارسال...' : 'ارسال پیام'}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <div className="empty-state">یک تیکت را برای مشاهده گفتگو انتخاب کنید.</div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsNewTicketModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
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
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>اولویت</label>
                <select
                  className="form-control"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  disabled={isSubmitting}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: '#0284c7', borderColor: '#0284c7' }}
                  disabled={isSubmitting || !newTitle.trim() || !newDesc.trim()}
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت تیکت'}
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
