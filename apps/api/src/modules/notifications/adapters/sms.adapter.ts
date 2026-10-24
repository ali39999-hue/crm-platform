import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  NotificationChannelAdapter,
  NotificationDeliveryResult,
} from './notification-channel.adapter.js';

export type SmsProvider = 'kavenegar' | 'twilio';

/**
 * Validates whether a phone number matches Iranian mobile phone patterns:
 * - 09xxxxxxxxx (11 digits)
 * - +989xxxxxxxxx (13 characters)
 * - 00989xxxxxxxxx (14 digits)
 * - 9xxxxxxxxx (10 digits)
 */
export function isValidIranianMobile(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const iranianMobileRegex = /^(?:(?:\+98|0098|0)?9\d{9})$/;
  return iranianMobileRegex.test(cleaned);
}

/**
 * Normalizes an Iranian mobile phone number to canonical E.164 format (+989xxxxxxxxx).
 */
export function normalizeIranianMobile(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^00989\d{9}$/.test(cleaned)) {
    return `+98${cleaned.slice(4)}`;
  }
  if (/^\+989\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^09\d{9}$/.test(cleaned)) {
    return `+98${cleaned.slice(1)}`;
  }
  if (/^9\d{9}$/.test(cleaned)) {
    return `+98${cleaned}`;
  }
  return cleaned;
}

@Injectable()
export class SmsAdapter implements NotificationChannelAdapter {
  readonly channelName = 'sms';
  private readonly logger = new Logger(SmsAdapter.name);

  private provider: SmsProvider = 'kavenegar';
  private simulateFailure = false;
  private simulatedError = 'Kavenegar SMS gateway unreachable';

  setProvider(provider: SmsProvider): void {
    this.provider = provider;
  }

  getProvider(): SmsProvider {
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
    const rawTo = to ? to.trim() : '';
    const cleanedTo = rawTo.replace(/[\s\-\(\)]/g, '');

    if (this.provider === 'kavenegar') {
      if (!isValidIranianMobile(rawTo)) {
        const errorMsg = `Invalid Iranian mobile number format: ${to}. Expected format: 09xxxxxxxxx or +989xxxxxxxxx`;
        this.logger.warn(`[SmsAdapter] ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } else {
      // Twilio international E.164 validation
      const e164Regex = /^\+?[1-9]\d{6,14}$/;
      if (!cleanedTo || !e164Regex.test(cleanedTo)) {
        const errorMsg = `Invalid phone number format for Twilio: ${to}`;
        this.logger.warn(`[SmsAdapter] ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    }

    if (this.simulateFailure || metadata?._simulateFailure === true) {
      const errorMsg = metadata?._simulatedError || this.simulatedError;
      this.logger.warn(`[SmsAdapter] SMS delivery failed via ${this.provider}: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    const normalizedRecipient =
      this.provider === 'kavenegar' ? normalizeIranianMobile(rawTo) : cleanedTo;
    const messageId = `sms_${this.provider}_${randomUUID()}`;

    this.logger.log(
      `[SmsAdapter] [${this.provider.toUpperCase()}] SMS delivered to ${normalizedRecipient} (messageId: ${messageId})`,
    );

    return {
      success: true,
      messageId,
    };
  }
}
