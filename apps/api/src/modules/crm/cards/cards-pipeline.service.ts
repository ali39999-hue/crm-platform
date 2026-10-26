import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateProjectCardRequest,
  HandoffDealToProjectRequest,
  ProjectCardDto,
  ProjectCardStage,
  UpdateProjectCardRequest,
} from '@crm/contracts';
import { ICrmRepository } from '../crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

@Injectable()
export class CardsPipelineService {
  // In-memory store: organizationId -> Map<cardId, ProjectCardDto>
  private cards: Map<string, Map<string, ProjectCardDto>> = new Map();

  constructor(
    @Inject('CRM_REPOSITORY') private readonly crmRepo: ICrmRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async createCard(
    organizationId: string,
    actorId: string,
    dto: CreateProjectCardRequest,
    requestId?: string,
  ): Promise<ProjectCardDto> {
    let accountName: string | undefined;

    if (dto.accountId) {
      const acc = await this.crmRepo.findAccountById(organizationId, dto.accountId);
      if (acc) accountName = acc.name;
    } else if (dto.dealId) {
      const deal = await this.crmRepo.findDealById(organizationId, dto.dealId);
      if (deal?.accountId) {
        const acc = await this.crmRepo.findAccountById(organizationId, deal.accountId);
        if (acc) accountName = acc.name;
      }
    }

    const cardId = randomUUID();
    const now = new Date().toISOString();

    const card: ProjectCardDto = {
      id: cardId,
      organizationId,
      dealId: dto.dealId ?? null,
      accountId: dto.accountId ?? null,
      accountName,
      title: dto.title.trim(),
      stage: dto.stage ?? 'DOCUMENTS_RECEIVED',
      assignedUserIds: dto.assignedUserIds || [actorId],
      dueDate: dto.dueDate ?? null,
      notes: dto.notes ?? null,
      tags: dto.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    if (!this.cards.has(organizationId)) {
      this.cards.set(organizationId, new Map());
    }
    this.cards.get(organizationId)!.set(cardId, card);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_PROJECT_CARD_CREATED',
      entityType: 'ProjectCard',
      entityId: cardId,
      requestId,
      metadata: {
        title: card.title,
        stage: card.stage,
        dealId: card.dealId,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmProjectCardCreated',
      aggregateType: 'ProjectCard',
      aggregateId: cardId,
      payload: {
        title: card.title,
        stage: card.stage,
      },
    });

    return { ...card };
  }

  async getCards(
    organizationId: string,
    stage?: ProjectCardStage,
  ): Promise<ProjectCardDto[]> {
    const orgCards = this.cards.get(organizationId);
    if (!orgCards) return [];

    let list = Array.from(orgCards.values());
    if (stage) {
      list = list.filter((c) => c.stage === stage);
    }
    return list.map((c) => ({ ...c }));
  }

  async getCardById(organizationId: string, cardId: string): Promise<ProjectCardDto> {
    const orgCards = this.cards.get(organizationId);
    const card = orgCards?.get(cardId);
    if (!orgCards || !card) {
      throw new NotFoundException(`Project card ${cardId} not found in this organization`);
    }
    return { ...card };
  }

  async updateCard(
    organizationId: string,
    actorId: string,
    cardId: string,
    dto: UpdateProjectCardRequest,
    requestId?: string,
  ): Promise<ProjectCardDto> {
    const orgCards = this.cards.get(organizationId);
    const card = orgCards?.get(cardId);
    if (!orgCards || !card) {
      throw new NotFoundException(`Project card ${cardId} not found in this organization`);
    }

    if (dto.title !== undefined) card.title = dto.title.trim();
    if (dto.stage !== undefined) card.stage = dto.stage;
    if (dto.assignedUserIds !== undefined) card.assignedUserIds = dto.assignedUserIds;
    if (dto.dueDate !== undefined) card.dueDate = dto.dueDate;
    if (dto.notes !== undefined) card.notes = dto.notes;
    if (dto.tags !== undefined) card.tags = dto.tags;
    card.updatedAt = new Date().toISOString();

    orgCards.set(cardId, card);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_PROJECT_CARD_UPDATED',
      entityType: 'ProjectCard',
      entityId: cardId,
      requestId,
      metadata: {
        stage: card.stage,
        updates: dto,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmProjectCardUpdated',
      aggregateType: 'ProjectCard',
      aggregateId: cardId,
      payload: {
        stage: card.stage,
      },
    });

    return { ...card };
  }

  async handoffWonDealToProject(
    organizationId: string,
    actorId: string,
    dto: HandoffDealToProjectRequest,
    requestId?: string,
  ): Promise<ProjectCardDto> {
    const deal = await this.crmRepo.findDealById(organizationId, dto.dealId);
    if (!deal) {
      throw new NotFoundException(`Deal ${dto.dealId} not found in this organization`);
    }

    const title = dto.projectTitle?.trim() || `پروژه پس از فروش - ${deal.name}`;
    const card = await this.createCard(
      organizationId,
      actorId,
      {
        dealId: deal.id,
        accountId: deal.accountId || undefined,
        title,
        stage: 'DOCUMENTS_RECEIVED',
        assignedUserIds: dto.assignedUserIds || [actorId],
        dueDate: dto.dueDate || new Date(Date.now() + 86400000 * 30).toISOString(),
        tags: ['خدمات پس از فروش', 'انتقال از قرارداد'],
      },
      requestId,
    );

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_DEAL_HANDED_OFF_TO_PROJECT',
      entityType: 'Deal',
      entityId: deal.id,
      requestId,
      metadata: {
        dealId: deal.id,
        projectCardId: card.id,
        title: card.title,
      },
    });

    return card;
  }
}
