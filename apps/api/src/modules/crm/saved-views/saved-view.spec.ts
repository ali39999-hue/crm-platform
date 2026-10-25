import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SavedViewRepository } from './saved-view.repository.js';
import { SavedViewService } from './saved-view.service.js';
import { SavedViewController } from './saved-view.controller.js';
import { AuditService } from '../../audit/audit.service.js';
import type { UserContext } from '../../../common/auth/auth.types.js';

describe('Saved Views & Filters (CRM-022)', () => {
  let repo: SavedViewRepository;
  let auditService: AuditService;
  let service: SavedViewService;
  let controller: SavedViewController;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const adminAlphaId = '11111111-1111-1111-1111-111111111111';
  const employee1Id = '22222222-2222-2222-2222-222222222222';
  const employee2Id = '33333333-3333-3333-3333-333333333333';
  const adminBetaId = '99999999-9999-9999-9999-999999999999';

  const adminAlphaUser: UserContext = {
    id: adminAlphaId,
    email: 'admin@alpha.com',
    displayName: 'مدیر آلفا',
    activeOrganization: {
      id: orgAlphaId,
      name: 'Alpha Org',
      slug: 'alpha-org',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgAlphaId,
        organizationName: 'Alpha Org',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const employee1User: UserContext = {
    id: employee1Id,
    email: 'emp1@alpha.com',
    displayName: 'کارمند ۱ آلفا',
    activeOrganization: {
      id: orgAlphaId,
      name: 'Alpha Org',
      slug: 'alpha-org',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgAlphaId,
        organizationName: 'Alpha Org',
        role: 'Employee',
        active: true,
      },
    ],
  };

  const employee2User: UserContext = {
    id: employee2Id,
    email: 'emp2@alpha.com',
    displayName: 'کارمند ۲ آلفا',
    activeOrganization: {
      id: orgAlphaId,
      name: 'Alpha Org',
      slug: 'alpha-org',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgAlphaId,
        organizationName: 'Alpha Org',
        role: 'Employee',
        active: true,
      },
    ],
  };

  const adminBetaUser: UserContext = {
    id: adminBetaId,
    email: 'admin@beta.com',
    displayName: 'مدیر بتا',
    activeOrganization: {
      id: orgBetaId,
      name: 'Beta Org',
      slug: 'beta-org',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgBetaId,
        organizationName: 'Beta Org',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    repo = new SavedViewRepository();
    auditService = new AuditService();
    service = new SavedViewService(repo, auditService);
    controller = new SavedViewController(service);
  });

  // =========================================================================
  // 1. CREATION & VALIDATION
  // =========================================================================
  describe('1. Saved View Creation & Validation', () => {
    it('creates a private saved view successfully with correct DTO structure', async () => {
      const view = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'وظایف معوقه من',
        filters: { status: 'IN_PROGRESS', priority: 'HIGH' },
        sortField: 'dueAt',
        sortOrder: 'ASC',
        isShared: false,
      });

      expect(view.id).toBeDefined();
      expect(view.organizationId).toBe(orgAlphaId);
      expect(view.entityType).toBe('TASK');
      expect(view.name).toBe('وظایف معوقه من');
      expect(view.filters).toEqual({ status: 'IN_PROGRESS', priority: 'HIGH' });
      expect(view.sortField).toBe('dueAt');
      expect(view.sortOrder).toBe('ASC');
      expect(view.isShared).toBe(false);
      expect(view.createdBy).toBe(employee1Id);
      expect(view.createdAt).toBeDefined();

      // Check audit event
      const audit = auditService
        .getEvents(orgAlphaId)
        .find((a) => a.action === 'SAVED_VIEW_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(employee1Id);
      expect(audit?.entityId).toBe(view.id);
    });

    it('creates a shared saved view successfully', async () => {
      const view = await service.createView(orgAlphaId, adminAlphaId, {
        entityType: 'LEAD',
        name: 'سرنخ‌های داغ تیم',
        filters: { status: 'QUALIFIED' },
        isShared: true,
      });

      expect(view.isShared).toBe(true);
      expect(view.entityType).toBe('LEAD');
    });

    it('validates supported entity types (TASK, ACCOUNT, CONTACT, LEAD, TICKET)', async () => {
      const validTypes = ['TASK', 'ACCOUNT', 'CONTACT', 'LEAD', 'TICKET'] as const;
      for (const entityType of validTypes) {
        const view = await service.createView(orgAlphaId, employee1Id, {
          entityType,
          name: `View for ${entityType}`,
          filters: {},
        });
        expect(view.entityType).toBe(entityType);
      }

      await expect(
        service.createView(orgAlphaId, employee1Id, {
          entityType: 'UNKNOWN_ENTITY' as any,
          name: 'Invalid entity',
          filters: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty or whitespace-only name', async () => {
      await expect(
        service.createView(orgAlphaId, employee1Id, {
          entityType: 'TASK',
          name: '   ',
          filters: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid filters (null, array, primitive)', async () => {
      await expect(
        service.createView(orgAlphaId, employee1Id, {
          entityType: 'TASK',
          name: 'Bad filters',
          filters: null as any,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createView(orgAlphaId, employee1Id, {
          entityType: 'TASK',
          name: 'Bad filters array',
          filters: ['array'] as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid sortOrder', async () => {
      await expect(
        service.createView(orgAlphaId, employee1Id, {
          entityType: 'TASK',
          name: 'Bad sortOrder',
          filters: {},
          sortOrder: 'SIDEWAYS' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // 2. RETRIEVAL & VISIBILITY RULES (SHARING POLICY)
  // =========================================================================
  describe('2. Visibility & Sharing Policy', () => {
    it('only lists shared views and the requesting user’s private views', async () => {
      // Employee 1 creates 1 private view and 1 shared view
      const emp1Private = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Private View Emp1',
        filters: { mine: true },
        isShared: false,
      });
      const emp1Shared = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Shared View Emp1',
        filters: { all: true },
        isShared: true,
      });

      // Employee 2 creates 1 private view
      const emp2Private = await service.createView(orgAlphaId, employee2Id, {
        entityType: 'TASK',
        name: 'Private View Emp2',
        filters: { mine: true },
        isShared: false,
      });

      // 1. Employee 1 gets views: should see emp1Private and emp1Shared, but NOT emp2Private
      const emp1Views = await service.getViews(orgAlphaId, employee1Id);
      expect(emp1Views.map((v) => v.id)).toContain(emp1Private.id);
      expect(emp1Views.map((v) => v.id)).toContain(emp1Shared.id);
      expect(emp1Views.map((v) => v.id)).not.toContain(emp2Private.id);

      // 2. Employee 2 gets views: should see emp2Private and emp1Shared, but NOT emp1Private
      const emp2Views = await service.getViews(orgAlphaId, employee2Id);
      expect(emp2Views.map((v) => v.id)).toContain(emp2Private.id);
      expect(emp2Views.map((v) => v.id)).toContain(emp1Shared.id);
      expect(emp2Views.map((v) => v.id)).not.toContain(emp1Private.id);
    });

    it('allows access to shared views by ID for all organization members', async () => {
      const sharedView = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'ACCOUNT',
        name: 'مشتریان VIP مشترک',
        filters: { tier: 'VIP' },
        isShared: true,
      });

      const fetchedByEmp2 = await service.getViewById(orgAlphaId, sharedView.id, employee2Id);
      expect(fetchedByEmp2.id).toBe(sharedView.id);

      const fetchedByAdmin = await service.getViewById(orgAlphaId, sharedView.id, adminAlphaId);
      expect(fetchedByAdmin.id).toBe(sharedView.id);
    });

    it('denies access to a private view by ID when requested by another member', async () => {
      const privateView = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TICKET',
        name: 'تیکت‌های شخصی من',
        filters: { private: true },
        isShared: false,
      });

      // Creator can access
      const fetchedByCreator = await service.getViewById(orgAlphaId, privateView.id, employee1Id);
      expect(fetchedByCreator.id).toBe(privateView.id);

      // Other employee is denied with ForbiddenException
      await expect(
        service.getViewById(orgAlphaId, privateView.id, employee2Id),
      ).rejects.toThrow(ForbiddenException);

      // Even admin is denied direct access to someone else’s private filter view
      await expect(
        service.getViewById(orgAlphaId, privateView.id, adminAlphaId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('filters views by entityType', async () => {
      await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Task View',
        filters: {},
        isShared: true,
      });
      await service.createView(orgAlphaId, employee1Id, {
        entityType: 'ACCOUNT',
        name: 'Account View',
        filters: {},
        isShared: true,
      });

      const taskViews = await service.getViews(orgAlphaId, employee1Id, 'TASK');
      expect(taskViews.every((v) => v.entityType === 'TASK')).toBe(true);

      const accountViews = await service.getViews(orgAlphaId, employee1Id, 'ACCOUNT');
      expect(accountViews.every((v) => v.entityType === 'ACCOUNT')).toBe(true);
    });
  });

  // =========================================================================
  // 3. MULTI-TENANT ISOLATION
  // =========================================================================
  describe('3. Multi-Tenant Scoping', () => {
    it('completely isolates views between organizations (even shared views)', async () => {
      const alphaShared = await service.createView(orgAlphaId, adminAlphaId, {
        entityType: 'LEAD',
        name: 'سرنخ‌های عمومی آلفا',
        filters: {},
        isShared: true,
      });

      // User in Org Beta cannot see Org Alpha views in list
      const betaViews = await service.getViews(orgBetaId, adminBetaId);
      expect(betaViews.some((v) => v.id === alphaShared.id)).toBe(false);

      // User in Org Beta cannot get Org Alpha view by ID
      await expect(
        service.getViewById(orgBetaId, alphaShared.id, adminBetaId),
      ).rejects.toThrow(NotFoundException);

      // User in Org Beta cannot update Org Alpha view
      await expect(
        service.updateView(orgBetaId, alphaShared.id, adminBetaId, { name: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);

      // User in Org Beta cannot delete Org Alpha view
      await expect(
        service.deleteView(orgBetaId, alphaShared.id, adminBetaId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // 4. UPDATE PERMISSIONS & AUDITING
  // =========================================================================
  describe('4. Update Permissions & Audit', () => {
    it('allows creator to update their own private view', async () => {
      const view = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'نام اولیه',
        filters: { status: 'TODO' },
        isShared: false,
      });

      const updated = await service.updateView(
        orgAlphaId,
        view.id,
        employee1Id,
        {
          name: 'نام جدید ویرایش‌شده',
          filters: { status: 'DONE' },
          sortField: 'updatedAt',
          sortOrder: 'DESC',
        },
        'Employee',
      );

      expect(updated.name).toBe('نام جدید ویرایش‌شده');
      expect(updated.filters).toEqual({ status: 'DONE' });
      expect(updated.sortField).toBe('updatedAt');
      expect(updated.sortOrder).toBe('DESC');

      // Audit check
      const audit = auditService
        .getEvents(orgAlphaId)
        .find((a) => a.action === 'SAVED_VIEW_UPDATED');
      expect(audit).toBeDefined();
    });

    it('forbids non-creators from updating private views', async () => {
      const view = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'نمای خصوصی ۱',
        filters: {},
        isShared: false,
      });

      await expect(
        service.updateView(orgAlphaId, view.id, employee2Id, { name: 'تلاش ناموفق' }, 'Employee'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin or creator to update shared views, but forbids regular non-creators', async () => {
      const sharedView = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'CONTACT',
        name: 'مخاطبین مشترک',
        filters: {},
        isShared: true,
      });

      // 1. Another regular employee cannot update it
      await expect(
        service.updateView(orgAlphaId, sharedView.id, employee2Id, { name: 'Emp2 Edit' }, 'Employee'),
      ).rejects.toThrow(ForbiddenException);

      // 2. Organization admin CAN update it
      const adminUpdated = await service.updateView(
        orgAlphaId,
        sharedView.id,
        adminAlphaId,
        { name: 'Admin Edit Success' },
        'OrganizationAdmin',
      );
      expect(adminUpdated.name).toBe('Admin Edit Success');

      // 3. Original creator CAN update it
      const creatorUpdated = await service.updateView(
        orgAlphaId,
        sharedView.id,
        employee1Id,
        { name: 'Creator Edit Success' },
        'Employee',
      );
      expect(creatorUpdated.name).toBe('Creator Edit Success');
    });
  });

  // =========================================================================
  // 5. DELETE PERMISSIONS & AUDITING
  // =========================================================================
  describe('5. Delete Permissions & Audit', () => {
    it('allows creator to delete their own private view', async () => {
      const view = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Delete Me',
        filters: {},
        isShared: false,
      });

      const res = await service.deleteView(orgAlphaId, view.id, employee1Id, 'Employee');
      expect(res.success).toBe(true);

      await expect(
        service.getViewById(orgAlphaId, view.id, employee1Id),
      ).rejects.toThrow(NotFoundException);

      const audit = auditService
        .getEvents(orgAlphaId)
        .find((a) => a.action === 'SAVED_VIEW_DELETED');
      expect(audit).toBeDefined();
    });

    it('forbids non-creators from deleting private views', async () => {
      const view = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Private View',
        filters: {},
        isShared: false,
      });

      await expect(
        service.deleteView(orgAlphaId, view.id, employee2Id, 'Employee'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin or creator to delete shared views, but forbids regular non-creators', async () => {
      const view1 = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Shared 1',
        filters: {},
        isShared: true,
      });

      // Employee 2 cannot delete
      await expect(
        service.deleteView(orgAlphaId, view1.id, employee2Id, 'Employee'),
      ).rejects.toThrow(ForbiddenException);

      // Admin CAN delete
      const resAdmin = await service.deleteView(orgAlphaId, view1.id, adminAlphaId, 'OrganizationAdmin');
      expect(resAdmin.success).toBe(true);

      // View 2 deleted by creator
      const view2 = await service.createView(orgAlphaId, employee1Id, {
        entityType: 'TASK',
        name: 'Shared 2',
        filters: {},
        isShared: true,
      });
      const resCreator = await service.deleteView(orgAlphaId, view2.id, employee1Id, 'Employee');
      expect(resCreator.success).toBe(true);
    });
  });

  // =========================================================================
  // 6. CONTROLLER INTEGRATION
  // =========================================================================
  describe('6. Saved View Controller Integration', () => {
    it('handles full CRUD lifecycle through controller with UserContext', async () => {
      const dummyReq = { requestId: 'req-test-123' } as any;

      // 1. Create
      const created = await controller.createView(
        employee1User,
        {
          entityType: 'TASK',
          name: 'Controller Test View',
          filters: { status: 'TODO' },
          isShared: true,
        },
        dummyReq,
      );
      expect(created.id).toBeDefined();

      // 2. List
      const list = await controller.getViews(employee1User, 'TASK');
      expect(list.some((v) => v.id === created.id)).toBe(true);

      // 3. Get single
      const single = await controller.getViewById(employee1User, created.id);
      expect(single.id).toBe(created.id);

      // 4. Update
      const updated = await controller.updateView(
        employee1User,
        created.id,
        { name: 'Updated Controller Name' },
        dummyReq,
      );
      expect(updated.name).toBe('Updated Controller Name');

      // 5. Delete
      const deleted = await controller.deleteView(employee1User, created.id, dummyReq);
      expect(deleted.success).toBe(true);
    });
  });
});
