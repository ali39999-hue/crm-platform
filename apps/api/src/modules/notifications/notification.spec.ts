import { describe, expect, it, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { InMemoryNotificationRepository } from './notification.repository.js';
import { OutboxService } from '../outbox/outbox.service.js';

describe('Notification Module & Event Handling', () => {
  let notificationService: NotificationService;
  let notificationRepo: InMemoryNotificationRepository;
  let outboxService: OutboxService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const userAlpha = '22222222-2222-2222-2222-222222222222';
  const userBeta = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    notificationRepo = new InMemoryNotificationRepository();
    outboxService = new OutboxService();
    notificationService = new NotificationService(notificationRepo, outboxService);
  });

  describe('1. Notification Retrieval & Isolation', () => {
    it('returns notifications only for the current user and organization', async () => {
      const list = await notificationService.getMyNotifications(orgAlpha, userAlpha);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((n) => n.title.length > 0)).toBe(true);

      // User Beta should have 0 notifications in Org Beta initially
      const betaList = await notificationService.getMyNotifications(orgBeta, userBeta);
      expect(betaList.length).toBe(0);
    });

    it('marks a single notification as read', async () => {
      const notifId = '99000000-0000-0000-0000-000000000001';
      const updated = await notificationService.markAsRead(orgAlpha, userAlpha, notifId);
      expect(updated.readAt).not.toBeNull();
    });

    it('throws 404 when marking a non-existent notification as read', async () => {
      await expect(
        notificationService.markAsRead(orgAlpha, userAlpha, 'invalid-notif-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('marks all unread notifications as read', async () => {
      const res = await notificationService.markAllAsRead(orgAlpha, userAlpha);
      expect(res.count).toBeGreaterThan(0);

      const list = await notificationService.getMyNotifications(orgAlpha, userAlpha);
      expect(list.every((n) => n.readAt !== null)).toBe(true);
    });
  });

  describe('2. Idempotency & Deduplication', () => {
    it('prevents duplicate notifications with the same dedupeKey', async () => {
      const event = {
        id: 'outbox-1',
        organizationId: orgAlpha,
        eventType: 'TaskCreated',
        aggregateType: 'Task',
        aggregateId: 'task-100',
        payload: {
          key: 'TSK-100',
          title: 'Design DB',
          assigneeId: userAlpha,
        },
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      };

      // Process first time
      await notificationService.processEvent(event);
      const afterFirst = await notificationService.getMyNotifications(orgAlpha, userAlpha);

      // Process second time (retry simulation)
      await notificationService.processEvent(event);
      const afterSecond = await notificationService.getMyNotifications(orgAlpha, userAlpha);

      // Length should not increase due to dedupeKey
      expect(afterSecond.length).toBe(afterFirst.length);
    });
  });

  describe('3. Notification Preferences', () => {
    it('retrieves default preferences and updates them', async () => {
      const defaults = await notificationService.getPreferences(userAlpha);
      expect(defaults.inApp).toBe(true);

      const updated = await notificationService.setPreferences(userAlpha, {
        inApp: true,
        email: false,
        push: true,
        digest: false,
      });

      expect(updated.email).toBe(false);
      expect(updated.push).toBe(true);

      const fetched = await notificationService.getPreferences(userAlpha);
      expect(fetched.email).toBe(false);
      expect(fetched.push).toBe(true);
    });
  });
});
