import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  DocumentEntity,
  DocumentRevisionEntity,
  DocumentSpaceEntity,
  IDocumentRepository,
} from './document.repository.js';
import type { DocumentVisibility } from '@crm/contracts';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapSpace(s: any): DocumentSpaceEntity {
    return {
      id: s.id,
      organizationId: s.organizationId,
      name: s.name,
      slug: s.slug,
      description: s.description ?? undefined,
      icon: s.icon ?? undefined,
      isDefault: s.isDefault,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  private mapDocument(d: any): DocumentEntity {
    return {
      id: d.id,
      organizationId: d.organizationId,
      spaceId: d.spaceId,
      title: d.title,
      slug: d.slug,
      content: d.content,
      visibility: d.visibility as DocumentVisibility,
      isPublished: d.isPublished,
      authorId: d.authorId,
      authorName: d.authorName,
      version: d.version,
      tags: d.tags ?? [],
      associatedEntityType: d.associatedEntityType ?? undefined,
      associatedEntityId: d.associatedEntityId ?? undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  private mapRevision(r: any): DocumentRevisionEntity {
    return {
      id: r.id,
      documentId: r.documentId,
      version: r.version,
      title: r.title,
      content: r.content,
      summaryChange: r.summaryChange ?? undefined,
      authorId: r.authorId,
      authorName: r.authorName,
      createdAt: r.createdAt.toISOString(),
    };
  }

  /* Spaces */

  async createSpace(data: Omit<DocumentSpaceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentSpaceEntity> {
    const created = await (this.prisma.tenantClient as any).documentSpace.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        icon: data.icon ?? null,
        isDefault: data.isDefault ?? false,
      },
    });
    return this.mapSpace(created);
  }

  async findSpaces(organizationId: string): Promise<DocumentSpaceEntity[]> {
    const rows = await (this.prisma.tenantClient as any).documentSpace.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((s: any) => this.mapSpace(s));
  }

  async findSpaceById(organizationId: string, spaceId: string): Promise<DocumentSpaceEntity | null> {
    const row = await (this.prisma.tenantClient as any).documentSpace.findFirst({
      where: { organizationId, id: spaceId },
    });
    return row ? this.mapSpace(row) : null;
  }

  /* Documents */

  async createDocument(
    data: Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
  ): Promise<DocumentEntity> {
    const created = await (this.prisma.tenantClient as any).document.create({
      data: {
        organizationId: data.organizationId,
        spaceId: data.spaceId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        visibility: data.visibility,
        isPublished: data.isPublished,
        authorId: data.authorId,
        authorName: data.authorName,
        tags: data.tags ?? [],
        associatedEntityType: data.associatedEntityType ?? null,
        associatedEntityId: data.associatedEntityId ?? null,
        version: 1,
      },
    });
    // Initial revision v1, mirroring the in-memory repository contract.
    await (this.prisma.tenantClient as any).documentRevision.create({
      data: {
        documentId: created.id,
        organizationId: created.organizationId,
        version: 1,
        title: created.title,
        content: created.content,
        summaryChange: 'نسخه اولیه سند',
        authorId: created.authorId,
        authorName: created.authorName,
      },
    });
    return this.mapDocument(created);
  }

  async updateDocument(
    organizationId: string,
    documentId: string,
    data: Partial<Omit<DocumentEntity, 'id' | 'organizationId' | 'createdAt'>> & {
      summaryChange?: string | undefined;
    },
  ): Promise<DocumentEntity | null> {
    const existing = await this.findDocumentById(organizationId, documentId);
    if (!existing) return null;

    const newVersion = existing.version + 1;
    const updated = await (this.prisma.tenantClient as any).document.update({
      where: { id: documentId },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        visibility: data.visibility,
        isPublished: data.isPublished,
        tags: data.tags,
        associatedEntityType: data.associatedEntityType,
        associatedEntityId: data.associatedEntityId,
        authorId: data.authorId,
        authorName: data.authorName,
        version: newVersion,
      },
    });
    await (this.prisma.tenantClient as any).documentRevision.create({
      data: {
        documentId: updated.id,
        organizationId: updated.organizationId,
        version: newVersion,
        title: updated.title,
        content: updated.content,
        summaryChange: data.summaryChange || `ویرایش نسخه ${newVersion}`,
        authorId: data.authorId || existing.authorId,
        authorName: data.authorName || existing.authorName,
      },
    });
    return this.mapDocument(updated);
  }

  async findDocumentById(organizationId: string, documentId: string): Promise<DocumentEntity | null> {
    const row = await (this.prisma.tenantClient as any).document.findFirst({
      where: { organizationId, id: documentId },
    });
    return row ? this.mapDocument(row) : null;
  }

  async findDocuments(
    organizationId: string,
    filters?: {
      spaceId?: string | undefined;
      visibility?: DocumentVisibility | undefined;
      isPublished?: boolean | undefined;
      search?: string | undefined;
    },
  ): Promise<DocumentEntity[]> {
    const where: any = { organizationId };
    if (filters?.spaceId) where.spaceId = filters.spaceId;
    if (filters?.visibility) where.visibility = filters.visibility;
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }
    const rows = await (this.prisma.tenantClient as any).document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((d: any) => this.mapDocument(d));
  }

  async deleteDocument(organizationId: string, documentId: string): Promise<boolean> {
    const existing = await this.findDocumentById(organizationId, documentId);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).document.delete({ where: { id: documentId } });
    return true;
  }

  /* Revisions */

  async findRevisions(documentId: string): Promise<DocumentRevisionEntity[]> {
    const rows = await (this.prisma.tenantClient as any).documentRevision.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });
    return rows.map((r: any) => this.mapRevision(r));
  }

  async findRevisionByVersion(documentId: string, version: number): Promise<DocumentRevisionEntity | null> {
    const row = await (this.prisma.tenantClient as any).documentRevision.findFirst({
      where: { documentId, version },
    });
    return row ? this.mapRevision(row) : null;
  }
}
