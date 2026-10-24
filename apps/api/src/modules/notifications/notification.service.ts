import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import type {
  INotificationRepository,
  NotificationEntity,
} from './notification.repository.js';
import type {
  DeadLetterNotificationDto,
  NotificationDto,
  NotificationPreferencesDto,
} from '@crm/contracts';
import { OutboxEvent, OutboxService } from '../outbox/outbox.service.js';
import {
  NotificationDispatcherService,
  type RetryDeadLetterResult,
} from './notification-dispatcher.service.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('NOTIFICATION_REPOSITORY')
    private readonly notificationRepo: INotificationRepository,
    private readonly outboxService: OutboxService,
    @Optional()
    private readonly dispatcherService?: NotificationDispatcherService,
  ) {}

  async getMyNotifications(organizationId: string, userId: string, limit = 50): Promise<NotificationDto[]> {
    const list = await this.notificationRepo.findByUser(organizationId, userId, limit);
    return list.map((n) => this.mapDto(n));
  }

  async markAsRead(organizationId: string, userId: string, id: string): Promise<NotificationDto> {
    const notif = await this.notificationRepo.markAsRead(organizationId, userId, id);
    if (!notif) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.mapDto(notif);
  }

  async markAllAsRead(organizationId: string, userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.markAllAsRead(organizationId, userId);
    return { count };
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    return this.notificationRepo.getPreferences(userId);
  }

  async setPreferences(userId: string, prefs: NotificationPreferencesDto): Promise<NotificationPreferencesDto> {
    return this.notificationRepo.setPreferences(userId, prefs);
  }

  async getDeadLetters(organizationId: string, limit = 50): Promise<DeadLetterNotificationDto[]> {
    if (!this.dispatcherService) return [];
    return this.dispatcherService.getDeadLetters(organizationId, limit);
  }

  async retryDeadLetter(organizationId: string, id: string): Promise<RetryDeadLetterResult> {
    if (!this.dispatcherService) {
      throw new NotFoundException(`Dead-letter notification dispatcher not available`);
    }
    return this.dispatcherService.retryDeadLetter(organizationId, id);
  }

  /**
   * Dispatches notifications triggered by domain/outbox events (idempotent via dedupeKey)
   */
  async processEvent(event: OutboxEvent): Promise<void> {
    const { organizationId, eventType, aggregateId, payload } = event;

    if (eventType === 'TaskCreated' && payload.assigneeId) {
      const title = 'تخصیص وظیفه جدید';
      const message = `وظیفه ${payload.key} (${payload.title}) به شما واگذار شد.`;
      const dedupeKey = `task-created-${aggregateId}-${payload.assigneeId}`;
      const notifPayload = { taskId: aggregateId, key: payload.key };

      if (this.dispatcherService) {
        await this.dispatcherService.dispatch({
          organizationId,
          userId: payload.assigneeId,
          type: 'TASK_ASSIGNED',
          title,
          message,
          payload: notifPayload,
          dedupeKey,
        });
      } else {
        await this.notificationRepo.create({
          organizationId,
          userId: payload.assigneeId,
          type: 'TASK_ASSIGNED',
          title,
          message,
          payload: notifPayload,
          dedupeKey,
        });
      }
    } else if (eventType === 'TaskStatusTransitioned' && payload.actorId) {
      const title = 'تغییر وضعیت وظیفه';
      const message = `وضعیت وظیفه ${payload.key} از ${payload.fromStatus} به ${payload.toStatus} تغییر کرد.`;
      const dedupeKey = `task-transition-${aggregateId}-${payload.toStatus}`;
      const notifPayload = { taskId: aggregateId, key: payload.key, status: payload.toStatus };

      if (this.dispatcherService) {
        await this.dispatcherService.dispatch({
          organizationId,
          userId: payload.actorId,
          type: 'TASK_STATUS_CHANGED',
          title,
          message,
          payload: notifPayload,
          dedupeKey,
        });
      } else {
        await this.notificationRepo.create({
          organizationId,
          userId: payload.actorId,
          type: 'TASK_STATUS_CHANGED',
          title,
          message,
          payload: notifPayload,
          dedupeKey,
        });
      }
    } else if (eventType === 'CrmLeadConverted') {
      this.logger.log(`Notification processed for lead conversion ${aggregateId}`);
    }
  }

  private mapDto(n: NotificationEntity): NotificationDto {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      readAt: n.readAt,
      dedupeKey: n.dedupeKey,
      createdAt: n.createdAt,
      metadata: n.payload,
    };
  }
}
