import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service.js';
import { InMemoryApiKeyRepository } from './api-key.repository.js';
import { AuditService } from '../audit/audit.service.js';

const smtpFixture = 'smtp-fixture-value';

describe('API Keys & External Integrations Management (R-079 & R-080)', () => {
  let service: ApiKeyService;
  let repo: InMemoryApiKeyRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminActorId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    repo = new InMemoryApiKeyRepository();
    auditService = new AuditService();
    service = new ApiKeyService(repo, auditService);
  });

  describe('API Key Lifecycle', () => {
    it('returns seeded keys for organization and respects tenant boundary', async () => {
      const keysAlpha = await service.getKeys(orgAlpha);
      expect(keysAlpha.length).toBeGreaterThanOrEqual(1);
      expect(keysAlpha[0]?.name).toBe('کلید وب‌سایت اصلی شرکت');
      expect(keysAlpha[0]?.keyPrefix).toBeDefined();

      const keysBeta = await service.getKeys(orgBeta);
      expect(keysBeta.length).toBe(0);
    });

    it('creates a new cryptographically secure API key and returns secretKey only once', async () => {
      const created = await service.createKey(orgAlpha, adminActorId, {
        name: 'کلید وب‌هوک و اتصال انبارداری',
        scopes: ['tasks:read', 'crm:read'],
        expiresInDays: 30,
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('کلید وب‌هوک و اتصال انبارداری');
      expect(created.secretKey).toBeDefined();
      expect(created.secretKey).toMatch(/^crm_live_[a-f0-9]{48}$/);
      expect(created.keyPrefix).toBe(created.secretKey!.slice(0, 16) + '...');
      expect(created.active).toBe(true);

      // Verify audit event
      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'API_KEY_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(adminActorId);

      // Verify subsequent listing does NOT expose secretKey
      const list = await service.getKeys(orgAlpha);
      const retrieved = list.find((k) => k.id === created.id)!;
      expect(retrieved.secretKey).toBeUndefined();
    });

    it('rejects empty key name with BadRequestException', async () => {
      await expect(
        service.createKey(orgAlpha, adminActorId, { name: '  ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('revokes an API key and marks active=false', async () => {
      const res = await service.revokeKey(orgAlpha, adminActorId, 'key-001');
      expect(res.success).toBe(true);

      const list = await service.getKeys(orgAlpha);
      const revoked = list.find((k) => k.id === 'key-001')!;
      expect(revoked.active).toBe(false);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'API_KEY_REVOKED');
      expect(audit).toBeDefined();
    });
  });

  describe('Integration Providers Management', () => {
    it('returns seeded integration providers with status', async () => {
      const providers = await service.getProviders(orgAlpha);
      expect(providers.length).toBeGreaterThanOrEqual(4);
      expect(providers.some((p) => p.providerKey === 'SLACK' && p.status === 'CONNECTED')).toBe(true);
      expect(providers.some((p) => p.providerKey === 'GITHUB' && p.status === 'CONNECTED')).toBe(true);
      expect(providers.some((p) => p.providerKey === 'EMAIL_SMTP' && p.status === 'DISCONNECTED')).toBe(true);
    });

    it('connects a new integration provider and sanitizes credentials', async () => {
      const connected = await service.connectProvider(orgAlpha, adminActorId, {
        providerKey: 'EMAIL_SMTP',
        credentials: {
          host: 'smtp.mailgun.org',
          port: '587',
          user: 'postmaster@company.com',
          password: smtpFixture,
        },
      });

      expect(connected.status).toBe('CONNECTED');
      expect(connected.configSummary?.['host']).toBe('smtp.mailgun.org');
      // Password must be redacted/masked!
      expect(connected.configSummary?.['password']).toContain('****');
      expect(connected.configSummary?.['password']).not.toBe('super_secret_smtp_password');

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'INTEGRATION_CONNECTED');
      expect(audit).toBeDefined();
    });

    it('disconnects an active integration provider', async () => {
      const disconnected = await service.disconnectProvider(orgAlpha, adminActorId, 'SLACK');
      expect(disconnected.status).toBe('DISCONNECTED');
      expect(disconnected.configSummary).toBeUndefined();

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'INTEGRATION_DISCONNECTED');
      expect(audit).toBeDefined();
    });
  });
});
