import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type {
  INotificationRepository,
  NotificationEntity,
} from './notification.repository.js';
import type {
  DeadLetterNotification,
  INotificationDlqRepository,
} from './notification-dlq.repository.js';
import { EmailAdapter } from './adapters/email.adapter.js';
import { PushAdapter } from './adapters/push.adapter.js';
import { SmsAdapter } from './adapters/sms.adapter.js';
import type { NotificationChannelAdapter } from './adapters/notification-channel.adapter.js';
import type { NotificationPreferencesDto } from '@crm/contracts';
import { AuthService } from '../../common/auth/auth.service.js';

export interface DispatchNotificationRequest {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  dedupeKey?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channels?: Array<'inApp' | 'email' | 'push' | 'sms'>;
  recipient?: {
    email?: string;
    pushToken?: string;
    phone?: string;
  };
  digestEligible?: boolean;
  quietHoursOverride?: boolean;
  now?: Date;
}

export interface ChannelDispatchStatus {
  channel: 'inApp' | 'email' | 'push' | 'sms' | string;
  attempted: boolean;
  delivered: boolean;
  messageId?: string | undefined;
  suppressed?: boolean | undefined;
  suppressedReason?: string | undefined;
  queuedForDigest?: boolean | undefined;
  routedToDlq?: boolean | undefined;
  dlqId?: string | undefined;
  retries?: number | undefined;
  error?: string | undefined;
}

export interface DispatchResult {
  notificationId?: string | undefined;
  deduplicated?: boolean | undefined;
  channels: {
    inApp?: ChannelDispatchStatus | undefined;
    email?: ChannelDispatchStatus | undefined;
    push?: ChannelDispatchStatus | undefined;
    sms?: ChannelDispatchStatus | undefined;
    [key: string]: ChannelDispatchStatus | undefined;
  };
}

export interface RetryDeadLetterResult {
  success: boolean;
  item: DeadLetterNotification;
  error?: string | undefined;
  messageId?: string | undefined;
}

