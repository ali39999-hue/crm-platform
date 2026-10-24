import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { calculateSlaDeadline, isActionAllowed, type MembershipRole } from '@crm/domain';
import {
  InMemorySupportRepository,
  type TicketEntity,
  type TicketMessageEntity,
} from './support.repository.js';
import type { CreateTicketDto } from './dto/create-ticket.dto.js';
import type { AddTicketMessageDto } from './dto/add-ticket-message.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import type { TicketDto, TicketMessageDto } from '@crm/contracts';
import type { UserContext } from '../../common/auth/auth.types.js';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportRepo: InMemorySupportRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async createTicket(
    organizationId: string,
    actorId: string,
    dto: CreateTicketDto,
    requestId?: string,
  ): Promise<TicketDto> {
    const priority = dto.priority ?? 'NORMAL';
    const slaDeadline = calculateSlaDeadline(new Date(), priority);

    const ticket = await this.supportRepo.createTicket({
      organizationId,
      accountId: dto.accountId ?? null,
      assigneeId: dto.assigneeId ?? null,
      customerId: actorId,
      creatorId: actorId,
      title: dto.title.trim(),
      status: 'NEW',
      priority,
      targetResolutionAt: slaDeadline.toISOString(),
    });

    // Create initial message
    await this.supportRepo.addMessage({
      organizationId,
      ticketId: ticket.id,
      authorId: actorId,
      body: dto.description.trim(),
      visibility: 'CUSTOMER_SHARED',
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'TICKET_CREATED',
      entityType: 'Ticket',
      entityId: ticket.id,
      requestId,
      metadata: { reference: ticket.reference, priority: ticket.priority },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'TicketCreated',
      aggregateType: 'Ticket',
      aggregateId: ticket.id,
      payload: { reference: ticket.reference, title: ticket.title },
    });

    return this.mapTicket(ticket);
  }

  async getTickets(organizationId: string, accountId?: string): Promise<TicketDto[]> {
    const list = await this.supportRepo.findTickets(organizationId, accountId);
    return list.map((t) => this.mapTicket(t));
  }

  async getTicketById(organizationId: string, id: string): Promise<TicketDto> {
    const ticket = await this.supportRepo.findTicketById(organizationId, id);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found in this organization`);
    }
    return this.mapTicket(ticket);
  }

  async getTicketMessages(
    organizationId: string,
    userRole: MembershipRole,
    ticketId: string,
  ): Promise<TicketMessageDto[]> {
    const ticket = await this.supportRepo.findTicketById(organizationId, ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found in this organization`);
    }

    // Evaluate if the user role is permitted to see internal notes
    const canViewInternalNotes = isActionAllowed(userRole, 'view_ticket_internal_notes');
    const messages = await this.supportRepo.findMessages(
      organizationId,
      ticketId,
      canViewInternalNotes,
    );

    return messages.map((m) => this.mapMessage(m));
  }

  async addMessage(
    organizationId: string,
    user: UserContext,
    ticketId: string,
    dto: AddTicketMessageDto,
    requestId?: string,
  ): Promise<TicketMessageDto> {
    const ticket = await this.supportRepo.findTicketById(organizationId, ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found in this organization`);
    }

    const visibility = dto.visibility ?? 'CUSTOMER_SHARED';

    // Gate: posting an internal note requires explicit capability
    if (visibility === 'INTERNAL') {
      const allowed = isActionAllowed(user.activeOrganization.role, 'view_ticket_internal_notes');
      if (!allowed) {
        throw new ForbiddenException(
          `Permission denied: role '${user.activeOrganization.role}' cannot post internal notes`,
        );
      }
    }

    const message = await this.supportRepo.addMessage({
      organizationId,
      ticketId,
      authorId: user.id,
      authorName: user.displayName,
      body: dto.body.trim(),
      visibility,
    });

    this.auditService.record({
      organizationId,
      actorId: user.id,
      action: 'TICKET_MESSAGE_ADDED',
      entityType: 'TicketMessage',
      entityId: message.id,
      requestId,
      metadata: { ticketId, visibility: message.visibility },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'TicketMessageAdded',
      aggregateType: 'Ticket',
      aggregateId: ticketId,
      payload: { visibility: message.visibility },
    });

    return this.mapMessage(message);
  }

  private mapTicket(t: TicketEntity): TicketDto {
    return {
      id: t.id,
      reference: t.reference,
      title: t.title,
      status: t.status,
      priority: t.priority,
      accountId: t.accountId,
      assigneeId: t.assigneeId,
      targetResolutionAt: t.targetResolutionAt,
      messagesCount: this.supportRepo.getMessageCount(t.id),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private mapMessage(m: TicketMessageEntity): TicketMessageDto {
    return {
      id: m.id,
      ticketId: m.ticketId,
      authorId: m.authorId,
      authorName: m.authorName ?? null,
      body: m.body,
      visibility: m.visibility,
      createdAt: m.createdAt,
    };
  }
}
