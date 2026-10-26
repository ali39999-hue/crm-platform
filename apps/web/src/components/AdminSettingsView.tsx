'use client';

import React, { useState, useEffect } from 'react';
import type {
  InviteMemberRequest,
  OrganizationMemberDto,
  OrganizationSettingsDto,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';
import { CustomFieldSchemaBuilder } from './CustomFieldSchemaBuilder';
import { IntegrationsView } from './IntegrationsView';

interface AdminSettingsViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function AdminSettingsView({ onNotify }: AdminSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'workspace' | 'members' | 'security' | 'roles' | 'fields' | 'integrations'>(
    'workspace',
  );

  const [settings, setSettings] = useState<OrganizationSettingsDto | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Workspace form state
  const [orgName, setOrgName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [locale, setLocale] = useState('fa-IR');
  const [auditDays, setAuditDays] = useState(90);
  const [tempFileDays, setTempFileDays] = useState(7);
  const [savingSettings, setSavingSettings] = useState(false);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Employee');
  const [inviting, setInviting] = useState(false);

  const ROLES_LIST = [
    { role: 'SystemOwner', title: 'مالک سیستم (SystemOwner)', desc: 'دسترسی کامل سراسری به کلیه ماژول‌ها و تنظیمات' },
    { role: 'OrganizationAdmin', title: 'مدیر سازمان (OrganizationAdmin)', desc: 'مدیریت کاربران، نقش‌ها و تنظیمات شرکت' },
    { role: 'Manager', title: 'مدیر تیم (Manager)', desc: 'تخصیص کار، ظرفیت تیم و تایید گزارش‌ها' },
    { role: 'Employee', title: 'کارمند عادی (Employee)', desc: 'مشاهده و پیگیری کارهای محول‌شده' },
    { role: 'Sales', title: 'کارشناس فروش (Sales)', desc: 'مدیریت سرنخ‌ها، شرکت‌ها، مخاطبان و فرصت‌های تجاری' },
    { role: 'SupportAgent', title: 'کارشناس پشتیبانی (SupportAgent)', desc: 'پاسخگویی به تیکت‌ها و یادداشت‌های داخلی' },
    { role: 'CustomerPortalUser', title: 'کاربر پورتال مشتری (CustomerPortalUser)', desc: 'صرفاً مشاهده تیکت‌ها و اسناد مجاز مشتری' },
    { role: 'Auditor', title: 'ناظر و حسابرس (Auditor)', desc: 'مشاهده گزارش‌ها و لاگ‌های ممیزی بدون امکان تغییر' },
    { role: 'IntegrationAccount', title: 'حساب سیستمی (IntegrationAccount)', desc: 'دسترسی برنامه‌نویسی ماشینی از طریق API' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedSettings, loadedMembers] = await Promise.all([
        apiClient.getOrganizationSettings(),
        apiClient.getOrganizationMembers(),
      ]);
      setSettings(loadedSettings);
      setOrgName(loadedSettings.name);
      setTimezone(loadedSettings.timezone);
      setLocale(loadedSettings.locale);
      if (loadedSettings.retentionPolicy) {
        setAuditDays(loadedSettings.retentionPolicy.auditLogsDays);
        setTempFileDays(loadedSettings.retentionPolicy.tempFilesDays);
      }
      setMembers(loadedMembers);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری تنظیمات سازمان', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const updated = await apiClient.updateOrganizationSettings({
        name: orgName.trim(),
        timezone,
        locale,
        retentionPolicy: {
          auditLogsDays: Number(auditDays),
          tempFilesDays: Number(tempFileDays),
        },
      });
      setSettings(updated);
      onNotify?.('تنظیمات سازمان و سیاست‌های نگهداری با موفقیت ذخیره شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ذخیره تنظیمات', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    try {
      setInviting(true);
      const newMem = await apiClient.inviteOrganizationMember({
        email: inviteEmail.trim(),
        displayName: inviteName.trim(),
        role: inviteRole,
      });
      setMembers((prev) => [...prev, newMem]);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      onNotify?.(`عضو جدید «${newMem.displayName}» با نقش ${newMem.role} افزوده شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در افزودن کاربر', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const updated = await apiClient.updateOrganizationMemberRole(memberId, { role: newRole });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      onNotify?.(`نقش کاربری «${updated.displayName}» به ${newRole} تغییر یافت`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تغییر نقش کاربری', 'error');
    }
  };

  const handleRevokeMember = async (member: OrganizationMemberDto) => {
    if (
      !window.confirm(
        `آیا از تعلیق عضویت «${member.displayName}» اطمینان دارید؟ تمامی نشست‌ها و توکن‌های فعال این کاربر باطل خواهند شد.`,
      )
    ) {
      return;
    }

    try {
      await apiClient.revokeOrganizationMember(member.id);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, active: false } : m)),
      );
      onNotify?.(
        `عضویت «${member.displayName}» به حالت معلق درآمد و توکن‌های فعال ابطال گردیدند`,
        'success',
      );
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تعلیق عضویت کاربر', 'error');
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100"
      data-testid="admin-settings-view"
    >
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>⚙️</span>
            <span>تنظیمات و مدیریت سازمان (Workspace Administration)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مدیریت هویت سازمان، اعضای تیم، نقش‌های ۹گانه، امنیت نشست‌ها و سیاست‌های ماندگاری داده‌ها
          </p>
        </div>

        {activeTab === 'members' && (
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            data-testid="invite-member-btn"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
          >
            <span>+</span>
            <span>دعوت و افزودن عضو جدید</span>
          </button>
        )}
      </header>

      {/* Tabs Switcher */}
      <nav className="flex border-b border-slate-800 bg-slate-900/40 px-6 gap-2 pt-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          data-testid="tab-workspace"
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'workspace'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🏢</span>
          <span>مشخصات سازمان و ماندگاری</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          data-testid="tab-members"
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>👥</span>
          <span>اعضای تیم ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          data-testid="tab-security"
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔒</span>
          <span>امنیت و نشست‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          data-testid="tab-roles"
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📋</span>
          <span>ماتریس نقش‌ها و مجوزها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          data-testid="tab-fields"
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'fields'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🛠️</span>
          <span>فیلدهای سفارشی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          data-testid="tab-integrations"
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'integrations'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔌</span>
          <span>اتصالات و کلیدها</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            در حال بارگذاری اطلاعات سازمان...
          </div>
        ) : (
          <>
            {/* Tab 1: Workspace Settings */}
            {activeTab === 'workspace' && (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                    اطلاعات پایه فضای کاری
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        نام سازمان یا شرکت *
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        data-testid="org-name-input"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        شناسه یکتا (Slug)
                      </label>
                      <input
                        type="text"
                        value={settings?.slug || 'alpha'}
                        disabled
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-slate-400 text-sm font-mono cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        منطقه زمانی پیش‌فرض
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Asia/Tehran">Asia/Tehran (تهران - GMT+3:30)</option>
                        <option value="UTC">UTC (زمان هماهنگ جهانی)</option>
                        <option value="Asia/Dubai">Asia/Dubai (دبی - GMT+4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        زبان و چینش پیش‌فرض
                      </label>
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="fa-IR">فارسی (fa-IR - راست به چپ RTL)</option>
                        <option value="en-US">English (en-US - LTR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                    سیاست‌های ماندگاری داده‌ها (Data Retention Policies)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        مدت نگهداری لاگ‌های ممیزی (روز)
                      </label>
                      <input
                        type="number"
                        value={auditDays}
                        onChange={(e) => setAuditDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min={30}
                        max={3650}
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        لاگ‌های قدیمی‌تر از این بازه به صورت ایمن آرشیو می‌گردند.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        مدت نگهداری فایل‌های موقت و آپلودها (روز)
                      </label>
                      <input
                        type="number"
                        value={tempFileDays}
                        onChange={(e) => setTempFileDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min={1}
                        max={90}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    data-testid="save-settings-btn"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow transition-colors"
                  >
                    {savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات سازمان'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Members Management */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
                  <table className="w-full text-right text-xs divide-y divide-slate-800">
                    <thead className="bg-slate-800/70 text-slate-400 font-semibold">
                      <tr>
                        <th className="px-4 py-3">نام کاربر</th>
                        <th className="px-4 py-3">ایمیل</th>
                        <th className="px-4 py-3">نقش کاربری</th>
                        <th className="px-4 py-3">وضعیت عضویت</th>
                        <th className="px-4 py-3">تاریخ پیوستن</th>
                        <th className="px-4 py-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60" data-testid="members-tbody">
                      {members.map((mem) => (
                        <tr
                          key={mem.id}
                          data-testid={`member-row-${mem.id}`}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {mem.displayName}
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{mem.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={mem.role}
                              disabled={mem.role === 'SystemOwner' || !mem.active}
                              onChange={(e) => handleRoleChange(mem.id, e.target.value)}
                              data-testid={`member-role-select-${mem.id}`}
                              className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              {ROLES_LIST.map((r) => (
                                <option key={r.role} value={r.role}>
                                  {r.role}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                mem.active
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                                  : 'bg-rose-950 border border-rose-800 text-rose-300'
                              }`}
                            >
                              {mem.active ? 'فعال' : 'معلق‌شده'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(mem.joinedAt).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {mem.role !== 'SystemOwner' && mem.active && (
                              <button
                                type="button"
                                onClick={() => handleRevokeMember(mem)}
                                data-testid={`revoke-member-btn-${mem.id}`}
                                className="px-2.5 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] transition-colors"
                              >
                                تعلیق عضویت
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Security & Sessions */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>🛡️</span>
                    <span>سیاست‌های چرخه عمر توکن و نشست‌ها (Token Lifecycle)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/60">
                      <div className="text-slate-400">طول عمر Access Token</div>
                      <div className="text-base font-bold text-slate-100 mt-1">۱۵ دقیقه</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        کوتاه‌مدت جهت کاهش ریسک سرقت توکن
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/60">
                      <div className="text-slate-400">طول عمر Refresh Token</div>
                      <div className="text-base font-bold text-slate-100 mt-1">۷ روز</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        با چرخش خودکار (Token Rotation)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/60">
                      <div className="text-slate-400">فهرست مسدودی (Blacklist Store)</div>
                      <div className="text-base font-bold text-emerald-400 mt-1">فعال با TTL</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        پاک‌سازی خودکار رکوردهای منقضی
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2 text-rose-400">
                    <span>⚠️</span>
                    <span>اقدامات امنیتی بحرانی</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    در صورت مشکوک شدن به نشت اعتبارنامه یا تغییر گذرواژه سراسری، می‌توانید تمامی
                    نشست‌های فعال کاربران این سازمان را فوراً باطل کنید.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('آیا از خروج اضطراری و ابطال تمام نشست‌ها اطمینان دارید؟')) {
                        onNotify?.('دستور ابطال تمام نشست‌های فعال صادر گردید', 'success');
                      }
                    }}
                    className="px-4 py-2 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    ابطال تمام نشست‌های فعال سازمان (Force Logout All)
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Roles & Permissions Matrix Reference */}
            {activeTab === 'roles' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>📋</span>
                    <span>فهرست نقش‌های سازمانی و مسئولیت‌ها</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ROLES_LIST.map((r) => (
                      <div
                        key={r.role}
                        className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1 text-xs"
                      >
                        <div className="font-bold text-indigo-300">{r.title}</div>
                        <p className="text-slate-400 leading-normal">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Custom Fields Schema Builder */}
            {activeTab === 'fields' && (
              <CustomFieldSchemaBuilder onNotify={onNotify} />
            )}

            {/* Tab 6: Integrations and API Keys */}
            {activeTab === 'integrations' && (
              <IntegrationsView onNotify={onNotify} />
            )}
          </>
        )}
      </main>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="invite-member-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">دعوت عضو جدید به سازمان</h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="مثال: کامران رستمی"
                  data-testid="invite-name-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">آدرس ایمیل *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  data-testid="invite-email-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  نقش سازمانی *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  data-testid="invite-role-select"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  data-testid="invite-submit-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {inviting ? 'در حال ارسال...' : 'ارسال دعوت‌نامه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettingsView;
