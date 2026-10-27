import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { CreateMentionRequest, MentionDto } from '@crm/contracts';
import {
  type IMentionRepository,
  type MentionEntity,
} from './mention.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class MentionService {
  private readonly logger = new Logger(MentionService.name);

  constructor(
    @Inject('MENTION_REPOSITORY')
    private readonly repo: IMentionRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMentions(organizationId: string, recipientId: string): Promise<MentionDto[]> {
    const list = await this.repo.findByRecipient(organizationId, recipientId);
    return list.map((m) => ({ ...m }));
  }

  async createMention(
    organizationId: string,
    author: { id: string; name: string },
    dto: CreateMentionRequest,
  ): Promise<MentionDto> {
    const entity = await this.repo.create({
      organizationId,
      sourceEntityType: dto.sourceEntityType,
      sourceEntityId: dto.sourceEntityId,
      sourceTitle: dto.sourceTitle.trim(),
      authorId: author.id,
      authorName: author.name,
      recipientId: dto.recipientId,
      recipientName: 'همکار سازمانی',
      contextSnippet: dto.contextSnippet.trim(),
      readAt: null,
    });

    this.auditService.record({
      organizationId,
      actorId: author.id,
      action: 'TEAM_MENTION_CREATED',
      entityType: 'Mention',
      entityId: entity.id,
      metadata: {
        recipientId: entity.recipientId,
        sourceType: entity.sourceEntityType,
      },
    });

    return { ...entity };
  }

  async markAsRead(
    organizationId: string,
    recipientId: string,
    id: string,
  ): Promise<MentionDto> {
    const existing = await this.repo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Mention ${id} not found`);
    }

    if (existing.recipientId !== recipientId) {
      throw new ForbiddenException('شما مجاز به علامت‌گذاری منشن سایر کاربران نیستید');
    }

    const updated = await this.repo.markAsRead(organizationId, id);
    return { ...updated! };
  }
}
