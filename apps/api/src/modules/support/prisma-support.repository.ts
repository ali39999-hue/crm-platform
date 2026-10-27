import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ISupportRepository,
  SupportMacroEntity,
  TicketEntity,
  TicketMessageEntity,
} from './support.repository.js';
import type { RecordVisibility, TicketPriority, TicketStatus } from '@crm/contracts';

@Injectable()
export class PrismaSupportRepository implements ISupportRepository {
  constructor(private readonly prisma: PrismaService) {}


  private mapTicket(t: any): TicketEntity {
    return {
      id: t.id,
      organizationId: t.organizationId,
      accountId: t.accountId ?? null,
      assigneeId: t.assigneeId ?? null,
      reference: t.reference,
      title: t.title,
      status: t.status as TicketStatus,
      priority: t.priority as TicketPriority,
      targetResolutionAt: t.targetResolutionAt ? (t.targetResolutionAt instanceof Date ? t.targetResolutionAt.toISOString() : t.targetResolutionAt) : new Date(Date.now() + 86400000).toISOString(),
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    };
  }

  private mapMessage(m: any): TicketMessageEntity {
    return {
      id: m.id,
      organizationId: m.organizationId ?? '',
      ticketId: m.ticketId,
      authorId: m.authorId ?? null,
      authorName: m.author?.displayName ?? m.authorName ?? null,
      body: m.body,
      visibility: m.visibility as RecordVisibility,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    };
  }

  async findTickets(organizationId: string, accountId?: string): Promise<TicketEntity[]> {
    const where: any = { organizationId };
    if (accountId) where.accountId = accountId;

    const list = await (this.prisma.tenantClient as any).ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return list.map((t: any) => this.mapTicket(t));
  }

  async findTicketById(organizationId: string, id: string): Promise<TicketEntity | null> {
    const ticket = await (this.prisma.tenantClient as any).ticket.findUnique({
      where: { id },
    });
    if (!ticket || ticket.organizationId !== organizationId) return null;
    return this.mapTicket(ticket);
  }

  async createTicket(
    data: Omit<TicketEntity, 'id' | 'reference' | 'createdAt' | 'updatedAt'>,
  ): Promise<TicketEntity> {
    const reference = `TKT-${await this.nextTicketReference(data.organizationId)}`;

    const created = await (this.prisma.tenantClient as any).ticket.create({
      data: {
        organizationId: data.organizationId,
        accountId: data.accountId,
        assigneeId: data.assigneeId,
        reference,
        title: data.title,
        status: data.status,
        priority: data.priority,
      },
    });

    return {
      ...this.mapTicket(created),
      targetResolutionAt: data.targetResolutionAt,
    };
  }

  async updateTicket(ticket: TicketEntity): Promise<TicketEntity> {
    const updated = await (this.prisma.tenantClient as any).ticket.update({
      where: { id: ticket.id },
      data: {
        status: ticket.status,
        assigneeId: ticket.assigneeId,
        priority: ticket.priority,
      },
    });
    return this.mapTicket(updated);
  }

  async isTicketOwnedByUser(organizationId: string, ticketId: string, userId: string): Promise<boolean> {
    const ticket = await this.findTicketById(organizationId, ticketId);
    if (!ticket) return false;
    if (ticket.assigneeId === userId) return true;

    const messages = await (this.prisma.tenantClient as any).ticketMessage.findMany({
      where: { ticketId, authorId: userId },
      take: 1,
    });
    return messages.length > 0;
  }

  async findMessages(
    organizationId: string,
    ticketId: string,
    canViewInternal: boolean,
  ): Promise<TicketMessageEntity[]> {
    const where: any = { ticketId };
    if (!canViewInternal) {
      where.visibility = 'CUSTOMER_SHARED';
    }

    const messages = await (this.prisma.tenantClient as any).ticketMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m: any) => ({
      ...this.mapMessage(m),
      organizationId,
    }));
  }

  async addMessage(
    data: Omit<TicketMessageEntity, 'id' | 'createdAt'>,
  ): Promise<TicketMessageEntity> {
    const created = await (this.prisma.tenantClient as any).ticketMessage.create({
      data: {
        ticketId: data.ticketId,
        authorId: data.authorId,
        body: data.body,
        visibility: data.visibility,
      },
    });
    return {
      ...this.mapMessage(created),
      organizationId: data.organizationId,
    };
  }

  getMessageCount(ticketId: string): number {
    return 1;
  }

  /**
   * Atomic per-organization ticket sequence (TKT-1001, TKT-1002, ...).
   * updateMany first so two concurrent creates never share a number; the
   * Ticket table's @@unique([organizationId, reference]) is the backstop.
   */
  private async nextTicketReference(organizationId: string): Promise<number> {
    const client = this.prisma.tenantClient as any;
    const bumped = await client.supportSequence.updateMany({
      where: { organizationId },
      data: { lastValue: { increment: 1 } },
    });
    if (bumped?.count === 1) {
      const row = await client.supportSequence.findUnique({ where: { organizationId } });
      return row!.lastValue;
    }
    const created = await client.supportSequence
      .create({ data: { organizationId, lastValue: 1001 } })
      .catch(() => null);
    if (created) return created.lastValue;
    const row = await client.supportSequence.findUnique({ where: { organizationId } });
    return row!.lastValue;
  }

  private mapMacro(m: any): SupportMacroEntity {
    return {
      id: m.id,
      organizationId: m.organizationId,
      title: m.title,
      shortcut: m.shortcut,
      category: m.category,
      content: m.content,
      tags: m.tags ?? [],
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }

  /* Support Macros */

  async findMacros(organizationId: string, category?: string): Promise<SupportMacroEntity[]> {
    const where: any = { organizationId };
    if (category) where.category = category;
    const rows = await (this.prisma.tenantClient as any).supportMacro.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((m: any) => this.mapMacro(m));
  }

  async findMacroById(organizationId: string, id: string): Promise<SupportMacroEntity | null> {
    const row = await (this.prisma.tenantClient as any).supportMacro.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapMacro(row) : null;
  }

  async createMacro(
    data: Omit<SupportMacroEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SupportMacroEntity> {
    const created = await (this.prisma.tenantClient as any).supportMacro.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        shortcut: data.shortcut,
        category: data.category,
        content: data.content,
        tags: data.tags ?? [],
      },
    });
    return this.mapMacro(created);
  }

  async updateMacro(macro: SupportMacroEntity): Promise<SupportMacroEntity> {
    const updated = await (this.prisma.tenantClient as any).supportMacro.update({
      where: { id: macro.id },
      data: {
        title: macro.title,
        shortcut: macro.shortcut,
        category: macro.category,
        content: macro.content,
        tags: macro.tags ?? [],
      },
    });
    return this.mapMacro(updated);
  }

  async deleteMacro(organizationId: string, id: string): Promise<boolean> {
    const m = await this.findMacroById(organizationId, id);
    if (!m) return false;
    await (this.prisma.tenantClient as any).supportMacro.delete({ where: { id } });
    return true;
  }
}
