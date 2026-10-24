import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  NotificationChannelAdapter,
  NotificationDeliveryResult,
} from './notification-channel.adapter.js';

export type PushProvider = 'webpush' | 'fcm';

@Injectable()
export class PushAdapter implements NotificationChannelAdapter {
  readonly channelName = 'push';
  private readonly logger = new Logger(PushAdapter.name);

  private provider: PushProvider = 'webpush';
  private simulateFailure = false;
  private simulatedError = 'Push gateway unreachable';

  setProvider(provider: PushProvider): void {
    this.provider = provider;
  }

  getProvider(): PushProvider {
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

    if (!trimmedTo || trimmedTo.length < 8) {
      const errorMsg = `Invalid push target token or subscription endpoint: ${to}`;
      this.logger.warn(`[PushAdapter] ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (this.simulateFailure || metadata?._simulateFailure === true) {
      const errorMsg = metadata?._simulatedError || this.simulatedError;
      this.logger.warn(`[PushAdapter] Push delivery failed via ${this.provider}: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    const messageId = `push_${this.provider}_${randomUUID()}`;

    this.logger.log(
      `[PushAdapter] [${this.provider.toUpperCase()}] Push notification delivered to ${trimmedTo.substring(0, 16)}... (title: "${subject}", messageId: ${messageId})`,
    );

    return {
      success: true,
      messageId,
    };
  }
}
