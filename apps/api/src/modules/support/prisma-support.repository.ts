import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  private macros: Map<string, SupportMacroEntity> = new Map();
  private orgCounter: Map<string, number> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.seedDefaultMacros();
  }

  private seedDefaultMacros() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const seeded: SupportMacroEntity[] = [
      {
        id: 'macro-001',
        organizationId: orgAlpha,
        title: 'پاسخ اولیه و اعلام بررسی فنی',
        shortcut: 'ack',
        category: 'عمومی',
        content: 'با سلام و احترام،\nدرخواست شما دریافت شد و کارشناسان فنی ما در حال بررسی موضوع هستند.',
        tags: ['پاسخ_اولیه', 'پشتیبانی'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    for (const m of seeded) {
      this.macros.set(m.id, m);
    }
  }

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
    const counter = (this.orgCounter.get(data.organizationId) ?? 1000) + 1;
    this.orgCounter.set(data.organizationId, counter);
    const reference = `TKT-${counter}`;

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

  /* Support Macros */

  async findMacros(organizationId: string, category?: string): Promise<SupportMacroEntity[]> {
    return Array.from(this.macros.values()).filter(
      (m) => m.organizationId === organizationId && (!category || m.category === category),
    );
  }

  async findMacroById(organizationId: string, id: string): Promise<SupportMacroEntity | null> {
    const m = this.macros.get(id);
    if (!m || m.organizationId !== organizationId) return null;
    return m;
  }

  async createMacro(
    data: Omit<SupportMacroEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SupportMacroEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const entity: SupportMacroEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.macros.set(id, entity);
    return entity;
  }

  async updateMacro(macro: SupportMacroEntity): Promise<SupportMacroEntity> {
    const updated: SupportMacroEntity = {
      ...macro,
      updatedAt: new Date().toISOString(),
    };
    this.macros.set(macro.id, updated);
    return updated;
  }

  async deleteMacro(organizationId: string, id: string): Promise<boolean> {
    const m = await this.findMacroById(organizationId, id);
    if (!m) return false;
    this.macros.delete(id);
    return true;
  }
}
