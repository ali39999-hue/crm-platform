import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type OutboxEvent = {
  id: string;
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
  processedAt?: string;
};

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private events: OutboxEvent[] = [];

  emit(params: {
    organizationId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, any>;
  }): OutboxEvent {
    const event: OutboxEvent = {
      id: randomUUID(),
      organizationId: params.organizationId,
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      payload: params.payload,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.events.push(event);
    this.logger.log(
      `[OUTBOX] Enqueued event ${event.eventType} for ${event.aggregateType}:${event.aggregateId} (org=${event.organizationId})`,
    );

    // Simulate instant outbox worker dispatch for testing & notifications
    this.processEventStub(event);
    return event;
  }

  private processEventStub(event: OutboxEvent) {
    event.status = 'PROCESSED';
    event.processedAt = new Date().toISOString();
  }

  getEvents(organizationId: string): OutboxEvent[] {
    return this.events.filter((e) => e.organizationId === organizationId);
  }
}
