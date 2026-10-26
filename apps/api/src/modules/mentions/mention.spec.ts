import { describe, expect, it, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MentionService } from './mention.service.js';
import { InMemoryMentionRepository } from './mention.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Team Mentions & Collaboration Inbox (R-065)', () => {
  let service: MentionService;
  let repo: InMemoryMentionRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const employeeAlpha = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'سارا احمدی',
  };
  const adminAlpha = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'علی مدیر',
  };

  beforeEach(() => {
    repo = new InMemoryMentionRepository();
    auditService = new AuditService();
    service = new MentionService(repo, auditService);
  });

  describe('Listing & Organization Isolation', () => {
    it('returns seeded mentions for recipient and filters out other recipients', async () => {
      const mentions = await service.getMentions(orgAlpha, employeeAlpha.id);
      expect(mentions.length).toBeGreaterThanOrEqual(2);
      expect(mentions.every((m) => m.recipientId === employeeAlpha.id)).toBe(true);

      const betaMentions = await service.getMentions(orgBeta, employeeAlpha.id);
      expect(betaMentions.length).toBe(0);
    });
  });

  describe('Creation & Audit', () => {
    it('creates a new mention and records audit event', async () => {
      const created = await service.createMention(orgAlpha, adminAlpha, {
        sourceEntityType: 'DOCUMENT',
        sourceEntityId: 'doc-101',
        sourceTitle: 'دستورالعمل امنیت سازمانی',
        recipientId: employeeAlpha.id,
        contextSnippet: '@سارا لطفاً بخش سوم را بازبینی فرمایید',
      });

      expect(created.id).toBeDefined();
      expect(created.authorName).toBe(adminAlpha.name);
      expect(created.readAt).toBeNull();

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'TEAM_MENTION_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(adminAlpha.id);
    });
  });

  describe('Mark as Read', () => {
    it('allows recipient to mark mention as read', async () => {
      const updated = await service.markAsRead(orgAlpha, employeeAlpha.id, 'men-001');
      expect(updated.readAt).toBeDefined();
      expect(updated.readAt).not.toBeNull();
    });

    it('forbids another user from marking mention as read', async () => {
      await expect(
        service.markAsRead(orgAlpha, 'other-user-id', 'men-001'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for non-existent mention', async () => {
      await expect(
        service.markAsRead(orgAlpha, employeeAlpha.id, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
