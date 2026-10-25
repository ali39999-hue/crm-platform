import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DocumentsService } from './document.service.js';
import { InMemoryDocumentRepository } from './document.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { InMemoryActivityRepository } from '../activity/activity.repository.js';

describe('DocumentsService & Repository Unit/Integration Tests', () => {
  let service: DocumentsService;
  let repo: InMemoryDocumentRepository;
  let auditService: AuditService;
  let activityService: ActivityService;

  const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const otherOrgId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const adminActor = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'علی مدیر',
    role: 'OrganizationAdmin' as const,
  };

  const employeeActor = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'سارا احمدی',
    role: 'Employee' as const,
  };

  const otherEmployeeActor = {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'رضا کمالی',
    role: 'Employee' as const,
  };

  const customerActor = {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'مشتری پتروشیمی',
    role: 'CustomerPortalUser' as const,
  };

  beforeEach(() => {
    repo = new InMemoryDocumentRepository();
    auditService = new AuditService();
    activityService = new ActivityService(new InMemoryActivityRepository());
    service = new DocumentsService(repo, auditService, activityService);
  });

  describe('Document Creation & Revisions', () => {
    it('creates document with sanitized content, slug, and initial revision v1', async () => {
      const doc = await service.createDocument(orgId, employeeActor, {
        spaceId: 'space-general-001',
        title: 'راهنمای امنیتی ورود به سامانه',
        content: '# راهنما\nمتن با اسکریپت مخرب <script>alert("hack")</script>',
        visibility: 'WORKSPACE',
        isPublished: true,
        tags: ['امنیت', 'ورود'],
      });

      expect(doc.id).toBeDefined();
      expect(doc.version).toBe(1);
      expect(doc.slug).toContain('راهنمای-امنیتی-ورود-به-سامانه');
      expect(doc.content).not.toContain('<script>');
      expect(doc.revisions).toHaveLength(1);
      expect(doc.revisions?.[0]?.version).toBe(1);
      expect(doc.revisions?.[0]?.summaryChange).toBe('نسخه اولیه سند');
    });

    it('throws NotFoundException if space does not exist in tenant', async () => {
      await expect(
        service.createDocument(orgId, employeeActor, {
          spaceId: 'invalid-space-id',
          title: 'تست',
          content: 'محتوا',
          visibility: 'WORKSPACE',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Document Updates & Versioning', () => {
    it('increments version and creates new revision on update', async () => {
      const doc = await service.createDocument(orgId, employeeActor, {
        spaceId: 'space-general-001',
        title: 'دستورالعمل کاری تیم توسعه',
        content: 'نسخه ۱',
        visibility: 'WORKSPACE',
      });

      const updated = await service.updateDocument(
        orgId,
        otherEmployeeActor,
        doc.id,
        {
          content: 'نسخه ۲ با تغییرات جامع',
          summaryChange: 'به‌روزرسانی بخش فرانت‌اند',
          expectedVersion: 1,
        },
      );

      expect(updated.version).toBe(2);
      expect(updated.content).toBe('نسخه ۲ با تغییرات جامع');
      expect(updated.revisions).toHaveLength(2);
      expect(updated.revisions?.[0]?.version).toBe(2);
      expect(updated.revisions?.[0]?.authorName).toBe(otherEmployeeActor.name);
      expect(updated.revisions?.[0]?.summaryChange).toBe('به‌روزرسانی بخش فرانت‌اند');
    });

    it('rejects update with 409 Conflict if expectedVersion does not match current version', async () => {
      const doc = await service.createDocument(orgId, employeeActor, {
        spaceId: 'space-general-001',
        title: 'سند با تعارض ویرایش همزمان',
        content: 'نسخه اولیه',
        visibility: 'WORKSPACE',
      });

      // Attempt update with stale version
      await expect(
        service.updateDocument(orgId, employeeActor, doc.id, {
          content: 'تغییر ناهماهنگ',
          expectedVersion: 99,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Revision Restoration', () => {
    it('restores previous revision content and title as a new tip revision', async () => {
      const doc = await service.createDocument(orgId, employeeActor, {
        spaceId: 'space-general-001',
        title: 'سند برای آزمون بازگردانی',
        content: 'محتوای با ارزش نسخه ۱',
        visibility: 'WORKSPACE',
      });

      // Update to v2
      await service.updateDocument(orgId, employeeActor, doc.id, {
        content: 'محتوای اشتباه نسخه ۲',
        expectedVersion: 1,
      });

      // Restore v1
      const restored = await service.restoreRevision(
        orgId,
        adminActor,
        doc.id,
        1,
        'بازگردانی به نسخه ۱ به دلیل خطای سهوی',
      );

      expect(restored.version).toBe(3);
      expect(restored.content).toBe('محتوای با ارزش نسخه ۱');
      expect(restored.revisions).toHaveLength(3);
      expect(restored.revisions?.[0]?.version).toBe(3);
      expect(restored.revisions?.[0]?.summaryChange).toBe(
        'بازگردانی به نسخه ۱ به دلیل خطای سهوی',
      );
    });
  });

  describe('Role-Based Access & Customer Portal Isolation', () => {
    it('allows customer to view published CUSTOMER_VISIBLE document', async () => {
      const detail = await service.getDocumentDetail(
        orgId,
        customerActor,
        'doc-102', // Seeded published CUSTOMER_VISIBLE document
      );
      expect(detail.id).toBe('doc-102');
      expect(detail.visibility).toBe('CUSTOMER_VISIBLE');
    });

    it('strictly denies customer access to WORKSPACE documents', async () => {
      await expect(
        service.getDocumentDetail(orgId, customerActor, 'doc-101'),
      ).rejects.toThrow(
        'محدودیت دسترسی: دسترسی به اسناد داخلی برای کاربران پورتال مشتریان مجاز نیست',
      );
    });

    it('strictly denies customer access to PRIVATE documents', async () => {
      await expect(
        service.getDocumentDetail(orgId, customerActor, 'doc-103'),
      ).rejects.toThrow(
        'محدودیت دسترسی: دسترسی به اسناد داخلی برای کاربران پورتال مشتریان مجاز نیست',
      );
    });

    it('customer listing returns ONLY published CUSTOMER_VISIBLE documents', async () => {
      const docs = await service.getDocuments(orgId, customerActor);
      expect(docs.every((d) => d.visibility === 'CUSTOMER_VISIBLE' && d.isPublished)).toBe(true);
      expect(docs.some((d) => d.visibility === 'WORKSPACE')).toBe(false);
      expect(docs.some((d) => d.visibility === 'PRIVATE')).toBe(false);
    });

    it('restricts PRIVATE document to author and admins', async () => {
      // Author (سارا احمدی) can access doc-103
      const authorView = await service.getDocumentDetail(
        orgId,
        employeeActor,
        'doc-103',
      );
      expect(authorView.id).toBe('doc-103');

      // Admin can access doc-103
      const adminView = await service.getDocumentDetail(
        orgId,
        adminActor,
        'doc-103',
      );
      expect(adminView.id).toBe('doc-103');

      // Another employee CANNOT access doc-103
      await expect(
        service.getDocumentDetail(orgId, otherEmployeeActor, 'doc-103'),
      ).rejects.toThrow(
        'محدودیت دسترسی: این سند خصوصی است و فقط توسط نویسنده یا مدیر سیستم قابل مشاهده است',
      );
    });
  });

  describe('Tenant Isolation', () => {
    it('prevents cross-tenant document access', async () => {
      await expect(
        service.getDocumentDetail(otherOrgId, adminActor, 'doc-101'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
