import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const WEBHOOK_SUPPORTED_EVENTS = [
  'task.created',
  'task.transitioned',
  'lead.created',
  'lead.converted',
  'ticket.created',
  'ticket.resolved',
  'ticket.message_added',
  'deal.created',
  'deal.updated',
  'contact.created',
  'account.created',
] as const;

export type WebhookSupportedEvent = (typeof WEBHOOK_SUPPORTED_EVENTS)[number] | string;

export class CreateWebhookSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @IsString()
  @IsOptional()
  description?: string | undefined;

  @IsString()
  @IsOptional()
  secret?: string | undefined;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean | undefined;
}

export class UpdateWebhookSubscriptionDto {
  @IsString()
  @IsOptional()
  url?: string | undefined;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[] | undefined;

  @IsString()
  @IsOptional()
  description?: string | undefined;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean | undefined;
}

export class TestWebhookSubscriptionDto {
  @IsString()
  @IsOptional()
  event?: string | undefined;

  @IsOptional()
  payload?: Record<string, any> | undefined;
}

export class VerifyWebhookDto {
  @IsNotEmpty()
  payload!: string | Record<string, any>;

  @IsString()
  @IsNotEmpty()
  signature!: string;

  @IsNotEmpty()
  timestamp!: string | number;

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsString()
  @IsOptional()
  secret?: string | undefined;

  @IsString()
  @IsOptional()
  subscriptionId?: string | undefined;
}

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  events: string[];
  description?: string | undefined;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WebhookDeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER';

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  organizationId: string;
  event: string;
  payload: Record<string, any>;
  attemptNumber: number;
  maxRetries: number;
  status: WebhookDeliveryStatus;
  statusCode?: number | null | undefined;
  responseBody?: string | null | undefined;
  error?: string | null | undefined;
  durationMs?: number | undefined;
  headers: Record<string, string>;
  timestamp: string;
  nextRetryAt?: string | null | undefined;
}
