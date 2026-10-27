import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IMentionRepository, MentionEntity } from './mention.repository.js';
import type { MentionEntityType } from '@crm/contracts';

@Injectable()
export class PrismaMentionRepository implements IMentionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(m: any): MentionEntity {
    return {
      id: m.id,
      organizationId: m.organizationId,
      sourceEntityType: m.sourceEntityType as MentionEntityType,
      sourceEntityId: m.sourceEntityId,
      sourceTitle: m.sourceTitle,
      authorId: m.authorId,
      authorName: m.authorName,
      recipientId: m.recipientId,
      recipientName: m.recipientName,
      contextSnippet: m.contextSnippet,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    };
  }

  async findByRecipient(organizationId: string, recipientId: string): Promise<MentionEntity[]> {
    const rows = await (this.prisma.tenantClient as any).mention.findMany({
      where: { organizationId, recipientId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((m: any) => this.mapToEntity(m));
  }

  async findById(organizationId: string, id: string): Promise<MentionEntity | null> {
    const row = await (this.prisma.tenantClient as any).mention.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapToEntity(row) : null;
  }

  async create(data: Omit<MentionEntity, 'id' | 'createdAt'>): Promise<MentionEntity> {
    const created = await (this.prisma.tenantClient as any).mention.create({
      data: {
        organizationId: data.organizationId,
        sourceEntityType: data.sourceEntityType,
        sourceEntityId: data.sourceEntityId,
        sourceTitle: data.sourceTitle,
        authorId: data.authorId,
        authorName: data.authorName,
        recipientId: data.recipientId,
        recipientName: data.recipientName,
        contextSnippet: data.contextSnippet,
        readAt: data.readAt ? new Date(data.readAt) : null,
      },
    });
    return this.mapToEntity(created);
  }

  async markAsRead(organizationId: string, id: string): Promise<MentionEntity | null> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return null;
    const updated = await (this.prisma.tenantClient as any).mention.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.mapToEntity(updated);
  }
}
