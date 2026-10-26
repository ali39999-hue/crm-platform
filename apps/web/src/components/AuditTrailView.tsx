'use client';

import React, { useState } from 'react';

export type AuditItem = {
  id: string;
  action: string;
  actor: string;
  entity: string;
  time: string;
  details: string;
};

interface AuditTrailViewProps {
  audits: AuditItem[];
  isLoading?: boolean;
}

export function AuditTrailView({ audits, isLoading }: AuditTrailViewProps) {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const actions = ['ALL', ...Array.from(new Set(audits.map((a) => a.action)))];

  const filtered = audits.filter((a) => {
    if (filterAction !== 'ALL' && a.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = a.action.toLowerCase().includes(q);
      const matchActor = a.actor.toLowerCase().includes(q);
      const matchEntity = a.entity.toLowerCase().includes(q);
      const matchDetails = a.details.toLowerCase().includes(q);
      if (!matchAction && !matchActor && !matchEntity && !matchDetails) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '24px',
      }}
      data-testid="audit-trail-view"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
            تاریخچه ممیزی امنیتی (Audit Trail)
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            ثبت غیرقابل تغییر (Immutable) تمامی تغییرات حساس و گذارهای حالت همراه با Actor، Action
            و شناسه رهگیری درخواست.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="جستجو در لاگ‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--canvas)',
              color: 'var(--ink)',
            }}
          />

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--canvas)',
              color: 'var(--ink)',
            }}
          >
            {actions.map((act) => (
              <option key={act} value={act}>
                {act === 'ALL' ? 'همه اقدام‌ها' : act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-xs">در حال دریافت لاگ‌های ممیزی سرور...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          هیچ رویداد ممیزی با این فیلتر ثبت نشده است.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>اقدام</th>
              <th>کاربر مجری</th>
              <th>موجودیت</th>
              <th>توضیحات و متادیتا</th>
              <th>زمان</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="task-key">{a.action}</span>
                </td>
                <td>{a.actor}</td>
                <td>{a.entity}</td>
                <td style={{ maxWidth: '350px', wordBreak: 'break-word', fontSize: '11px' }}>
                  {a.details}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AuditTrailView;