export function isWithinQuietHours(
  quietHours: { enabled: boolean; start: string; end: string; timeZone?: string },
  date: Date = new Date(),
): boolean {
  if (!quietHours.enabled) return false;

  const [startH, startM] = quietHours.start.split(':').map(Number);
  const [endH, endM] = quietHours.end.split(':').map(Number);
  if (
    startH === undefined ||
    startM === undefined ||
    endH === undefined ||
    endM === undefined ||
    isNaN(startH) ||
    isNaN(startM) ||
    isNaN(endH) ||
    isNaN(endM)
  ) {
    return false;
  }

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Window spans overnight (e.g. 22:00 -> 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  private maxRetries = 3;
  private retryDelayMs = 0; // 0 default for fast execution/testing, configurable
  private defaultQuietHours: { enabled: boolean; start: string; end: string } | undefined = undefined;

  constructor(
    @Inject('NOTIFICATION_REPOSITORY')
    private readonly notificationRepo: INotificationRepository,
    @Inject('NOTIFICATION_DLQ_REPOSITORY')
    private readonly dlqRepo: INotificationDlqRepository,
    private readonly emailAdapter: EmailAdapter,
    private readonly pushAdapter: PushAdapter,
    private readonly smsAdapter: SmsAdapter,
    @Optional()
    private readonly authService?: AuthService,
  ) {}

  setMaxRetries(retries: number): void {
    this.maxRetries = Math.max(1, retries);
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  setRetryDelayMs(delayMs: number): void {
    this.retryDelayMs = Math.max(0, delayMs);
  }

  setDefaultQuietHours(quietHours: { enabled: boolean; start: string; end: string } | undefined): void {
    this.defaultQuietHours = quietHours;
  }

  /**
   * Main dispatch orchestrator.
   * Evaluates user preferences, checks quiet hours, dispatches to active channels,
   * handles failures with retries, and routes exhausted failures to the DLQ.
   */
  async dispatch(request: DispatchNotificationRequest): Promise<DispatchResult> {
    const { organizationId, userId, title, message, dedupeKey, payload } = request;

    this.logger.log(
      `[Dispatcher] Processing notification "${title}" for user=${userId} in org=${organizationId}`,
    );

    // Fetch user preferences
    const prefs = await this.notificationRepo.getPreferences(userId);

    // Resolve quiet hours policy
    const quietHoursPolicy = prefs.quietHours ?? this.defaultQuietHours;
    const isQuietActive =
      quietHoursPolicy?.enabled && !request.quietHoursOverride && request.priority !== 'URGENT' && request.type !== 'SYSTEM_ALERT'
        ? isWithinQuietHours(quietHoursPolicy, request.now ?? new Date())
        : false;

    const result: DispatchResult = {
      channels: {},
    };

    // 1. In-App Notification Delivery
    const shouldSendInApp =
      request.channels ? request.channels.includes('inApp') : prefs.inApp !== false;

    if (shouldSendInApp) {
      const entity = await this.notificationRepo.create({
        organizationId,
        userId,
        type: request.type,
        title,
        message,
        payload: payload ?? {},
        dedupeKey: dedupeKey ?? null,
      });

      if (entity) {
        result.notificationId = entity.id;
        // Check if existing deduplicated item was returned
        const wasDeduplicated =
          dedupeKey && entity.createdAt && new Date(entity.createdAt).getTime() < Date.now() - 5000;
        result.deduplicated = Boolean(wasDeduplicated);

        result.channels.inApp = {
          channel: 'inApp',
          attempted: true,
          delivered: true,
          messageId: entity.id,
        };
      }
    } else {
      result.channels.inApp = {
        channel: 'inApp',
        attempted: false,
        delivered: false,
        suppressed: true,
        suppressedReason: 'User opted out of in-app notifications',
      };
    }

    // Resolve recipient contacts
    const recipientEmail = this.resolveRecipientEmail(request);
    const recipientPushToken = this.resolveRecipientPushToken(request);
    const recipientPhone = this.resolveRecipientPhone(request);

    // 2. Email Channel
    const shouldSendEmail = request.channels
      ? request.channels.includes('email')
      : Boolean(prefs.email);

    if (shouldSendEmail) {
      if (prefs.digest && request.digestEligible && request.priority !== 'URGENT') {
        result.channels.email = {
          channel: 'email',
          attempted: false,
          delivered: false,
          queuedForDigest: true,
          suppressedReason: 'Queued for periodic email digest',
        };
      } else if (isQuietActive) {
        result.channels.email = {
          channel: 'email',
          attempted: false,
          delivered: false,
          suppressed: true,
          suppressedReason: 'Quiet hours policy active',
        };
      } else {
        const channelResult = await this.deliverWithRetry(
          this.emailAdapter,
          recipientEmail,
          request,
        );
        result.channels.email = channelResult;
      }
    } else {
      result.channels.email = {
        channel: 'email',
        attempted: false,
        delivered: false,
        suppressed: true,
        suppressedReason: 'Email channel not enabled for user',
      };
    }

    // 3. Push Channel
    const shouldSendPush = request.channels
      ? request.channels.includes('push')
      : Boolean(prefs.push);

    if (shouldSendPush) {
      if (isQuietActive) {
        result.channels.push = {
          channel: 'push',
          attempted: false,
          delivered: false,
          suppressed: true,
          suppressedReason: 'Quiet hours policy active',
        };
      } else {
        const channelResult = await this.deliverWithRetry(
          this.pushAdapter,
          recipientPushToken,
          request,
        );
        result.channels.push = channelResult;
      }
    } else {
      result.channels.push = {
        channel: 'push',
        attempted: false,
        delivered: false,
        suppressed: true,
        suppressedReason: 'Push channel not enabled for user',
      };
    }

    // 4. SMS Channel
    const shouldSendSms = request.channels
      ? request.channels.includes('sms')
      : Boolean(prefs.sms);

    if (shouldSendSms) {
      if (isQuietActive) {
        result.channels.sms = {
          channel: 'sms',
          attempted: false,
          delivered: false,
          suppressed: true,
          suppressedReason: 'Quiet hours policy active',
        };
      } else {
        const channelResult = await this.deliverWithRetry(
          this.smsAdapter,
          recipientPhone,
          request,
        );
        result.channels.sms = channelResult;
      }
    } else {
      result.channels.sms = {
        channel: 'sms',
        attempted: false,
        delivered: false,
        suppressed: true,
        suppressedReason: 'SMS channel not enabled for user',
      };
    }

    return result;
  }

  /**
   * Delivers a notification via the given adapter with retry logic.
   * If all retries fail, routes the failed notification to the Dead-Letter Queue (DLQ).
   */
  private async deliverWithRetry(
    adapter: NotificationChannelAdapter,
    recipient: string,
    request: DispatchNotificationRequest,
  ): Promise<ChannelDispatchStatus> {
    let lastError = '';
    let success = false;
    let messageId: string | undefined;
    let attempts = 0;

    for (let i = 0; i < this.maxRetries; i++) {
      attempts++;
      try {
        const res = await adapter.send(recipient, request.title, request.message, {
          ...request.payload,
          organizationId: request.organizationId,
          userId: request.userId,
          actorId: request.userId,
          channel: adapter.channelName,
        });

        if (res.success) {
          success = true;
          messageId = res.messageId;
          break;
        } else {
          lastError = res.error || 'Delivery rejected by channel adapter';
        }
      } catch (err: any) {
        lastError = err?.message || 'Adapter execution threw an exception';
      }

      if (i < this.maxRetries - 1 && this.retryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }

    if (!success) {
      this.logger.warn(
        `[Dispatcher] Channel ${adapter.channelName} failed after ${attempts} attempts. Routing to DLQ. Error: ${lastError}`,
      );

      const dlqEntry = await this.dlqRepo.create({
        organizationId: request.organizationId,
        userId: request.userId,
        channel: adapter.channelName,
        recipient,
        title: request.title,
        message: request.message,
        payload: request.payload,
        dedupeKey: request.dedupeKey ?? null,
        retryCount: attempts,
        maxRetries: this.maxRetries,
        lastError,
        status: 'FAILED',
      });

      return {
        channel: adapter.channelName,
        attempted: true,
        delivered: false,
        routedToDlq: true,
        dlqId: dlqEntry.id,
        retries: attempts,
        error: lastError,
      };
    }

    return {
      channel: adapter.channelName,
      attempted: true,
      delivered: true,
      messageId,
      retries: attempts - 1,
    };
  }

  /**
   * Retrieves DLQ notifications strictly filtered by organizationId.
   */
  async getDeadLetters(organizationId: string, limit = 50): Promise<DeadLetterNotification[]> {
    return this.dlqRepo.findByOrg(organizationId, limit);
  }

  /**
   * Retries a dead-letter notification from the queue.
   */
  async retryDeadLetter(organizationId: string, id: string): Promise<RetryDeadLetterResult> {
    const item = await this.dlqRepo.findById(organizationId, id);
    if (!item) {
      throw new NotFoundException(`Dead-letter notification with ID ${id} not found`);
    }

    const adapter = this.resolveAdapter(item.channel);
    if (!adapter) {
      const errorMsg = `No delivery adapter configured for channel ${item.channel}`;
      await this.dlqRepo.update(organizationId, id, {
        retryCount: item.retryCount + 1,
        lastError: errorMsg,
        failedAt: new Date().toISOString(),
      });
      return {
        success: false,
        item,
        error: errorMsg,
      };
    }

    try {
      const res = await adapter.send(item.recipient, item.title, item.message, {
        ...item.payload,
        organizationId,
        userId: item.userId,
      });

      if (res.success) {
        const updated = await this.dlqRepo.update(organizationId, id, {
          status: 'RESOLVED',
          retryCount: item.retryCount + 1,
          resolvedAt: new Date().toISOString(),
        });
        return {
          success: true,
          item: updated ?? item,
          messageId: res.messageId,
        };
      } else {
        const updated = await this.dlqRepo.update(organizationId, id, {
          status: 'FAILED',
          retryCount: item.retryCount + 1,
          lastError: res.error || 'Retry delivery failed',
          failedAt: new Date().toISOString(),
        });
        return {
          success: false,
          item: updated ?? item,
          error: res.error,
        };
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error occurred during DLQ retry';
      const updated = await this.dlqRepo.update(organizationId, id, {
        status: 'FAILED',
        retryCount: item.retryCount + 1,
        lastError: errorMsg,
        failedAt: new Date().toISOString(),
      });
      return {
        success: false,
        item: updated ?? item,
        error: errorMsg,
      };
    }
  }

  private resolveAdapter(channel: string): NotificationChannelAdapter | null {
    switch (channel.toLowerCase()) {
      case 'email':
        return this.emailAdapter;
      case 'push':
        return this.pushAdapter;
      case 'sms':
        return this.smsAdapter;
      default:
        return null;
    }
  }

  private resolveRecipientEmail(request: DispatchNotificationRequest): string {
    if (request.recipient?.email) {
      return request.recipient.email;
    }
    if (request.payload?.recipientEmail) {
      return request.payload.recipientEmail;
    }
    // Attempt lookup from auth service if available
    if (this.authService && typeof (this.authService as any).findUserById === 'function') {
      const u = (this.authService as any).findUserById(request.userId);
      if (u?.email) return u.email;
    }
    return `${request.userId}@crm.internal`;
  }

  private resolveRecipientPushToken(request: DispatchNotificationRequest): string {
    if (request.recipient?.pushToken) {
      return request.recipient.pushToken;
    }
    if (request.payload?.pushToken) {
      return request.payload.pushToken;
    }
    return `fcm_token_device_${request.userId}`;
  }

  private resolveRecipientPhone(request: DispatchNotificationRequest): string {
    if (request.recipient?.phone) {
      return request.recipient.phone;
    }
    if (request.payload?.recipientPhone) {
      return request.payload.recipientPhone;
    }
    return '09120000000';
  }
}
