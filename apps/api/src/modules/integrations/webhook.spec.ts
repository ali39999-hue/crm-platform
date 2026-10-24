import { describe, expect, it, beforeEach } from 'vitest';
import crypto, { randomBytes, randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WebhookService } from './webhook.service.js';
import { InMemoryWebhookRepository } from './webhook.repository.js';
import { WebhookController } from './webhook.controller.js';
import { AuditService } from '../audit/audit.service.js';
import type { UserContext } from '../../common/auth/auth.types.js';

describe('Webhook Integrations (F8-04)', () => {
  let webhookRepo: InMemoryWebhookRepository;
  let auditService: AuditService;
  let webhookService: WebhookService;
  let webhookController: WebhookController;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const userAlphaId = '22222222-2222-2222-2222-222222222222';
  const userBetaId = '33333333-3333-3333-3333-333333333333';

  const userAlphaContext: UserContext = {
    id: userAlphaId,
    email: 'admin@alpha.com',
    displayName: 'Alpha Admin',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Org',
      slug: 'alpha-org',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Org',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const userBetaContext: UserContext = {
    id: userBetaId,
    email: 'admin@beta.com',
    displayName: 'Beta Admin',
    activeOrganization: {
      id: orgBeta,
      name: 'Beta Org',
      slug: 'beta-org',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgBeta,
        organizationName: 'Beta Org',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    webhookRepo = new InMemoryWebhookRepository();
    auditService = new AuditService();
    webhookService = new WebhookService(webhookRepo, auditService);
    webhookController = new WebhookController(webhookService);
  });

  // =========================================================================
  // 1. HMAC-SHA256 SIGNATURE GENERATION & VERIFICATION
  // =========================================================================
  describe('1. HMAC-SHA256 Signatures', () => {
    const secret = 'whsec_test_secret_key_1234567890abcdef';
    const payload = { event: 'task.created', id: 'task-100', status: 'TODO' };
    const rawPayload = JSON.stringify(payload);
    const timestamp = 1700000000000;
    const nonce = 'random-nonce-uuid-1234';

    it('generates HMAC-SHA256 signature with sha256= prefix and 64 hex chars', () => {
      const signature = webhookService.computeSignature(secret, rawPayload, timestamp, nonce);

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('generates deterministic signature matching standard crypto.createHmac', () => {
      const expectedMessage = `${timestamp}.${nonce}.${rawPayload}`;
      const expectedHmac = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(expectedMessage)
        .digest('hex')}`;

      const computed = webhookService.computeSignature(secret, rawPayload, timestamp, nonce);
      expect(computed).toBe(expectedHmac);
    });

    it('verifies valid signature successfully', () => {
      const signature = webhookService.computeSignature(secret, payload, timestamp, nonce);
      const isValid = webhookService.verifySignature(secret, payload, signature, timestamp, nonce);

      expect(isValid).toBe(true);
    });

    it('rejects signature if payload is modified / tampered with', () => {
      const signature = webhookService.computeSignature(secret, payload, timestamp, nonce);
      const tamperedPayload = { ...payload, status: 'DONE' };

      const isValid = webhookService.verifySignature(
        secret,
        tamperedPayload,
        signature,
        timestamp,
        nonce,
      );
      expect(isValid).toBe(false);
    });

    it('rejects signature if computed with different secret', () => {
      const wrongSecret = 'whsec_another_attacker_secret_value';
      const signature = webhookService.computeSignature(wrongSecret, payload, timestamp, nonce);

      const isValid = webhookService.verifySignature(secret, payload, signature, timestamp, nonce);
      expect(isValid).toBe(false);
    });

    it('rejects malformed signature headers missing sha256= prefix', () => {
      const rawHex = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${nonce}.${rawPayload}`)
        .digest('hex');

      expect(webhookService.verifySignature(secret, payload, rawHex, timestamp, nonce)).toBe(false);
      expect(webhookService.verifySignature(secret, payload, '', timestamp, nonce)).toBe(false);
    });

    it('verifies signature when only timestamp is provided (fallback)', () => {
      const sigWithoutNonce = webhookService.computeSignature(secret, payload, timestamp);
      const isValid = webhookService.verifySignature(secret, payload, sigWithoutNonce, timestamp);

      expect(isValid).toBe(true);
    });
  });

  // =========================================================================
  // 2. REPLAY PROTECTION (TIMESTAMP & NONCE CHECKS)
  // =========================================================================
  describe('2. Replay Protection', () => {
    const fixedNow = 1700000000000; // Fixed reference time

    it('accepts valid timestamp within 5-minute tolerance window', async () => {
      const recentTimestamp = fixedNow - 2 * 60 * 1000; // 2 minutes ago
      const nonce = randomUUID();

      const result = await webhookService.verifyReplayProtection(
        recentTimestamp,
        nonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('rejects expired timestamp older than 5 minutes (300,000 ms)', async () => {
      const expiredTimestamp = fixedNow - 5 * 60 * 1000 - 1000; // 5m 1s ago
      const nonce = randomUUID();

      const result = await webhookService.verifyReplayProtection(
        expiredTimestamp,
        nonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('rejects future timestamp beyond acceptable clock drift (> 60 seconds)', async () => {
      const futureTimestamp = fixedNow + 90 * 1000; // 90 seconds in future
      const nonce = randomUUID();

      const result = await webhookService.verifyReplayProtection(
        futureTimestamp,
        nonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('future');
    });

    it('accepts slight future drift within 60 seconds (clock skew tolerance)', async () => {
      const slightFutureTimestamp = fixedNow + 15 * 1000; // 15 seconds ahead
      const nonce = randomUUID();

      const result = await webhookService.verifyReplayProtection(
        slightFutureTimestamp,
        nonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );

      expect(result.valid).toBe(true);
    });

    it('rejects replayed nonce used more than once within the window', async () => {
      const timestamp = fixedNow - 30 * 1000; // 30s ago
      const replayedNonce = 'nonce-xyz-replayed-123';

      // First presentation succeeds
      const firstCheck = await webhookService.verifyReplayProtection(
        timestamp,
        replayedNonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );
      expect(firstCheck.valid).toBe(true);

      // Second presentation with same nonce must be rejected as replay
      const secondCheck = await webhookService.verifyReplayProtection(
        timestamp,
        replayedNonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );
      expect(secondCheck.valid).toBe(false);
      expect(secondCheck.reason).toContain('replay detected');
    });

    it('allows same nonce in different organization scopes', async () => {
      const timestamp = fixedNow - 30 * 1000;
      const sharedNonce = 'nonce-cross-org-unique-test';

      const scope1 = await webhookService.verifyReplayProtection(
        timestamp,
        sharedNonce,
        orgAlpha,
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );
      const scope2 = await webhookService.verifyReplayProtection(
        timestamp,
        sharedNonce,
        orgBeta,
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );

      expect(scope1.valid).toBe(true);
      expect(scope2.valid).toBe(true);
    });

    it('correctly handles seconds format timestamps (10-digit epoch)', async () => {
      const secondsTimestamp = Math.floor((fixedNow - 60 * 1000) / 1000); // 1 minute ago in seconds
      const nonce = randomUUID();

      const res = await webhookService.verifyReplayProtection(
        secondsTimestamp,
        nonce,
        'test-scope',
        webhookService.DEFAULT_REPLAY_TOLERANCE_MS,
        fixedNow,
      );
      expect(res.valid).toBe(true);
    });

    it('rejects invalid or missing timestamp values', async () => {
      const resNaN = await webhookService.verifyReplayProtection('not-a-number', 'nonce', 'scope');
      expect(resNaN.valid).toBe(false);
      expect(resNaN.reason).toContain('Invalid');

      const resEmptyNonce = await webhookService.verifyReplayProtection(fixedNow, '', 'scope', 300000, fixedNow);
      expect(resEmptyNonce.valid).toBe(false);
      expect(resEmptyNonce.reason).toContain('nonce');
    });

    it('validates entire webhook request with verifyWebhookRequest', async () => {
      const secret = 'whsec_full_verification_key_test';
      const payload = { action: 'ticket.created', ticketId: 'ticket-1' };
      const now = Date.now();
      const nonce = randomUUID();
      const signature = webhookService.computeSignature(secret, payload, now, nonce);

      // Valid request
      const validRes = await webhookService.verifyWebhookRequest({
        secret,
        payload,
        signature,
        timestamp: now,
        nonce,
        scope: orgAlpha,
      });
      expect(validRes.valid).toBe(true);

      // Tampered signature
      const invalidSigRes = await webhookService.verifyWebhookRequest({
        secret,
        payload,
        signature: 'sha256=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad1',
        timestamp: now,
        nonce: randomUUID(),
        scope: orgAlpha,
      });
      expect(invalidSigRes.valid).toBe(false);
      expect(invalidSigRes.reason).toContain('Invalid HMAC signature');
    });
  });

  // =========================================================================
  // 3. SUBSCRIPTION CRUD & TENANT ISOLATION
  // =========================================================================
  describe('3. Subscription CRUD & Tenant Isolation', () => {
    it('creates a subscription with auto-generated whsec_ secret and audits event', async () => {
      const sub = await webhookService.createSubscription(
        orgAlpha,
        {
          url: 'https://api.example.com/crm-webhook',
          events: ['task.created', 'task.transitioned'],
          description: 'Production integration endpoint',
        },
        userAlphaId,
      );

      expect(sub.id).toBeDefined();
      expect(sub.organizationId).toBe(orgAlpha);
      expect(sub.url).toBe('https://api.example.com/crm-webhook');
      expect(sub.events).toEqual(['task.created', 'task.transitioned']);
      expect(sub.secret).toMatch(/^whsec_[a-f0-9]{48}$/);
      expect(sub.enabled).toBe(true);

      // Audit log check
      const audit = auditService
        .getEvents(orgAlpha)
        .find((a) => a.action === 'WEBHOOK_SUBSCRIPTION_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(userAlphaId);
      expect(audit?.entityId).toBe(sub.id);
    });

    it('creates a subscription with custom secret if supplied', async () => {
      const customSecret = 'my_custom_secret_key_from_user';
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://example.com/hook',
        events: ['lead.converted'],
        secret: customSecret,
      });

      expect(sub.secret).toBe(customSecret);
    });

    it('rejects invalid or unsafe URL schemes', async () => {
      await expect(
        webhookService.createSubscription(orgAlpha, {
          url: 'javascript:alert(1)',
          events: ['task.created'],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        webhookService.createSubscription(orgAlpha, {
          url: 'ftp://fileserver.local/webhook',
          events: ['task.created'],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        webhookService.createSubscription(orgAlpha, {
          url: 'not-even-a-url',
          events: ['task.created'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects subscription with empty events array', async () => {
      await expect(
        webhookService.createSubscription(orgAlpha, {
          url: 'https://example.com/hook',
          events: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces tenant isolation: orgBeta cannot see, get, update, or delete orgAlpha subscriptions', async () => {
      // Create sub for Org Alpha
      const alphaSub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://alpha.example.com/hook',
        events: ['task.created'],
      });

      // Org Alpha can see it
      const alphaList = await webhookService.getSubscriptions(orgAlpha);
      expect(alphaList.some((s) => s.id === alphaSub.id)).toBe(true);

      // Org Beta sees none of Org Alpha's subscriptions
      const betaList = await webhookService.getSubscriptions(orgBeta);
      expect(betaList.some((s) => s.id === alphaSub.id)).toBe(false);

      // Org Beta cannot get it
      await expect(webhookService.getSubscription(orgBeta, alphaSub.id)).rejects.toThrow(
        NotFoundException,
      );

      // Org Beta cannot update it
      await expect(
        webhookService.updateSubscription(orgBeta, alphaSub.id, { description: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);

      // Org Beta cannot delete it
      await expect(webhookService.deleteSubscription(orgBeta, alphaSub.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates subscription fields and audits update', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://old.example.com/hook',
        events: ['task.created'],
      });

      const updated = await webhookService.updateSubscription(
        orgAlpha,
        sub.id,
        {
          url: 'https://new.example.com/hook',
          events: ['task.created', 'ticket.created'],
          enabled: false,
          description: 'Disabled temporarily',
        },
        userAlphaId,
      );

      expect(updated.url).toBe('https://new.example.com/hook');
      expect(updated.events).toEqual(['task.created', 'ticket.created']);
      expect(updated.enabled).toBe(false);
      expect(updated.description).toBe('Disabled temporarily');

      const audit = auditService
        .getEvents(orgAlpha)
        .find((a) => a.action === 'WEBHOOK_SUBSCRIPTION_UPDATED');
      expect(audit).toBeDefined();
    });

    it('deletes subscription and removes from list', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://temp.example.com/hook',
        events: ['task.created'],
      });

      const result = await webhookService.deleteSubscription(orgAlpha, sub.id, userAlphaId);
      expect(result.success).toBe(true);

      await expect(webhookService.getSubscription(orgAlpha, sub.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rotates subscription secret and audits action', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://rotate.example.com/hook',
        events: ['lead.converted'],
      });
      const originalSecret = sub.secret;

      const rotated = await webhookService.rotateSecret(orgAlpha, sub.id, userAlphaId);

      expect(rotated.secret).not.toBe(originalSecret);
      expect(rotated.secret).toMatch(/^whsec_[a-f0-9]{48}$/);

      const audit = auditService
        .getEvents(orgAlpha)
        .find((a) => a.action === 'WEBHOOK_SECRET_ROTATED');
      expect(audit).toBeDefined();
    });
  });

  // =========================================================================
  // 4. DELIVERY ATTEMPT LOGGING, RETRIES & EXPONENTIAL BACKOFF
  // =========================================================================
  describe('4. Delivery Attempt Logging & Retry Limits', () => {
    it('logs successful delivery attempt with 200 OK and signed headers', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['task.created'],
      });

      // Mock dispatcher to return 200 OK
      webhookService.setHttpDispatcher(async (url, options) => {
        expect(options.headers['X-Webhook-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
        expect(options.headers['X-Webhook-Timestamp']).toBeDefined();
        expect(options.headers['X-Webhook-Nonce']).toBeDefined();
        return { status: 200, body: '{"received":true}' };
      });

      const delivery = await webhookService.executeDelivery(
        sub,
        'task.created',
        { taskId: 'task-123', title: 'Test Task' },
        1,
      );

      expect(delivery.status).toBe('SUCCESS');
      expect(delivery.statusCode).toBe(200);
      expect(delivery.responseBody).toBe('{"received":true}');
      expect(delivery.attemptNumber).toBe(1);
      expect(delivery.nextRetryAt).toBeNull();
      expect(delivery.error).toBeNull();

      // Ensure delivery is logged in repository
      const logged = await webhookService.getDelivery(orgAlpha, delivery.id);
      expect(logged.status).toBe('SUCCESS');
    });

    it('logs failed delivery attempt with FAILED status and exponential backoff nextRetryAt', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['lead.converted'],
      });

      // Mock dispatcher to return 500 error
      webhookService.setHttpDispatcher(async () => {
        return { status: 500, body: 'Internal Error' };
      });

      const beforeTime = Date.now();
      const delivery = await webhookService.executeDelivery(
        sub,
        'lead.converted',
        { leadId: 'lead-777' },
        1,
      );

      expect(delivery.status).toBe('FAILED');
      expect(delivery.statusCode).toBe(500);
      expect(delivery.attemptNumber).toBe(1);
      expect(delivery.nextRetryAt).toBeDefined();

      // Exponential backoff check: attempt 1 delay is initial backoff (1000ms)
      const nextRetryTime = new Date(delivery.nextRetryAt!).getTime();
      const expectedDelay = webhookService.calculateBackoffDelay(1); // 1000 ms
      expect(nextRetryTime).toBeGreaterThanOrEqual(beforeTime + expectedDelay - 100);
      expect(nextRetryTime).toBeLessThanOrEqual(beforeTime + expectedDelay + 2000);
    });

    it('verifies exponential backoff delay progression across attempts', () => {
      // 1000 * 2^(attempt - 1)
      expect(webhookService.calculateBackoffDelay(1)).toBe(1000); // 1s
      expect(webhookService.calculateBackoffDelay(2)).toBe(2000); // 2s
      expect(webhookService.calculateBackoffDelay(3)).toBe(4000); // 4s
      expect(webhookService.calculateBackoffDelay(4)).toBe(8000); // 8s
      expect(webhookService.calculateBackoffDelay(5)).toBe(16000); // 16s
    });

    it('marks delivery as DEAD_LETTER when maximum retry count (5) is reached', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['ticket.created'],
      });

      webhookService.setHttpDispatcher(async () => {
        return { status: 503, body: 'Service Unavailable' };
      });

      // Execute 5th attempt (max retries reached)
      const deadLetterDelivery = await webhookService.executeDelivery(
        sub,
        'ticket.created',
        { ticketId: 'ticket-999' },
        webhookService.MAX_RETRIES, // 5
      );

      expect(deadLetterDelivery.status).toBe('DEAD_LETTER');
      expect(deadLetterDelivery.statusCode).toBe(503);
      expect(deadLetterDelivery.attemptNumber).toBe(5);
      expect(deadLetterDelivery.nextRetryAt).toBeNull();

      // Check audit event for DEAD_LETTER
      const audit = auditService
        .getEvents(orgAlpha)
        .find((a) => a.action === 'WEBHOOK_DEAD_LETTERED');
      expect(audit).toBeDefined();
      expect(audit?.metadata?.attempts).toBe(5);
    });

    it('simulates retry policy up to dead-letter using simulateRetryPolicy', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['task.transitioned'],
      });

      // Simulate failure on all attempts up to max retries
      const attempts = await webhookService.simulateRetryPolicy(
        sub,
        'task.transitioned',
        { taskId: 'task-55', newStatus: 'DONE' },
        999, // fail all
      );

      expect(attempts.length).toBe(5);
      expect(attempts[0]?.status).toBe('FAILED');
      expect(attempts[0]?.attemptNumber).toBe(1);
      expect(attempts[3]?.status).toBe('FAILED');
      expect(attempts[3]?.attemptNumber).toBe(4);
      expect(attempts[4]?.status).toBe('DEAD_LETTER');
      expect(attempts[4]?.attemptNumber).toBe(5);
    });

    it('simulates retry policy succeeding on attempt 3', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['task.transitioned'],
      });

      // Succeeds on attempt 3
      const attempts = await webhookService.simulateRetryPolicy(
        sub,
        'task.transitioned',
        { taskId: 'task-55' },
        3,
      );

      expect(attempts.length).toBe(3);
      expect(attempts[0]?.status).toBe('FAILED');
      expect(attempts[1]?.status).toBe('FAILED');
      expect(attempts[2]?.status).toBe('SUCCESS');
      expect(attempts[2]?.attemptNumber).toBe(3);
    });

    it('allows manual retry of a failed delivery attempt', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['task.created'],
      });

      // First attempt fails
      webhookService.setHttpDispatcher(async () => ({ status: 500, body: 'Server Error' }));
      const initialDelivery = await webhookService.executeDelivery(
        sub,
        'task.created',
        { title: 'Retry Me' },
        1,
      );
      expect(initialDelivery.status).toBe('FAILED');

      // Now endpoint recovers, manual retry should succeed with attemptNumber 2
      webhookService.setHttpDispatcher(async () => ({ status: 200, body: '{"ok":true}' }));
      const retried = await webhookService.retryDelivery(orgAlpha, initialDelivery.id);

      expect(retried.status).toBe('SUCCESS');
      expect(retried.attemptNumber).toBe(2);
      expect(retried.statusCode).toBe(200);
    });

    it('rejects manual retry if delivery already succeeded', async () => {
      const sub = await webhookService.createSubscription(orgAlpha, {
        url: 'https://receiver.example.com/webhook',
        events: ['task.created'],
      });

      webhookService.setHttpDispatcher(async () => ({ status: 200, body: 'OK' }));
      const delivery = await webhookService.executeDelivery(sub, 'task.created', {}, 1);

      await expect(webhookService.retryDelivery(orgAlpha, delivery.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('filters deliveries by organization, subscriptionId and status', async () => {
      const subA = await webhookService.createSubscription(orgAlpha, {
        url: 'https://alpha.com/subA',
        events: ['task.created'],
      });
      const subB = await webhookService.createSubscription(orgAlpha, {
        url: 'https://alpha.com/subB',
        events: ['ticket.created'],
      });

      webhookService.setHttpDispatcher(async () => ({ status: 200 }));
      await webhookService.executeDelivery(subA, 'task.created', {}, 1);
      await webhookService.executeDelivery(subB, 'ticket.created', {}, 1);

      const allAlpha = await webhookService.getDeliveries(orgAlpha);
      expect(allAlpha.length).toBe(2);

      const filteredSubA = await webhookService.getDeliveries(orgAlpha, {
        subscriptionId: subA.id,
      });
      expect(filteredSubA.length).toBe(1);
      expect(filteredSubA[0]?.subscriptionId).toBe(subA.id);

      const betaDeliveries = await webhookService.getDeliveries(orgBeta);
      expect(betaDeliveries.length).toBe(0);
    });

    it('dispatches webhooks to multiple active matching subscriptions', async () => {
      const multiSubOrg = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      // Sub 1 listens to task.created
      await webhookService.createSubscription(multiSubOrg, {
        url: 'https://alpha1.com/hook',
        events: ['task.created'],
      });
      // Sub 2 listens to wildcard *
      await webhookService.createSubscription(multiSubOrg, {
        url: 'https://alpha2.com/hook',
        events: ['*'],
      });
      // Sub 3 listens to unrelated lead.converted
      await webhookService.createSubscription(multiSubOrg, {
        url: 'https://alpha3.com/hook',
        events: ['lead.converted'],
      });

      webhookService.setHttpDispatcher(async () => ({ status: 200, body: '{"ok":true}' }));

      const dispatched = await webhookService.dispatchWebhook(multiSubOrg, 'task.created', {
        taskId: 't-1',
      });

      // Sub 1 and Sub 2 matched; Sub 3 was ignored
      expect(dispatched.length).toBe(2);
      expect(dispatched.every((d) => d.status === 'SUCCESS')).toBe(true);
    });
  });

  // =========================================================================
  // 5. CONTROLLER INTEGRATION & PERMISSIONS
  // =========================================================================
  describe('5. Webhook Controller Endpoints', () => {
    it('creates, reads, tests, rotates secret, and deletes through controller', async () => {
      // 1. Create
      const created = await webhookController.createSubscription(userAlphaContext, {
        url: 'https://ctrl.example.com/webhook',
        events: ['task.created', 'task.transitioned'],
        description: 'Controller test',
      });
      expect(created.id).toBeDefined();

      // 2. List
      const list = await webhookController.getSubscriptions(userAlphaContext);
      expect(list.some((s) => s.id === created.id)).toBe(true);

      // 3. Get single
      const fetched = await webhookController.getSubscription(userAlphaContext, created.id);
      expect(fetched.id).toBe(created.id);

      // 4. Test dispatch
      webhookService.setHttpDispatcher(async () => ({ status: 200, body: 'pong' }));
      const testDelivery = await webhookController.testSubscription(
        userAlphaContext,
        created.id,
        { event: 'test.ping' },
      );
      expect(testDelivery.status).toBe('SUCCESS');

      // 5. Rotate secret
      const rotated = await webhookController.rotateSecret(userAlphaContext, created.id);
      expect(rotated.secret).not.toBe(created.secret);

      // 6. Deliveries list
      const deliveries = await webhookController.getDeliveries(
        userAlphaContext,
        created.id,
        undefined,
        '10',
      );
      expect(deliveries.length).toBeGreaterThan(0);

      // 7. Verify endpoint
      const now = Date.now();
      const nonce = randomUUID();
      const testPayload = { ping: true };
      const signature = webhookService.computeSignature(
        rotated.secret,
        testPayload,
        now,
        nonce,
      );

      const verification = await webhookController.verifyWebhook(userAlphaContext, {
        subscriptionId: created.id,
        payload: testPayload,
        signature,
        timestamp: now,
        nonce,
      });
      expect(verification.valid).toBe(true);

      // 8. Delete
      const delRes = await webhookController.deleteSubscription(userAlphaContext, created.id);
      expect(delRes.success).toBe(true);
    });
  });
});
