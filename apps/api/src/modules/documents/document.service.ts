import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  canAccessDocument,
  assertDocumentAccess,
  canEditDocument,
  sanitizeDocumentContent,
  generateSlug,
  type MembershipRole,
} from '@crm/domain';
import {
  type IDocumentRepository,
  type DocumentEntity,
  type DocumentSpaceEntity,
} from './document.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { ActivityService } from '../activity/activity.service.js';
import type {
  CreateDocumentRequest,
  CreateDocumentSpaceRequest,
  DocumentDetailDto,
  DocumentRevisionDto,
  DocumentSpaceDto,
  DocumentSummaryDto,
  DocumentVisibility,
  UpdateDocumentRequest,
} from '@crm/contracts';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject('DOCUMENT_REPOSITORY')
    private readonly docRepo: IDocumentRepository,
    private readonly auditService: AuditService,
    private readonly activityService: ActivityService,
  ) {}

  /* Spaces */

  async createSpace(
    organizationId: string,
    actorId: string,
    dto: CreateDocumentSpaceRequest,
  ): Promise<DocumentSpaceDto> {
    const slug = generateSlug(dto.name);
    const spaceData: Omit<DocumentSpaceEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      name: dto.name,
      slug,
      icon: dto.icon || 'folder',
      isDefault: false,
    };
    if (dto.description !== undefined) {
      spaceData.description = dto.description;
    }

    const space = await this.docRepo.createSpace(spaceData);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'DOCUMENT_SPACE_CREATED',
      entityType: 'DocumentSpace',
      entityId: space.id,
      metadata: { name: space.name, slug: space.slug },
    });

    return space;
  }

  async getSpaces(organizationId: string): Promise<DocumentSpaceDto[]> {
    return this.docRepo.findSpaces(organizationId);
  }

  /* Documents */

  async createDocument(
    organizationId: string,
    actor: { id: string; name: string; role: MembershipRole },
    dto: CreateDocumentRequest,
  ): Promise<DocumentDetailDto> {
    // 1. Verify space exists in tenant
    const space = await this.docRepo.findSpaceById(organizationId, dto.spaceId);
    if (!space) {
      throw new NotFoundException('فضای اسناد انتخاب‌شده یافت نشد');
    }

    // 2. Validate edit capability
    if (!canEditDocument(actor.role, dto.visibility, true)) {
      throw new ForbiddenException(
        'نقش کاربری شما اجازه ایجاد سند با این سطح دسترسی را ندارد',
      );
    }

    // 3. Sanitize content and generate slug
    const cleanContent = sanitizeDocumentContent(dto.content);
    const slug = generateSlug(dto.title);

    // 4. Persist document
    const createData: Omit<
      DocumentEntity,
      'id' | 'createdAt' | 'updatedAt' | 'version'
    > = {
      organizationId,
      spaceId: dto.spaceId,
      title: dto.title,
      slug,
      content: cleanContent,
      visibility: dto.visibility,
      isPublished: dto.isPublished ?? false,
      authorId: actor.id,
      authorName: actor.name,
      tags: dto.tags ?? [],
    };
    if (dto.associatedEntityType !== undefined) {
      createData.associatedEntityType = dto.associatedEntityType;
    }
    if (dto.associatedEntityId !== undefined) {
      createData.associatedEntityId = dto.associatedEntityId;
    }

    const doc = await this.docRepo.createDocument(createData);

    // 5. Audit log
    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'DOCUMENT_CREATED',
      entityType: 'Document',
      entityId: doc.id,
      metadata: {
        title: doc.title,
        visibility: doc.visibility,
        isPublished: doc.isPublished,
        spaceId: doc.spaceId,
      },
    });

    // 6. If associated with a CRM entity, log activity
    if (doc.associatedEntityType && doc.associatedEntityId) {
      await this.activityService.logActivity({
        organizationId,
        actorId: actor.id,
        actorName: actor.name,
        entityType: doc.associatedEntityType,
        entityId: doc.associatedEntityId,
        kind: 'DOCUMENT_ATTACHED',
        summary: `سند جدید «${doc.title}» پیوست شد`,
        visibility:
          doc.visibility === 'CUSTOMER_VISIBLE'
            ? 'CUSTOMER_SHARED'
            : 'INTERNAL',
        metadata: { documentId: doc.id, title: doc.title },
      });
    }

    const revisions = await this.docRepo.findRevisions(doc.id);
    return {
      ...this.mapSummary(doc, space.name),
      content: doc.content,
      revisions,
    };
  }

  async getDocuments(
    organizationId: string,
    actor: { id: string; role: MembershipRole },
    filters?: {
      spaceId?: string | undefined;
      visibility?: DocumentVisibility | undefined;
      isPublished?: boolean | undefined;
      search?: string | undefined;
    },
  ): Promise<DocumentSummaryDto[]> {
    const rawDocs = await this.docRepo.findDocuments(organizationId, filters);
    const spaces = await this.docRepo.findSpaces(organizationId);
    const spaceMap = new Map(spaces.map((s) => [s.id, s.name]));

    // Enforce role-based access & visibility filtering
    return rawDocs
      .filter((doc) =>
        canAccessDocument(
          actor.role,
          doc.visibility,
          doc.isPublished,
          doc.authorId === actor.id,
        ),
      )
      .map((doc) => this.mapSummary(doc, spaceMap.get(doc.spaceId)));
  }

  async getDocumentDetail(
    organizationId: string,
    actor: { id: string; role: MembershipRole },
    documentId: string,
  ): Promise<DocumentDetailDto> {
    const doc = await this.docRepo.findDocumentById(organizationId, documentId);
    if (!doc) {
      throw new NotFoundException('سند مورد نظر یافت نشد');
    }

    // Enforce domain access policy
    assertDocumentAccess(
      actor.role,
      doc.visibility,
      doc.isPublished,
      doc.authorId === actor.id,
    );

    const space = await this.docRepo.findSpaceById(organizationId, doc.spaceId);
    const revisions = await this.docRepo.findRevisions(doc.id);

    return {
      ...this.mapSummary(doc, space?.name),
      content: doc.content,
      revisions,
    };
  }

  async updateDocument(
    organizationId: string,
    actor: { id: string; name: string; role: MembershipRole },
    documentId: string,
    dto: UpdateDocumentRequest,
  ): Promise<DocumentDetailDto> {
    const existing = await this.docRepo.findDocumentById(organizationId, documentId);
    if (!existing) {
      throw new NotFoundException('سند مورد نظر یافت نشد');
    }

    // 1. Enforce edit permission
    if (
      !canEditDocument(
        actor.role,
        existing.visibility,
        existing.authorId === actor.id,
      )
    ) {
      throw new ForbiddenException('شما اجازه ویرایش این سند را ندارید');
    }

    // 2. Optimistic Concurrency Control
    if (
      dto.expectedVersion !== undefined &&
      existing.version !== dto.expectedVersion
    ) {
      throw new ConflictException(
        `تعارض ویرایش همزمان: نسخه سند تغییر کرده است (نسخه فعلی: ${existing.version})`,
      );
    }

    // 3. Prepare sanitized updates
    const updates: Partial<
      Omit<DocumentEntity, 'id' | 'organizationId' | 'createdAt'>
    > & {
      summaryChange?: string | undefined;
    } = {
      authorId: actor.id,
      authorName: actor.name,
    };

    if (dto.summaryChange !== undefined) {
      updates.summaryChange = dto.summaryChange;
    }
    if (dto.title !== undefined) {
      updates.title = dto.title;
      updates.slug = generateSlug(dto.title);
    }
    if (dto.content !== undefined) {
      updates.content = sanitizeDocumentContent(dto.content);
    }
    if (dto.visibility !== undefined) {
      updates.visibility = dto.visibility;
    }
    if (dto.isPublished !== undefined) {
      updates.isPublished = dto.isPublished;
    }
    if (dto.tags !== undefined) {
      updates.tags = dto.tags;
    }
    if (dto.associatedEntityType !== undefined) {
      updates.associatedEntityType = dto.associatedEntityType;
    }
    if (dto.associatedEntityId !== undefined) {
      updates.associatedEntityId = dto.associatedEntityId;
    }

    const updated = await this.docRepo.updateDocument(
      organizationId,
      documentId,
      updates,
    );
    if (!updated) {
      throw new NotFoundException('خطا در به‌روزرسانی سند');
    }

    // Audit log
    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'DOCUMENT_UPDATED',
      entityType: 'Document',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        version: updated.version,
        summaryChange: dto.summaryChange,
      },
    });

    const space = await this.docRepo.findSpaceById(organizationId, updated.spaceId);
    const revisions = await this.docRepo.findRevisions(updated.id);

    return {
      ...this.mapSummary(updated, space?.name),
      content: updated.content,
      revisions,
    };
  }

  async restoreRevision(
    organizationId: string,
    actor: { id: string; name: string; role: MembershipRole },
    documentId: string,
    revisionVersion: number,
    summaryChange?: string,
  ): Promise<DocumentDetailDto> {
    const existing = await this.docRepo.findDocumentById(organizationId, documentId);
    if (!existing) {
      throw new NotFoundException('سند مورد نظر یافت نشد');
    }

    if (
      !canEditDocument(
        actor.role,
        existing.visibility,
        existing.authorId === actor.id,
      )
    ) {
      throw new ForbiddenException('شما اجازه بازیابی این سند را ندارید');
    }

    const revision = await this.docRepo.findRevisionByVersion(
      documentId,
      revisionVersion,
    );
    if (!revision) {
      throw new NotFoundException(`نسخه ${revisionVersion} برای این سند یافت نشد`);
    }

    const restoreSummary =
      summaryChange || `بازیابی سند به محتوای نسخه ${revisionVersion}`;

    return this.updateDocument(organizationId, actor, documentId, {
      title: revision.title,
      content: revision.content,
      summaryChange: restoreSummary,
    });
  }

  async deleteDocument(
    organizationId: string,
    actor: { id: string; role: MembershipRole },
    documentId: string,
  ): Promise<boolean> {
    const existing = await this.docRepo.findDocumentById(organizationId, documentId);
    if (!existing) {
      throw new NotFoundException('سند مورد نظر یافت نشد');
    }

    const isAdmin =
      actor.role === 'SystemOwner' || actor.role === 'OrganizationAdmin';
    const isAuthor = existing.authorId === actor.id;

    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException(
        'فقط نویسنده سند یا مدیر سازمان می‌تواند سند را حذف کند',
      );
    }

    await this.docRepo.deleteDocument(organizationId, documentId);

    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'DOCUMENT_DELETED',
      entityType: 'Document',
      entityId: documentId,
      metadata: { title: existing.title },
    });

    return true;
  }

  private mapSummary(
    doc: DocumentEntity,
    spaceName?: string,
  ): DocumentSummaryDto {
    const result: DocumentSummaryDto = {
      id: doc.id,
      organizationId: doc.organizationId,
      spaceId: doc.spaceId,
      title: doc.title,
      slug: doc.slug,
      visibility: doc.visibility,
      isPublished: doc.isPublished,
      authorId: doc.authorId,
      authorName: doc.authorName,
      version: doc.version,
      tags: doc.tags,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    if (spaceName !== undefined) {
      result.spaceName = spaceName;
    }
    if (doc.associatedEntityType !== undefined) {
      result.associatedEntityType = doc.associatedEntityType;
    }
    if (doc.associatedEntityId !== undefined) {
      result.associatedEntityId = doc.associatedEntityId;
    }
    return result;
  }
}
