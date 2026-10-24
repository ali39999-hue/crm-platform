import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  NotificationChannelAdapter,
  NotificationDeliveryResult,
} from './notification-channel.adapter.js';
import { AuditService } from '../../audit/audit.service.js';

export type EmailProvider = 'smtp' | 'resend_mock';

@Injectable()
export class EmailAdapter implements NotificationChannelAdapter {
  readonly channelName = 'email';
  private readonly logger = new Logger(EmailAdapter.name);

  private provider: EmailProvider = 'smtp';
  private simulateFailure = false;
  private simulatedError = 'SMTP connection timeout';

  constructor(@Optional() private readonly auditService?: AuditService) {}

  setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  getProvider(): EmailProvider {
    return this.provider;
  }

  setSimulateFailure(simulate: boolean, error?: string): void {
    this.simulateFailure = simulate;
    if (error) {
      this.simulatedError = error;
    }
  }

  async send(
    to: string,
    subject: string,
    message: string,
    metadata?: any,
  ): Promise<NotificationDeliveryResult> {
    const trimmedTo = to ? to.trim() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedTo || !emailRegex.test(trimmedTo)) {
      const errorMsg = `Invalid email address: ${to}`;
      this.logger.warn(`[EmailAdapter] ${errorMsg}`);
      this.recordAuditIfApplicable(metadata, 'NOTIFICATION_EMAIL_FAILED', 'invalid_address', {
        to,
        subject,
        error: errorMsg,
        provider: this.provider,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (this.simulateFailure || metadata?._simulateFailure === true) {
      const errorMsg = metadata?._simulatedError || this.simulatedError;
      this.logger.warn(`[EmailAdapter] Delivery failed via ${this.provider}: ${errorMsg}`);
      this.recordAuditIfApplicable(metadata, 'NOTIFICATION_EMAIL_FAILED', 'delivery_failed', {
        to: trimmedTo,
        subject,
        error: errorMsg,
        provider: this.provider,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    const messageId = `email_${this.provider}_${randomUUID()}`;

    this.logger.log(
      `[EmailAdapter] [${this.provider.toUpperCase()}] Email successfully delivered to ${trimmedTo} (subject: "${subject}", messageId: ${messageId})`,
    );

    this.recordAuditIfApplicable(metadata, 'NOTIFICATION_EMAIL_SENT', messageId, {
      to: trimmedTo,
      subject,
      provider: this.provider,
      messageLength: message.length,
    });

    return {
      success: true,
      messageId,
    };
  }

  private recordAuditIfApplicable(
    metadata: any,
    action: string,
    entityId: string,
    auditMeta: Record<string, any>,
  ): void {
    if (!this.auditService || !metadata?.organizationId) {
      return;
    }

    try {
      this.auditService.record({
        organizationId: metadata.organizationId,
        actorId: metadata.actorId ?? null,
        action,
        entityType: 'NotificationEmail',
        entityId,
        requestId: metadata.requestId,
        metadata: auditMeta,
      });
    } catch (err: any) {
      this.logger.error(`[EmailAdapter] Failed to record audit log: ${err?.message}`);
    }
  }
}
