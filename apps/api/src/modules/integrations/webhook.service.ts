import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import crypto, { randomBytes, randomUUID } from 'crypto';
import net from 'net';
import { InMemoryWebhookRepository, type IWebhookRepository } from './webhook.repository.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  CreateWebhookSubscriptionDto,
  TestWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookSubscription,
} from './dto/webhook-subscription.dto.js';

export type HttpDispatcher = (
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body: string;
    timeoutMs: number;
  },
) => Promise<{ status: number; body?: string }>;

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  public readonly DEFAULT_REPLAY_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
  public readonly DEFAULT_MAX_FUTURE_DRIFT_MS = 60 * 1000; // 1 minute
  public readonly MAX_RETRIES = 5;
  public readonly INITIAL_BACKOFF_MS = 1000; // 1 second
  public readonly BACKOFF_MULTIPLIER = 2;

  public allowLocalhostTest = false;

  private httpDispatcher: HttpDispatcher;

  constructor(
    private readonly repository: InMemoryWebhookRepository,
    private readonly auditService: AuditService,
  ) {
    this.httpDispatcher = this.defaultDispatcher.bind(this);
  }

  /**
   * Override dispatcher (for testing or custom transport)
   */
  setHttpDispatcher(dispatcher: HttpDispatcher): void {
    this.httpDispatcher = dispatcher;
  }

  setAllowLocalhostTest(allowed: boolean): void {
    this.allowLocalhostTest = allowed;
  }

  private async defaultDispatcher(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body: string;
      timeoutMs: number;
    },
  ): Promise<{ status: number; body?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const res = await fetch(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });
      const text = await res.text();
      return { status: res.status, body: text };
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------
  // Secret Generation & Cryptographic Signing
  // -------------------------------------------------------------

  generateSecret(): string {
    return `whsec_${randomBytes(24).toString('hex')}`;
  }

  /**
   * Signs payload using HMAC-SHA256.
   * Format: `sha256=<hex>`
   * Signature binds timestamp, nonce, and serialized payload.
   */
  computeSignature(
    secret: string,
    payload: string | Record<string, any>,
    timestamp: number,
    nonce?: string,
  ): string {
    const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = nonce ? `${timestamp}.${nonce}.${rawPayload}` : `${timestamp}.${rawPayload}`;
    const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
    return `sha256=${hmac}`;
  }

  /**
   * Constant-time verification of HMAC-SHA256 signature
   */
  verifySignature(
    secret: string,
    payload: string | Record<string, any>,
    signatureHeader: string,
    timestamp?: number,
    nonce?: string,
  ): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }
    const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Primary check: timestamp + nonce + payload
    if (timestamp !== undefined && nonce !== undefined) {
      const expected = this.computeSignature(secret, rawPayload, timestamp, nonce);
      if (this.timingSafeEqual(signatureHeader, expected)) {
        return true;
      }
    }

    // Secondary check: timestamp + payload
    if (timestamp !== undefined) {
      const expected = this.computeSignature(secret, rawPayload, timestamp);
      if (this.timingSafeEqual(signatureHeader, expected)) {
        return true;
      }
    }

    // Direct check: raw payload alone
    const directExpected = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex')}`;
    if (this.timingSafeEqual(signatureHeader, directExpected)) {
      return true;
    }

    return false;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  // -------------------------------------------------------------
  // Replay Protection
  // -------------------------------------------------------------

  /**
   * Replay protection with timestamp window tolerance and unique nonce check
   */
  async verifyReplayProtection(
    timestampInput: number | string,
    nonce: string,
    scope = 'global',
    toleranceMs = this.DEFAULT_REPLAY_TOLERANCE_MS,
    now = Date.now(),
  ): Promise<{ valid: boolean; reason?: string }> {
    let ts = typeof timestampInput === 'string' ? Number(timestampInput) : timestampInput;

    if (isNaN(ts) || ts <= 0) {
      return { valid: false, reason: 'Invalid or missing timestamp' };
    }

    // Normalize timestamp if supplied in seconds (< 1e11)
    if (ts < 100_000_000_000) {
      ts = ts * 1000;
    }

    // Replay check 1: Reject expired timestamps
    if (now - ts > toleranceMs) {
      return {
        valid: false,
        reason: `Timestamp expired (exceeds replay tolerance window of ${Math.round(
          toleranceMs / 60000,
        )} minutes)`,
      };
    }

    // Replay check 2: Reject future timestamps
    if (ts - now > this.DEFAULT_MAX_FUTURE_DRIFT_MS) {
      return {
        valid: false,
        reason: 'Timestamp is in the future beyond acceptable clock drift',
      };
    }

    // Replay check 3: Nonce validation
    if (!nonce || typeof nonce !== 'string' || nonce.trim().length === 0) {
      return {
        valid: false,
        reason: 'Missing replay protection nonce',
      };
    }

    // Replay check 4: Duplicate nonce check
    const isReplay = await this.repository.hasNonce(scope, nonce, now);
    if (isReplay) {
      return {
        valid: false,
        reason: 'Nonce has already been used (replay detected)',
      };
    }

    // Record nonce until window expires
    await this.repository.recordNonce(scope, nonce, ts + toleranceMs);
    return { valid: true };
  }

  /**
   * Unified webhook verification (verifies replay protection + HMAC signature)
   */
  async verifyWebhookRequest(params: {
    secret: string;
    payload: string | Record<string, any>;
    signature: string;
    timestamp: number | string;
    nonce: string;
    scope?: string;
    toleranceMs?: number;
  }): Promise<{ valid: boolean; reason?: string }> {
    const replayCheck = await this.verifyReplayProtection(
      params.timestamp,
      params.nonce,
      params.scope ?? 'global',
      params.toleranceMs ?? this.DEFAULT_REPLAY_TOLERANCE_MS,
    );

    if (!replayCheck.valid) {
      return replayCheck;
    }

    let ts = typeof params.timestamp === 'string' ? Number(params.timestamp) : params.timestamp;
    if (ts < 100_000_000_000) ts = ts * 1000;

    const signatureValid = this.verifySignature(
      params.secret,
      params.payload,
      params.signature,
      ts,
      params.nonce,
    );

    if (!signatureValid) {
      return { valid: false, reason: 'Invalid HMAC signature' };
    }

    return { valid: true };
  }

  // -------------------------------------------------------------
  // Subscription CRUD
  // -------------------------------------------------------------

  async createSubscription(
    organizationId: string,
    dto: CreateWebhookSubscriptionDto,
    actorId?: string,
  ): Promise<WebhookSubscription> {
    this.validateWebhookUrl(dto.url);

    if (!dto.events || dto.events.length === 0) {
      throw new BadRequestException('At least one event must be subscribed');
    }

    const secret = dto.secret && dto.secret.trim().length > 0 ? dto.secret : this.generateSecret();

    const sub = await this.repository.createSubscription({
      organizationId,
      url: dto.url.trim(),
      secret,
      events: Array.from(new Set(dto.events.map((e) => e.trim()))),
      description: dto.description?.trim(),
      enabled: dto.enabled !== false,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'WEBHOOK_SUBSCRIPTION_CREATED',
      entityType: 'WebhookSubscription',
      entityId: sub.id,
      metadata: { url: sub.url, events: sub.events },
    });

    return sub;
  }

  async getSubscriptions(organizationId: string): Promise<WebhookSubscription[]> {
    return this.repository.findSubscriptionsByOrg(organizationId);
  }

  async getSubscription(organizationId: string, id: string): Promise<WebhookSubscription> {
    const sub = await this.repository.findSubscriptionById(organizationId, id);
    if (!sub) {
      throw new NotFoundException(`Webhook subscription ${id} not found`);
    }
    return sub;
  }

  async updateSubscription(
    organizationId: string,
    id: string,
    dto: UpdateWebhookSubscriptionDto,
    actorId?: string,
  ): Promise<WebhookSubscription> {
    if (dto.url) {
      this.validateWebhookUrl(dto.url);
    }
    if (dto.events !== undefined && dto.events.length === 0) {
      throw new BadRequestException('Events array cannot be empty');
    }

    const updates: Partial<WebhookSubscription> = {};
    if (dto.url) updates.url = dto.url.trim();
    if (dto.events) updates.events = Array.from(new Set(dto.events.map((e) => e.trim())));
    if (dto.description !== undefined) updates.description = dto.description.trim();
    if (dto.enabled !== undefined) updates.enabled = dto.enabled;

    const updated = await this.repository.updateSubscription(organizationId, id, updates);
    if (!updated) {
      throw new NotFoundException(`Webhook subscription ${id} not found`);
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'WEBHOOK_SUBSCRIPTION_UPDATED',
      entityType: 'WebhookSubscription',
      entityId: id,
      metadata: updates,
    });

    return updated;
  }

  async deleteSubscription(
    organizationId: string,
    id: string,
    actorId?: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.repository.deleteSubscription(organizationId, id);
    if (!deleted) {
      throw new NotFoundException(`Webhook subscription ${id} not found`);
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'WEBHOOK_SUBSCRIPTION_DELETED',
      entityType: 'WebhookSubscription',
      entityId: id,
    });

    return { success: true };
  }

  async rotateSecret(
    organizationId: string,
    id: string,
    actorId?: string,
  ): Promise<WebhookSubscription> {
    const existing = await this.getSubscription(organizationId, id);
    const newSecret = this.generateSecret();

    const updated = await this.repository.updateSubscription(organizationId, existing.id, {
      secret: newSecret,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'WEBHOOK_SECRET_ROTATED',
      entityType: 'WebhookSubscription',
      entityId: id,
    });

    return updated!;
  }

  // -------------------------------------------------------------
  // Delivery & Retry Policy
  // -------------------------------------------------------------

  calculateBackoffDelay(
    attemptNumber: number,
    initialMs = this.INITIAL_BACKOFF_MS,
    multiplier = this.BACKOFF_MULTIPLIER,
  ): number {
    return initialMs * Math.pow(multiplier, Math.max(0, attemptNumber - 1));
  }

  async dispatchWebhook(
    organizationId: string,
    event: string,
    payload: Record<string, any>,
  ): Promise<WebhookDelivery[]> {
    const subscriptions = await this.repository.findActiveSubscriptionsByEvent(
      organizationId,
      event,
    );
    const results: WebhookDelivery[] = [];

    for (const sub of subscriptions) {
      this.validateWebhookUrl(sub.url);
      const delivery = await this.executeDelivery(sub, event, payload, 1);
      results.push(delivery);
    }

    return results;
  }

  async testSubscription(
    organizationId: string,
    subscriptionId: string,
    dto?: TestWebhookSubscriptionDto,
  ): Promise<WebhookDelivery> {
    const sub = await this.getSubscription(organizationId, subscriptionId);
    this.validateWebhookUrl(sub.url);
    const event = dto?.event ?? sub.events[0] ?? 'test.ping';
    const payload = dto?.payload ?? {
      event,
      timestamp: new Date().toISOString(),
      organizationId,
      subscriptionId: sub.id,
      message: 'This is a test webhook payload from CRM',
    };

    return this.executeDelivery(sub, event, payload, 1);
  }

  async executeDelivery(
    subscription: WebhookSubscription,
    event: string,
    payload: Record<string, any>,
    attemptNumber: number,
  ): Promise<WebhookDelivery> {
    this.validateWebhookUrl(subscription.url);

    const timestamp = Date.now();
    const nonce = randomUUID();
    const rawPayload = JSON.stringify(payload);
    const signature = this.computeSignature(subscription.secret, rawPayload, timestamp, nonce);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': String(timestamp),
      'X-Webhook-Nonce': nonce,
      'User-Agent': 'CRM-Webhook-Dispatcher/1.0',
    };

    let delivery = await this.repository.createDelivery({
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      event,
      payload,
      attemptNumber,
      maxRetries: this.MAX_RETRIES,
      status: 'PENDING',
      headers,
      timestamp: new Date().toISOString(),
    });

    const startTime = Date.now();
    try {
      const res = await this.httpDispatcher(subscription.url, {
        method: 'POST',
        headers,
        body: rawPayload,
        timeoutMs: 10000,
      });

      const durationMs = Date.now() - startTime;
      const isSuccess = res.status >= 200 && res.status < 300;

      if (isSuccess) {
        delivery = (await this.repository.updateDelivery(
          subscription.organizationId,
          delivery.id,
          {
            status: 'SUCCESS',
            statusCode: res.status,
            responseBody: res.body?.slice(0, 2048) ?? null,
            durationMs,
            error: null,
            nextRetryAt: null,
          },
        ))!;
      } else {
        const isDeadLetter = attemptNumber >= this.MAX_RETRIES;
        const status: WebhookDeliveryStatus = isDeadLetter ? 'DEAD_LETTER' : 'FAILED';
        const delay = this.calculateBackoffDelay(attemptNumber);
        const nextRetryAt = isDeadLetter
          ? null
          : new Date(Date.now() + delay).toISOString();

        delivery = (await this.repository.updateDelivery(
          subscription.organizationId,
          delivery.id,
          {
            status,
            statusCode: res.status,
            responseBody: res.body?.slice(0, 2048) ?? null,
            durationMs,
            error: `HTTP error status ${res.status}`,
            nextRetryAt,
          },
        ))!;

        if (isDeadLetter) {
          this.auditService.record({
            organizationId: subscription.organizationId,
            action: 'WEBHOOK_DEAD_LETTERED',
            entityType: 'WebhookDelivery',
            entityId: delivery.id,
            metadata: { subscriptionId: subscription.id, attempts: attemptNumber, status: res.status },
          });
        }
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const isDeadLetter = attemptNumber >= this.MAX_RETRIES;
      const status: WebhookDeliveryStatus = isDeadLetter ? 'DEAD_LETTER' : 'FAILED';
      const delay = this.calculateBackoffDelay(attemptNumber);
      const nextRetryAt = isDeadLetter
        ? null
        : new Date(Date.now() + delay).toISOString();

      delivery = (await this.repository.updateDelivery(
        subscription.organizationId,
        delivery.id,
        {
          status,
          statusCode: null,
          responseBody: null,
          durationMs,
          error: err?.message ?? 'Network or connection error',
          nextRetryAt,
        },
      ))!;

      if (isDeadLetter) {
        this.auditService.record({
          organizationId: subscription.organizationId,
          action: 'WEBHOOK_DEAD_LETTERED',
          entityType: 'WebhookDelivery',
          entityId: delivery.id,
          metadata: { subscriptionId: subscription.id, attempts: attemptNumber, error: err?.message },
        });
      }
    }

    return delivery;
  }

  async retryDelivery(organizationId: string, deliveryId: string): Promise<WebhookDelivery> {
    const existing = await this.repository.findDeliveryById(organizationId, deliveryId);
    if (!existing) {
      throw new NotFoundException(`Webhook delivery ${deliveryId} not found`);
    }

    if (existing.status === 'SUCCESS') {
      throw new BadRequestException('Webhook delivery has already succeeded');
    }

    const sub = await this.repository.findSubscriptionById(organizationId, existing.subscriptionId);
    if (!sub) {
      throw new NotFoundException(
        `Subscription ${existing.subscriptionId} associated with this delivery not found`,
      );
    }

    const nextAttempt = existing.attemptNumber + 1;
    return this.executeDelivery(sub, existing.event, existing.payload, nextAttempt);
  }

  /**
   * Simulates retry loop for test or backoff validation
   */
  async simulateRetryPolicy(
    subscription: WebhookSubscription,
    event: string,
    payload: Record<string, any>,
    failUntilAttempt = 999,
  ): Promise<WebhookDelivery[]> {
    const attempts: WebhookDelivery[] = [];
    let currentAttempt = 1;

    while (currentAttempt <= this.MAX_RETRIES) {
      // Temporarily mock dispatcher based on currentAttempt
      const originalDispatcher = this.httpDispatcher;
      const shouldFail = currentAttempt < failUntilAttempt;

      this.httpDispatcher = async () => {
        if (shouldFail) {
          return { status: 500, body: 'Internal Server Error' };
        }
        return { status: 200, body: '{"ok":true}' };
      };

      try {
        const del = await this.executeDelivery(
          subscription,
          event,
          payload,
          currentAttempt,
        );
        attempts.push(del);

        if (del.status === 'SUCCESS' || del.status === 'DEAD_LETTER') {
          break;
        }
      } finally {
        this.httpDispatcher = originalDispatcher;
      }

      currentAttempt++;
    }

    return attempts;
  }

  async getDeliveries(
    organizationId: string,
    options?: {
      subscriptionId?: string | undefined;
      status?: WebhookDeliveryStatus | undefined;
      limit?: number | undefined;
    } | undefined,
  ): Promise<WebhookDelivery[]> {
    return this.repository.findDeliveriesByOrg(organizationId, options);
  }

  async getDelivery(organizationId: string, id: string): Promise<WebhookDelivery> {
    const delivery = await this.repository.findDeliveryById(organizationId, id);
    if (!delivery) {
      throw new NotFoundException(`Webhook delivery ${id} not found`);
    }
    return delivery;
  }

  /**
   * SSRF Protection Validator (CRM-040)
   * Enforces protocol safety and blocks loopback, private ranges, link-local,
   * cloud metadata endpoints, IPv6 mapped IPv4, and obfuscated IP formats.
   */
  validateWebhookUrl(url: string): void {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }
    if (parsed.protocol === 'http:' && isProduction && !this.allowLocalhostTest) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }

    // Extract raw host from authority before WHATWG parser normalizes
    const match = url.trim().match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/([^/?#]+)/);
    if (!match || !match[1]) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }
    let rawAuthority: string = match[1];
    const atIdx = rawAuthority.lastIndexOf('@');
    if (atIdx !== -1) {
      rawAuthority = rawAuthority.slice(atIdx + 1);
    }
    let rawHost: string;
    if (rawAuthority.startsWith('[')) {
      const closeBracket = rawAuthority.indexOf(']');
      if (closeBracket === -1) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      rawHost = rawAuthority.slice(0, closeBracket + 1);
    } else {
      rawHost = rawAuthority.split(':')[0] ?? '';
    }

    // Reject obfuscated formats:
    // 1. Hex IP (e.g. 0x7f.0.0.1, 0x7f000001)
    if (/0x[0-9a-fA-F]+/i.test(rawHost)) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }
    // 2. Octal IP (e.g. 0177.0.0.1, 017700000001, or leading 0 in IPv4 segment)
    if (/(^|\.)0[0-7]+(\.|$)/.test(rawHost)) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }
    // 3. Decimal IP (pure dword integer, e.g. 2130706433)
    if (/^\d+$/.test(rawHost)) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }
    // 4. IPv6-mapped IPv4 or IPv4-compatible (e.g. ::ffff:127.0.0.1, [::127.0.0.1], or ffff:)
    if (rawHost.includes(':') && rawHost.includes('.')) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }
    if (/ffff/i.test(rawHost) || /ffff/i.test(parsed.hostname)) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Loopback / localhost checks
    if (!this.allowLocalhostTest) {
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.lan')
      ) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
    }

    // Cloud metadata endpoints
    if (
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata' ||
      hostname === 'instance-data' ||
      hostname === '169.254.169.254'
    ) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }

    // Embedded private IP in hostname (DNS rebinding / nip.io / etc)
    if (
      /(^|\.)(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0)(\.|$)/.test(
        hostname,
      )
    ) {
      throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
    }

    // IPv6 checks
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const ipv6 = hostname.slice(1, -1).toLowerCase();
      if (
        !this.allowLocalhostTest &&
        (ipv6 === '::1' || ipv6 === '::' || ipv6 === '0:0:0:0:0:0:0:1' || ipv6 === '0:0:0:0:0:0:0:0')
      ) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // Link-local IPv6: fe80::/10
      if (/^fe[89ab][0-9a-f]/i.test(ipv6) || ipv6.startsWith('fe80:')) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // Unique local IPv6: fc00::/7
      if (/^f[cd][0-9a-f]{2}:/i.test(ipv6)) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // IPv6 mapped IPv4
      if (ipv6.includes('ffff:') || ipv6.includes('::ffff')) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
    }

    // IPv4 checks
    const ipType = net.isIP(hostname);
    if (ipType === 4) {
      const parts = hostname.split('.').map(Number);
      const p0 = parts[0] ?? -1;
      const p1 = parts[1] ?? -1;
      const p2 = parts[2] ?? -1;
      const p3 = parts[3] ?? -1;

      // 127.0.0.0/8 (Loopback)
      if (p0 === 127 && !this.allowLocalhostTest) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // 0.0.0.0/8 (Current network)
      if (p0 === 0) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // 10.0.0.0/8 (RFC 1918 Private)
      if (p0 === 10) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // 172.16.0.0/12 (RFC 1918 Private: 172.16.0.0 - 172.31.255.255)
      if (p0 === 172 && p1 >= 16 && p1 <= 31) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // 192.168.0.0/16 (RFC 1918 Private)
      if (p0 === 192 && p1 === 168) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // 169.254.0.0/16 (Link-local & AWS metadata 169.254.169.254)
      if (p0 === 169 && p1 === 254) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // 100.64.0.0/10 (Carrier-grade NAT)
      if (p0 === 100 && p1 >= 64 && p1 <= 127) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
      // Broadcast 255.255.255.255
      if (p0 === 255 && p1 === 255 && p2 === 255 && p3 === 255) {
        throw new BadRequestException('SECURITY_ERROR: Webhook URL points to a forbidden destination');
      }
    }
  }

  private validateUrl(url: string): void {
    this.validateWebhookUrl(url);
  }
}
