import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  INotificationRepository,
  NotificationEntity,
} from './notification.repository.js';
import type { NotificationDto, NotificationPreferencesDto } from '@crm/contracts';
import { OutboxEvent, OutboxService } from '../outbox/outbox.service.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('NOTIFICATION_REPOSITORY')
    private readonly notificationRepo: INotificationRepository,
    private readonly outboxService: OutboxService,
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

  /**
   * Dispatches notifications triggered by domain/outbox events (idempotent via dedupeKey)
   */
  async processEvent(event: OutboxEvent): Promise<void> {
    const { organizationId, eventType, aggregateId, payload } = event;

    if (eventType === 'TaskCreated' && payload.assigneeId) {
      await this.notificationRepo.create({
        organizationId,
        userId: payload.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'تخصیص وظیفه جدید',
        message: `وظیفه ${payload.key} (${payload.title}) به شما واگذار شد.`,
        payload: { taskId: aggregateId, key: payload.key },
        dedupeKey: `task-created-${aggregateId}-${payload.assigneeId}`,
      });
    } else if (eventType === 'TaskStatusTransitioned' && payload.actorId) {
      await this.notificationRepo.create({
        organizationId,
        userId: payload.actorId,
        type: 'TASK_STATUS_CHANGED',
        title: 'تغییر وضعیت وظیفه',
        message: `وضعیت وظیفه ${payload.key} از ${payload.fromStatus} به ${payload.toStatus} تغییر کرد.`,
        payload: { taskId: aggregateId, key: payload.key, status: payload.toStatus },
        dedupeKey: `task-transition-${aggregateId}-${payload.toStatus}`,
      });
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
