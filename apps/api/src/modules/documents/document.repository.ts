import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  DocumentDetailDto,
  DocumentRevisionDto,
  DocumentSpaceDto,
  DocumentSummaryDto,
  DocumentVisibility,
} from '@crm/contracts';

export type DocumentEntity = {
  id: string;
  organizationId: string;
  spaceId: string;
  title: string;
  slug: string;
  content: string;
  visibility: DocumentVisibility;
  isPublished: boolean;
  authorId: string;
  authorName: string;
  version: number;
  tags: string[];
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRevisionEntity = {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content: string;
  summaryChange?: string | undefined;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type DocumentSpaceEntity = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | undefined;
  icon?: string | undefined;
  isDefault?: boolean | undefined;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class InMemoryDocumentRepository {
  private spaces: DocumentSpaceEntity[] = [
    {
      id: 'space-general-001',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'پایگاه دانش عمومی',
      slug: 'general-knowledge-base',
      description: 'مستندات استاندارد، فرآیندهای کاری و راهنماهای سازمانی',
      icon: 'book',
      isDefault: true,
      createdAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    },
    {
      id: 'space-customer-portal-002',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'راهنماهای مشتریان',
      slug: 'customer-portal-guides',
      description: 'اسناد و مستندات آموزشی قابل مشاهده در پورتال مشتریان',
      icon: 'globe',
      isDefault: false,
      createdAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    },
  ];

  private documents: DocumentEntity[] = [
    {
      id: 'doc-101',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      spaceId: 'space-general-001',
      title: 'دستورالعمل امنیت داده‌ها و حریم خصوصی کارکنان',
      slug: 'security-data-privacy-policy',
      content: '# سیاست‌های امنیت اطلاعات\nکلیه کارکنان موظف به رعایت اصول محرمانگی داده‌ها هستند.',
      visibility: 'WORKSPACE',
      isPublished: true,
      authorId: '22222222-2222-2222-2222-222222222222',
      authorName: 'سارا احمدی',
      version: 1,
      tags: ['امنیت', 'سیاست‌ها'],
      createdAt: new Date('2026-10-10T10:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-10T10:00:00.000Z').toISOString(),
    },
    {
      id: 'doc-102',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      spaceId: 'space-customer-portal-002',
      title: 'راهنمای ثبت تیکت و پیگیری پشتیبانی در پورتال',
      slug: 'customer-ticket-guide',
      content: '# راهنمای سامانه پشتیبانی\nمشتریان گرامی می‌توانند از طریق این راهنما با نحوه ثبت درخواست آشنا شوند.',
      visibility: 'CUSTOMER_VISIBLE',
      isPublished: true,
      authorId: '55555555-5555-5555-5555-555555555555',
      authorName: 'پویا مرادی',
      version: 1,
      tags: ['پشتیبانی', 'آموزش'],
      createdAt: new Date('2026-10-12T14:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-12T14:00:00.000Z').toISOString(),
    },
    {
      id: 'doc-103',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      spaceId: 'space-general-001',
      title: 'پیش‌نویس محرمانه استراتژی تجاری فصل پاییز',
      slug: 'private-sales-strategy',
      content: '# استراتژی پاییز\nمذاکرات تجاری با مشتریان سطح بالا در حال برنامه‌ریزی است.',
      visibility: 'PRIVATE',
      isPublished: false,
      authorId: '22222222-2222-2222-2222-222222222222',
      authorName: 'سارا احمدی',
      version: 1,
      tags: ['استراتژی', 'محرمانه'],
      createdAt: new Date('2026-10-15T09:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-15T09:00:00.000Z').toISOString(),
    },
  ];

  private revisions: DocumentRevisionEntity[] = [
    {
      id: 'rev-001',
      documentId: 'doc-101',
      version: 1,
      title: 'دستورالعمل امنیت داده‌ها و حریم خصوصی کارکنان',
      content: '# سیاست‌های امنیت اطلاعات\nکلیه کارکنان موظف به رعایت اصول محرمانگی داده‌ها هستند.',
      summaryChange: 'نسخه اولیه سند',
      authorId: '22222222-2222-2222-2222-222222222222',
      authorName: 'سارا احمدی',
      createdAt: new Date('2026-10-10T10:00:00.000Z').toISOString(),
    },
    {
      id: 'rev-002',
      documentId: 'doc-102',
      version: 1,
      title: 'راهنمای ثبت تیکت و پیگیری پشتیبانی در پورتال',
      content: '# راهنمای سامانه پشتیبانی\nمشتریان گرامی می‌توانند از طریق این راهنما با نحوه ثبت درخواست آشنا شوند.',
      summaryChange: 'انتشار راهنمای کاربری برای مشتریان',
      authorId: '55555555-5555-5555-5555-555555555555',
      authorName: 'پویا مرادی',
      createdAt: new Date('2026-10-12T14:00:00.000Z').toISOString(),
    },
    {
      id: 'rev-003',
      documentId: 'doc-103',
      version: 1,
      title: 'پیش‌نویس محرمانه استراتژی تجاری فصل پاییز',
      content: '# استراتژی پاییز\nمذاکرات تجاری با مشتریان سطح بالا در حال برنامه‌ریزی است.',
      summaryChange: 'پیش‌نویس خصوصی',
      authorId: '22222222-2222-2222-2222-222222222222',
      authorName: 'سارا احمدی',
      createdAt: new Date('2026-10-15T09:00:00.000Z').toISOString(),
    },
  ];

  /* Spaces */

  async createSpace(
    data: Omit<DocumentSpaceEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DocumentSpaceEntity> {
    const space: DocumentSpaceEntity = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.spaces.push(space);
    return space;
  }

  async findSpaces(organizationId: string): Promise<DocumentSpaceEntity[]> {
    return this.spaces.filter((s) => s.organizationId === organizationId);
  }

  async findSpaceById(
    organizationId: string,
    spaceId: string,
  ): Promise<DocumentSpaceEntity | null> {
    return (
      this.spaces.find(
        (s) => s.organizationId === organizationId && s.id === spaceId,
      ) ?? null
    );
  }

  /* Documents */

  async createDocument(
    data: Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
  ): Promise<DocumentEntity> {
    const now = new Date().toISOString();
    const doc: DocumentEntity = {
      ...data,
      id: randomUUID(),
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.push(doc);

    // Create initial revision v1
    this.revisions.push({
      id: randomUUID(),
      documentId: doc.id,
      version: 1,
      title: doc.title,
      content: doc.content,
      summaryChange: 'نسخه اولیه سند',
      authorId: doc.authorId,
      authorName: doc.authorName,
      createdAt: now,
    });

    return doc;
  }

  async updateDocument(
    organizationId: string,
    documentId: string,
    data: Partial<Omit<DocumentEntity, 'id' | 'organizationId' | 'createdAt'>> & {
      summaryChange?: string | undefined;
    },
  ): Promise<DocumentEntity | null> {
    const index = this.documents.findIndex(
      (d) => d.organizationId === organizationId && d.id === documentId,
    );
    if (index === -1) return null;

    const existing = this.documents[index];
    if (!existing) return null;

    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    const updated: DocumentEntity = {
      ...existing,
      version: newVersion,
      updatedAt: now,
    };

    if (data.title !== undefined) updated.title = data.title;
    if (data.slug !== undefined) updated.slug = data.slug;
    if (data.content !== undefined) updated.content = data.content;
    if (data.visibility !== undefined) updated.visibility = data.visibility;
    if (data.isPublished !== undefined) updated.isPublished = data.isPublished;
    if (data.tags !== undefined) updated.tags = data.tags;
    if (data.associatedEntityType !== undefined)
      updated.associatedEntityType = data.associatedEntityType;
    if (data.associatedEntityId !== undefined)
      updated.associatedEntityId = data.associatedEntityId;
    if (data.authorId !== undefined) updated.authorId = data.authorId;
    if (data.authorName !== undefined) updated.authorName = data.authorName;

    this.documents[index] = updated;

    // Record new revision
    const revSummary = data.summaryChange || `ویرایش نسخه ${newVersion}`;
    this.revisions.push({
      id: randomUUID(),
      documentId: updated.id,
      version: newVersion,
      title: updated.title,
      content: updated.content,
      summaryChange: revSummary,
      authorId: data.authorId || existing.authorId,
      authorName: data.authorName || existing.authorName,
      createdAt: now,
    });

    return updated;
  }

  async findDocumentById(
    organizationId: string,
    documentId: string,
  ): Promise<DocumentEntity | null> {
    return (
      this.documents.find(
        (d) => d.organizationId === organizationId && d.id === documentId,
      ) ?? null
    );
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
    return this.documents.filter((d) => {
      if (d.organizationId !== organizationId) return false;
      if (filters?.spaceId && d.spaceId !== filters.spaceId) return false;
      if (filters?.visibility && d.visibility !== filters.visibility) return false;
      if (filters?.isPublished !== undefined && d.isPublished !== filters.isPublished)
        return false;
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(query);
        const matchTags = d.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchTags) return false;
      }
      return true;
    });
  }

  async deleteDocument(organizationId: string, documentId: string): Promise<boolean> {
    const index = this.documents.findIndex(
      (d) => d.organizationId === organizationId && d.id === documentId,
    );
    if (index === -1) return false;
    this.documents.splice(index, 1);
    return true;
  }

  /* Revisions */

  async findRevisions(documentId: string): Promise<DocumentRevisionEntity[]> {
    return this.revisions
      .filter((r) => r.documentId === documentId)
      .sort((a, b) => b.version - a.version);
  }

  async findRevisionByVersion(
    documentId: string,
    version: number,
  ): Promise<DocumentRevisionEntity | null> {
    return (
      this.revisions.find(
        (r) => r.documentId === documentId && r.version === version,
      ) ?? null
    );
  }
}
