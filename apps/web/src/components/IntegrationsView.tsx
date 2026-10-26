'use client';

import React, { useState, useEffect } from 'react';
import type {
  ApiKeyDto,
  CreateApiKeyRequest,
  IntegrationProviderDto,
  IntegrationProviderKey,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface IntegrationsViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function IntegrationsView({ onNotify }: IntegrationsViewProps) {
  const [subTab, setSubTab] = useState<'providers' | 'keys'>('providers');
  const [providers, setProviders] = useState<IntegrationProviderDto[]>([]);
  const [keys, setKeys] = useState<ApiKeyDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New Key Modal
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScopes, setKeyScopes] = useState('leads:write, tasks:read');
  const [keyExpiryDays, setKeyExpiryDays] = useState('90');
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState(false);

  // Connect Provider Modal
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProviderDto | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersRes, keysRes] = await Promise.all([
        apiClient.getIntegrationProviders(),
        apiClient.getApiKeys(),
      ]);
      setProviders(providersRes);
      setKeys(keysRes);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری اتصالات و کلیدها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      setSubmittingKey(true);
      const scopes = keyScopes
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await apiClient.createApiKey({
        name: keyName.trim(),
        scopes,
        expiresInDays: Number(keyExpiryDays) || 90,
      });

      setKeys((prev) => [created, ...prev]);
      setCreatedSecretKey(created.secretKey || null);
      setKeyName('');
      onNotify?.(`کلید دسترسی «${created.name}» با موفقیت ایجاد شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد کلید API', 'error');
    } finally {
      setSubmittingKey(false);
    }
  };

  const handleRevokeKey = async (key: ApiKeyDto) => {
    if (!window.confirm(`آیا از ابطال دائم کلید دسترسی «${key.name}» اطمینان دارید؟`)) return;

    try {
      await apiClient.revokeApiKey(key.id);
      setKeys((prev) => prev.map((k) => (k.id === key.id ? { ...k, active: false } : k)));
      onNotify?.(`کلید دسترسی «${key.name}» باطل گردید`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ابطال کلید دسترسی', 'error');
    }
  };

  const handleConnectProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingProvider) return;

    try {
      setConnecting(true);
      const updated = await apiClient.connectIntegrationProvider({
        providerKey: connectingProvider.providerKey,
        credentials: {
          apiKey: apiKeyInput.trim(),
          webhookUrl: webhookUrlInput.trim(),
        },
      });

      setProviders((prev) =>
        prev.map((p) => (p.providerKey === updated.providerKey ? updated : p)),
      );
      setConnectingProvider(null);
      setApiKeyInput('');
      setWebhookUrlInput('');
      onNotify?.(`سرویس «${updated.name}» با موفقیت متصل و همگام‌سازی شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در اتصال به سرویس', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectProvider = async (p: IntegrationProviderDto) => {
    if (!window.confirm(`آیا از قطع اتصال سرویس «${p.name}» مطمئن هستید؟`)) return;

    try {
      const updated = await apiClient.disconnectIntegrationProvider(p.providerKey);
      setProviders((prev) =>
        prev.map((item) => (item.providerKey === p.providerKey ? updated : item)),
      );
      onNotify?.(`اتصال سرویس «${p.name}» قطع شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در قطع اتصال', 'error');
    }
  };

  return (
    <div className="space-y-4" data-testid="integrations-view">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>🔌</span>
            <span>اتصالات خارجی و مدیریت کلیدهای API (Integrations & Credentials)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            یکپارچه‌سازی با ارائه‌دهندگان سرویس (Slack, GitHub, SMS)، کلیدهای امنیتی با سقف اعتبار و هش رمزنگاری
          </p>
        </div>

        {subTab === 'keys' && (
          <button
            type="button"
            onClick={() => {
              setCreatedSecretKey(null);
              setIsKeyModalOpen(true);
            }}
            data-testid="create-key-btn"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
          >
            <span>+</span>
            <span>ایجاد کلید دسترسی جدید</span>
          </button>
        )}
      </div>

      {/* Sub-tabs switcher */}
      <div className="flex gap-2 text-xs font-medium border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('providers')}
          data-testid="tab-providers"
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            subTab === 'providers'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔗</span>
          <span>ارائه‌دهندگان متصل ({providers.filter((p) => p.status === 'CONNECTED').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('keys')}
          data-testid="tab-keys"
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            subTab === 'keys'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔑</span>
          <span>کلیدهای دسترسی API ({keys.length})</span>
        </button>
      </div>

      {/* Providers Sub-tab */}
      {subTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="providers-grid">
          {providers.map((p) => (
            <div
              key={p.providerKey}
              data-testid={`provider-card-${p.providerKey}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{p.name}</h4>
                      <span className="font-mono text-[10px] text-slate-400">
                        {p.providerKey}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'CONNECTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.status === 'CONNECTED' ? '🟢 متصل' : '⚪ غیرفعال'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>

                {p.configSummary && (
                  <div className="text-[11px] bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 font-mono text-slate-300 space-y-0.5">
                    {Object.entries(p.configSummary).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}:</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">
                  {p.lastSyncedAt
                    ? `آخرین تبادل: ${new Date(p.lastSyncedAt).toLocaleTimeString('fa-IR')}`
                    : 'بدون سابقه تبادل'}
                </span>

                {p.status === 'CONNECTED' ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnectProvider(p)}
                    data-testid={`disconnect-btn-${p.providerKey}`}
                    className="px-3 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs transition-colors"
                  >
                    قطع اتصال
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConnectingProvider(p)}
                    data-testid={`connect-btn-${p.providerKey}`}
                    className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium shadow transition-colors"
                  >
                    راه‌اندازی و اتصال
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Keys Sub-tab */}
      {subTab === 'keys' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">در حال بارگذاری کلیدها...</div>
          ) : keys.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              کلید دسترسی فعالی تعریف نشده است.
            </div>
          ) : (
            <table className="w-full text-right text-xs divide-y divide-slate-800">
              <thead className="bg-slate-800/70 text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">نام کلید</th>
                  <th className="px-4 py-3">پیشوند و شناسه (Prefix)</th>
                  <th className="px-4 py-3">دسترسی‌ها (Scopes)</th>
                  <th className="px-4 py-3">تاریخ ایجاد</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60" data-testid="keys-tbody">
                {keys.map((key) => (
                  <tr
                    key={key.id}
                    data-testid={`key-row-${key.id}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-indigo-400 text-[11px]">
                      {key.keyPrefix}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {key.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(key.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          key.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {key.active ? 'فعال' : 'باطل‌شده (Revoked)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {key.active && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(key)}
                          data-testid={`revoke-key-btn-${key.id}`}
                          className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[11px] transition-colors"
                        >
                          ابطال کلید
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Key Modal */}
      {isKeyModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-key-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">ایجاد کلید دسترسی API جدید</h3>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {createdSecretKey ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-950/80 border border-amber-800 text-amber-200 text-xs rounded-lg space-y-1">
                  <div className="font-bold">⚠️ هشدار امنیتی بسیار مهم:</div>
                  <p>
                    این کلید تنها <strong>یک بار</strong> نمایش داده می‌شود. لطفاً آن را کپی کرده و
                    در محلی امن ذخیره فرمایید.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    کلید دسترسی کامل (Secret API Key)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdSecretKey}
                      data-testid="secret-key-output"
                      className="w-full px-3 py-2 bg-slate-950 border border-indigo-700 rounded-lg text-emerald-400 text-xs font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSecretKey);
                        onNotify?.('کلید دسترسی در کلیپ‌بورد کپی شد', 'success');
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                      کپی
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsKeyModalOpen(false);
                      setCreatedSecretKey(null);
                    }}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                  >
                    بستن پنجره
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">نام کلید *</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="مثال: سرور انبارداری و یکپارچه‌سازی فروش"
                    data-testid="key-name-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    محدوده دسترسی‌ها (Scopes)
                  </label>
                  <input
                    type="text"
                    value={keyScopes}
                    onChange={(e) => setKeyScopes(e.target.value)}
                    placeholder="leads:write, tasks:read"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    مدت اعتبار (روز)
                  </label>
                  <select
                    value={keyExpiryDays}
                    onChange={(e) => setKeyExpiryDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="30">۳۰ روز</option>
                    <option value="90">۹۰ روز (پیش‌فرض)</option>
                    <option value="365">۱ سال</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submittingKey}
                    data-testid="submit-key-btn"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                  >
                    {submittingKey ? 'در حال صدور...' : 'تولید و صدور کلید'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Connect Provider Modal */}
      {connectingProvider && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="connect-provider-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>{connectingProvider.icon}</span>
                <span>اتصال به {connectingProvider.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setConnectingProvider(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectProviderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  توکن اعتبارسنجی یا کلید دسترسی (API Token) *
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="xoxb-..."
                  data-testid="provider-token-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm font-mono focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  آدرس وب‌هوک یا هوک وب‌سرور (Webhook URL)
                </label>
                <input
                  type="url"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  placeholder="https://api.service.com/webhook"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConnectingProvider(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  data-testid="submit-provider-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {connecting ? 'در حال برقراری اتصال...' : 'تایید و اتصال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationsView;
