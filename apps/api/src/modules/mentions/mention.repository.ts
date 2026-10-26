import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { MentionDto, MentionEntityType } from '@crm/contracts';

export type MentionEntity = {
  id: string;
  organizationId: string;
  sourceEntityType: MentionEntityType;
  sourceEntityId: string;
  sourceTitle: string;
  authorId: string;
  authorName: string;
  recipientId: string;
  recipientName: string;
  contextSnippet: string;
  readAt?: string | null | undefined;
  createdAt: string;
};

export interface IMentionRepository {
  findByRecipient(organizationId: string, recipientId: string): Promise<MentionEntity[]>;
  findById(organizationId: string, id: string): Promise<MentionEntity | null>;
  create(data: Omit<MentionEntity, 'id' | 'createdAt'>): Promise<MentionEntity>;
  markAsRead(organizationId: string, id: string): Promise<MentionEntity | null>;
}

@Injectable()
export class InMemoryMentionRepository implements IMentionRepository {
  private mentions: Map<string, MentionEntity> = new Map();

  constructor() {
    this.seedDefaultMentions();
  }

  private seedDefaultMentions() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const adminAlpha = '11111111-1111-1111-1111-111111111111';

    const seeded: MentionEntity[] = [
      {
        id: 'men-001',
        organizationId: orgAlpha,
        sourceEntityType: 'TASK',
        sourceEntityId: '10000000-0000-0000-0000-000000000001',
        sourceTitle: 'بررسی لاگ‌های ورود و اتصال چندمستأجری',
        authorId: adminAlpha,
        authorName: 'علی مدیر',
        recipientId: employeeAlpha,
        recipientName: 'سارا احمدی',
        contextSnippet: '@سارا لطفاً لاگ‌های این وظیفه را قبل از جلسه دمو با پتروشیمی بازبینی کن',
        readAt: null,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'men-002',
        organizationId: orgAlpha,
        sourceEntityType: 'TICKET',
        sourceEntityId: '90000000-0000-0000-0000-000000000001',
        sourceTitle: 'عدم دسترسی به ماژول گزارش‌گیری برای کاربر جدید',
        authorId: '55555555-5555-5555-5555-555555555555',
        authorName: 'پویا مرادی',
        recipientId: employeeAlpha,
        recipientName: 'سارا احمدی',
        contextSnippet: '@سارا مشکل SLA این تیکت رفع شد، لطفاً نسخه نهایی را تایید کنید',
        readAt: new Date(Date.now() - 1800000).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];

    for (const m of seeded) {
      this.mentions.set(m.id, m);
    }
  }

  async findByRecipient(organizationId: string, recipientId: string): Promise<MentionEntity[]> {
    return Array.from(this.mentions.values())
      .filter((m) => m.organizationId === organizationId && m.recipientId === recipientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findById(organizationId: string, id: string): Promise<MentionEntity | null> {
    const m = this.mentions.get(id);
    if (!m || m.organizationId !== organizationId) return null;
    return m;
  }

  async create(data: Omit<MentionEntity, 'id' | 'createdAt'>): Promise<MentionEntity> {
    const id = randomUUID();
    const entity: MentionEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.mentions.set(id, entity);
    return entity;
  }

  async markAsRead(organizationId: string, id: string): Promise<MentionEntity | null> {
    const m = await this.findById(organizationId, id);
    if (!m) return null;
    m.readAt = new Date().toISOString();
    this.mentions.set(id, m);
    return m;
  }
}
