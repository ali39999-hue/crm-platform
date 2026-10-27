import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import crypto, { randomBytes } from 'crypto';
import type {
  ApiKeyDto,
  ConnectIntegrationRequest,
  CreateApiKeyRequest,
  IntegrationProviderDto,
  IntegrationProviderKey,
} from '@crm/contracts';
import {
  type IApiKeyRepository,
  type ApiKeyEntity,
  type IntegrationProviderEntity,
} from './api-key.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @Inject('API_KEY_REPOSITORY')
    private readonly repo: IApiKeyRepository,
    private readonly auditService: AuditService,
  ) {}

  /* API Keys */

  async getKeys(organizationId: string): Promise<ApiKeyDto[]> {
    const list = await this.repo.findKeysByOrg(organizationId);
    return list.map((k) => this.mapDto(k));
  }

  async createKey(
    organizationId: string,
    actorId: string,
    dto: CreateApiKeyRequest,
  ): Promise<ApiKeyDto> {
    if (!dto.name.trim()) {
      throw new BadRequestException('نام کلید دسترسی الزامی است');
    }

    // Generate secure random key: crm_live_<32 hex chars>
    const randomSecret = randomBytes(24).toString('hex');
    const secretKey = `crm_live_${randomSecret}`;
    const keyPrefix = secretKey.slice(0, 16) + '...';

    // Hash key with SHA-256 for secure persistence
    const hashedKey = crypto.createHash('sha256').update(secretKey).digest('hex');

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + 86400000 * dto.expiresInDays).toISOString()
      : undefined;

    const entity = await this.repo.createKey({
      organizationId,
      name: dto.name.trim(),
      keyPrefix,
      hashedKey,
      scopes: dto.scopes ?? ['*'],
      expiresAt,
      active: true,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'API_KEY_CREATED',
      entityType: 'ApiKey',
      entityId: entity.id,
      metadata: { name: entity.name, keyPrefix: entity.keyPrefix },
    });

    return {
      ...this.mapDto(entity),
      secretKey, // Only returned once upon creation!
    };
  }

  async revokeKey(
    organizationId: string,
    actorId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const key = await this.repo.findKeyById(organizationId, id);
    if (!key) {
      throw new NotFoundException(`API key ${id} not found`);
    }

    await this.repo.revokeKey(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'API_KEY_REVOKED',
      entityType: 'ApiKey',
      entityId: id,
      metadata: { name: key.name },
    });

    return { success: true };
  }

  /* Integration Providers */

  async getProviders(organizationId: string): Promise<IntegrationProviderDto[]> {
    const list = await this.repo.findProviders(organizationId);
    return list.map((p) => this.mapProviderDto(p));
  }

  async connectProvider(
    organizationId: string,
    actorId: string,
    dto: ConnectIntegrationRequest,
  ): Promise<IntegrationProviderDto> {
    const existing = await this.repo.findProviderByKey(organizationId, dto.providerKey);

    const providerDefaults = this.getProviderInfo(dto.providerKey);
    const entity: IntegrationProviderEntity = existing
      ? {
          ...existing,
          status: 'CONNECTED',
          configSummary: {
            configuredAt: new Date().toISOString(),
            ...this.sanitizeCredentials(dto.credentials),
          },
          lastSyncedAt: new Date().toISOString(),
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        }
      : {
          id: crypto.randomUUID(),
          organizationId,
          providerKey: dto.providerKey,
          name: providerDefaults.name,
          description: providerDefaults.description,
          icon: providerDefaults.icon,
          status: 'CONNECTED',
          configSummary: this.sanitizeCredentials(dto.credentials),
          lastSyncedAt: new Date().toISOString(),
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        };

    const saved = await this.repo.saveProvider(entity);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'INTEGRATION_CONNECTED',
      entityType: 'IntegrationProvider',
      entityId: saved.id,
      metadata: { providerKey: saved.providerKey, name: saved.name },
    });

    return this.mapProviderDto(saved);
  }

  async disconnectProvider(
    organizationId: string,
    actorId: string,
    providerKey: IntegrationProviderKey,
  ): Promise<IntegrationProviderDto> {
    const existing = await this.repo.findProviderByKey(organizationId, providerKey);
    if (!existing) {
      throw new NotFoundException(`Integration provider ${providerKey} not found`);
    }

    existing.status = 'DISCONNECTED';
    existing.configSummary = undefined;
    existing.updatedAt = new Date().toISOString();

    const saved = await this.repo.saveProvider(existing);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'INTEGRATION_DISCONNECTED',
      entityType: 'IntegrationProvider',
      entityId: saved.id,
      metadata: { providerKey: saved.providerKey },
    });

    return this.mapProviderDto(saved);
  }

  private mapDto(k: ApiKeyEntity): ApiKeyDto {
    const result: ApiKeyDto = {
      id: k.id,
      organizationId: k.organizationId,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      active: k.active,
      createdAt: k.createdAt,
    };
    if (k.lastUsedAt !== undefined) result.lastUsedAt = k.lastUsedAt;
    if (k.expiresAt !== undefined) result.expiresAt = k.expiresAt;
    return result;
  }

  private mapProviderDto(p: IntegrationProviderEntity): IntegrationProviderDto {
    const result: IntegrationProviderDto = {
      id: p.id,
      organizationId: p.organizationId,
      providerKey: p.providerKey,
      name: p.name,
      description: p.description,
      icon: p.icon,
      status: p.status,
      updatedAt: p.updatedAt,
    };
    if (p.configSummary !== undefined) result.configSummary = p.configSummary;
    if (p.lastSyncedAt !== undefined) result.lastSyncedAt = p.lastSyncedAt;
    if (p.errorMessage !== undefined) result.errorMessage = p.errorMessage;
    return result;
  }

  private getProviderInfo(key: IntegrationProviderKey): {
    name: string;
    description: string;
    icon: string;
  } {
    switch (key) {
      case 'SLACK':
        return {
          name: 'پیام‌رسان سازمانی اسلک (Slack)',
          description: 'ارسال خودکار اعلان تیکت‌های فوری و بردهای فرصت‌های فروش به کانال‌های تیم',
          icon: '💬',
        };
      case 'GITHUB':
        return {
          name: 'گیت‌هاب (GitHub)',
          description: 'اتصال ایشوها، کامیت‌ها و ردیابی وظایف فنی به پول‌ریکوئست‌ها',
          icon: '🐙',
        };
      case 'SMS_KAVENEGAR':
        return {
          name: 'سامانه پیامک کاوه‌نگار (SMS Gateway)',
          description: 'ارسال کد تایید ورود دو مرحله‌ای و پیامک تغییر وضعیت تیکت به مشتریان',
          icon: '📱',
        };
      case 'EMAIL_SMTP':
        return {
          name: 'سرور ارسال ایمیل (SMTP)',
          description: 'ارسال فاکتورها، گزارش‌های هفتگی و دعوت‌نامه‌های همکاران',
          icon: '✉️',
        };
      case 'ZAPPER':
        return {
          name: 'زپیر / اتوماسیون وب (Zapier Webhooks)',
          description: 'ارسال بلادرنگ داده‌های CRM به بیش از ۵۰۰۰ اپلیکیشن تجاری',
          icon: '⚡',
        };
    }
  }

  private sanitizeCredentials(creds: Record<string, string>): Record<string, string> {
    const safe: Record<string, string> = {};
    for (const [k, v] of Object.entries(creds)) {
      if (k.toLowerCase().includes('token') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('key') || k.toLowerCase().includes('pass')) {
        safe[k] = v.slice(0, 4) + '****';
      } else {
        safe[k] = v;
      }
    }
    return safe;
  }
}
