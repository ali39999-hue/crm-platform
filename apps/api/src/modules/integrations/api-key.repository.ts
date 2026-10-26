import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ApiKeyDto,
  IntegrationProviderDto,
  IntegrationProviderKey,
  IntegrationStatus,
} from '@crm/contracts';

export type ApiKeyEntity = {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  scopes: string[];
  lastUsedAt?: string | null | undefined;
  expiresAt?: string | null | undefined;
  active: boolean;
  createdAt: string;
};

export type IntegrationProviderEntity = {
  id: string;
  organizationId: string;
  providerKey: IntegrationProviderKey;
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  configSummary?: Record<string, string> | undefined;
  lastSyncedAt?: string | null | undefined;
  errorMessage?: string | null | undefined;
  updatedAt: string;
};

export interface IApiKeyRepository {
  findKeysByOrg(organizationId: string): Promise<ApiKeyEntity[]>;
  findKeyById(organizationId: string, id: string): Promise<ApiKeyEntity | null>;
  createKey(data: Omit<ApiKeyEntity, 'id' | 'createdAt'>): Promise<ApiKeyEntity>;
  revokeKey(organizationId: string, id: string): Promise<boolean>;

  // Providers
  findProviders(organizationId: string): Promise<IntegrationProviderEntity[]>;
  findProviderByKey(organizationId: string, key: IntegrationProviderKey): Promise<IntegrationProviderEntity | null>;
  saveProvider(entity: IntegrationProviderEntity): Promise<IntegrationProviderEntity>;
}

@Injectable()
export class InMemoryApiKeyRepository implements IApiKeyRepository {
  private keys: Map<string, ApiKeyEntity> = new Map();
  private providers: Map<string, IntegrationProviderEntity> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const seededKey: ApiKeyEntity = {
      id: 'key-001',
      organizationId: orgAlpha,
      name: 'کلید وب‌سایت اصلی شرکت',
      keyPrefix: 'crm_live_9f8a',
      hashedKey: 'sha256_mock_hash_for_testing',
      scopes: ['leads:write', 'tasks:read'],
      lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
      active: true,
      createdAt: '2026-10-01T00:00:00.000Z',
    };
    this.keys.set(seededKey.id, seededKey);

    const defaultProviders: Array<Omit<IntegrationProviderEntity, 'id' | 'updatedAt'>> = [
      {
        organizationId: orgAlpha,
        providerKey: 'SLACK',
        name: 'پیام‌رسان سازمانی اسلک (Slack)',
        description: 'ارسال خودکار اعلان تیکت‌های فوری و بردهای فرصت‌های فروش به کانال‌های تیم',
        icon: '💬',
        status: 'CONNECTED',
        configSummary: { channel: '#crm-alerts', botName: 'CRM Bot' },
        lastSyncedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        organizationId: orgAlpha,
        providerKey: 'GITHUB',
        name: 'گیت‌هاب (GitHub)',
        description: 'اتصال ایشوها، کامیت‌ها و ردیابی وظایف فنی به پول‌ریکوئست‌ها',
        icon: '🐙',
        status: 'CONNECTED',
        configSummary: { repo: 'ali39999-hue/crm-platform' },
        lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        organizationId: orgAlpha,
        providerKey: 'SMS_KAVENEGAR',
        name: 'سامانه پیامک کاوه‌نگار (SMS Gateway)',
        description: 'ارسال کد تایید ورود دو مرحله‌ای و پیامک تغییر وضعیت تیکت به مشتریان',
        icon: '📱',
        status: 'CONNECTED',
        configSummary: { senderLine: '10008585' },
        lastSyncedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        organizationId: orgAlpha,
        providerKey: 'EMAIL_SMTP',
        name: 'سرور ارسال ایمیل (SMTP)',
        description: 'ارسال فاکتورها، گزارش‌های هفتگی و دعوت‌نامه‌های همکاران',
        icon: '✉️',
        status: 'DISCONNECTED',
      },
    ];

    for (const p of defaultProviders) {
      const id = randomUUID();
      const entity: IntegrationProviderEntity = {
        ...p,
        id,
        updatedAt: new Date().toISOString(),
      };
      this.providers.set(`${p.organizationId}:${p.providerKey}`, entity);
    }
  }

  async findKeysByOrg(organizationId: string): Promise<ApiKeyEntity[]> {
    return Array.from(this.keys.values())
      .filter((k) => k.organizationId === organizationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findKeyById(organizationId: string, id: string): Promise<ApiKeyEntity | null> {
    const k = this.keys.get(id);
    if (!k || k.organizationId !== organizationId) return null;
    return k;
  }

  async createKey(data: Omit<ApiKeyEntity, 'id' | 'createdAt'>): Promise<ApiKeyEntity> {
    const id = randomUUID();
    const entity: ApiKeyEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.keys.set(id, entity);
    return entity;
  }

  async revokeKey(organizationId: string, id: string): Promise<boolean> {
    const k = await this.findKeyById(organizationId, id);
    if (!k) return false;
    k.active = false;
    return true;
  }

  async findProviders(organizationId: string): Promise<IntegrationProviderEntity[]> {
    return Array.from(this.providers.values()).filter(
      (p) => p.organizationId === organizationId,
    );
  }

  async findProviderByKey(
    organizationId: string,
    key: IntegrationProviderKey,
  ): Promise<IntegrationProviderEntity | null> {
    return this.providers.get(`${organizationId}:${key}`) ?? null;
  }

  async saveProvider(entity: IntegrationProviderEntity): Promise<IntegrationProviderEntity> {
    const updated: IntegrationProviderEntity = {
      ...entity,
      updatedAt: new Date().toISOString(),
    };
    this.providers.set(`${entity.organizationId}:${entity.providerKey}`, updated);
    return updated;
  }
}
