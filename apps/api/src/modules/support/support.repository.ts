import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { RecordVisibility, TicketPriority, TicketStatus } from '@crm/contracts';

export type TicketEntity = {
  id: string;
  organizationId: string;
  accountId: string | null;
  assigneeId: string | null;
  reference: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  targetResolutionAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessageEntity = {
  id: string;
  organizationId: string;
  ticketId: string;
  authorId: string | null;
  authorName?: string | null;
  body: string;
  visibility: RecordVisibility;
  createdAt: string;
};

@Injectable()
export class InMemorySupportRepository {
  private tickets: Map<string, TicketEntity> = new Map();
  private messages: Map<string, TicketMessageEntity[]> = new Map(); // ticketId -> messages
  private orgCounter: Map<string, number> = new Map();

  constructor() {
    this.seedDefaultSupportData();
  }

  private seedDefaultSupportData() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const accAlphaId = '50000000-0000-0000-0000-000000000001';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const customerId = '33333333-3333-3333-3333-333333333333';

    // Seed Ticket Alpha
    const ticketAlphaId = '90000000-0000-0000-0000-000000000001';
    this.tickets.set(ticketAlphaId, {
      id: ticketAlphaId,
      organizationId: orgAlpha,
      accountId: accAlphaId,
      assigneeId: employeeAlpha,
      reference: 'TKT-1042',
      title: 'عدم دسترسی به ماژول گزارش‌گیری برای کاربر جدید',
      status: 'OPEN',
      priority: 'HIGH',
      targetResolutionAt: new Date(Date.now() + 3600000 * 8).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.orgCounter.set(orgAlpha, 1042);

    // Messages for TKT-1042
    this.messages.set(ticketAlphaId, [
      {
        id: randomUUID(),
        organizationId: orgAlpha,
        ticketId: ticketAlphaId,
        authorId: customerId,
        authorName: 'کاربر مشتری',
        body: 'سلام، ما نمی‌توانیم گزارش خروجی ماهانه را دریافت کنیم.',
        visibility: 'CUSTOMER_SHARED',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: randomUUID(),
        organizationId: orgAlpha,
        ticketId: ticketAlphaId,
        authorId: employeeAlpha,
        authorName: 'کارشناس پشتیبانی',
        body: 'یادداشت داخلی محرمانه: لاگ سرور بررسی شد، نیاز به ارتقای سطح دسترسی در پایگاه داده دارد.',
        visibility: 'INTERNAL', // MUST NEVER BE EXPOSED TO CUSTOMER PORTAL
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);

    // Seed Ticket Beta (for cross-tenant test)
    const ticketBetaId = '90000000-0000-0000-0000-000000000002';
    this.tickets.set(ticketBetaId, {
      id: ticketBetaId,
      organizationId: orgBeta,
      accountId: null,
      assigneeId: null,
      reference: 'TKT-2001',
      title: 'تیکت محرمانه سازمان بتا',
      status: 'NEW',
      priority: 'NORMAL',
      targetResolutionAt: new Date(Date.now() + 3600000 * 24).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.orgCounter.set(orgBeta, 2001);
  }

  async findTickets(organizationId: string, accountId?: string): Promise<TicketEntity[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.organizationId === organizationId && (!accountId || t.accountId === accountId),
    );
  }

  async findTicketById(organizationId: string, id: string): Promise<TicketEntity | null> {
    const ticket = this.tickets.get(id);
    if (!ticket || ticket.organizationId !== organizationId) return null;
    return ticket;
  }

  async createTicket(data: Omit<TicketEntity, 'id' | 'reference' | 'createdAt' | 'updatedAt'>): Promise<TicketEntity> {
    const counter = (this.orgCounter.get(data.organizationId) ?? 1000) + 1;
    this.orgCounter.set(data.organizationId, counter);

    const id = randomUUID();
    const entity: TicketEntity = {
      ...data,
      id,
      reference: `TKT-${counter}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tickets.set(id, entity);
    this.messages.set(id, []);
    return entity;
  }

  async findMessages(
    organizationId: string,
    ticketId: string,
    canViewInternal: boolean,
  ): Promise<TicketMessageEntity[]> {
    const msgs = this.messages.get(ticketId) ?? [];
    return msgs.filter((m) => {
      if (m.organizationId !== organizationId) return false;
      // Strict access gate: exclude INTERNAL messages if user lacks capability
      if (!canViewInternal && m.visibility === 'INTERNAL') {
        return false;
      }
      return true;
    });
  }

  async addMessage(data: Omit<TicketMessageEntity, 'id' | 'createdAt'>): Promise<TicketMessageEntity> {
    const id = randomUUID();
    const entity: TicketMessageEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    const list = this.messages.get(data.ticketId) ?? [];
    list.push(entity);
    this.messages.set(data.ticketId, list);
    return entity;
  }

  getMessageCount(ticketId: string): number {
    return (this.messages.get(ticketId) ?? []).length;
  }
}
