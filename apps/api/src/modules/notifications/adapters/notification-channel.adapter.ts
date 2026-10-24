export interface NotificationDeliveryResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

export interface NotificationChannelAdapter {
  readonly channelName: string;
  send(
    to: string,
    subject: string,
    message: string,
    metadata?: any,
  ): Promise<NotificationDeliveryResult>;
}

export type INotificationChannelAdapter = NotificationChannelAdapter;
