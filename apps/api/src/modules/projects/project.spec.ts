import { describe, expect, it, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service.js';
import { InMemoryProjectRepository } from './project.repository.js';
import { InMemoryTaskRepository } from '../tasks/task.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Project Management & Milestones (R-040 & R-042)', () => {
  let projectService: ProjectService;
  let projectRepo: InMemoryProjectRepository;
  let taskRepo: InMemoryTaskRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const actor = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'سارا احمدی',
  };

  beforeEach(() => {
    projectRepo = new InMemoryProjectRepository();
    taskRepo = new InMemoryTaskRepository();
    auditService = new AuditService();
    projectService = new ProjectService(projectRepo, taskRepo, auditService);
  });

  describe('Listing & Retrieval', () => {
    it('returns seeded projects for organization with computed progress', async () => {
      const list = await projectService.getProjects(orgAlpha);
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.some((p) => p.key === 'PRJ-CRM')).toBe(true);
      expect(list.some((p) => p.key === 'PRJ-PORTAL')).toBe(true);

      const prjCrm = list.find((p) => p.key === 'PRJ-CRM')!;
      expect(prjCrm.progressPercent).toBeGreaterThan(0);
      expect(prjCrm.milestonesCount).toBe(3);
    });

    it('isolates projects by organization', async () => {
      const listBeta = await projectService.getProjects(orgBeta);
      expect(listBeta.length).toBe(0);

      await expect(
        projectService.getProjectDetail(orgBeta, 'prj-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Creation & Duplicate Prevention', () => {
    it('creates a new project and records audit event', async () => {
      const created = await projectService.createProject(orgAlpha, actor, {
        key: 'PRJ-MOBILE',
        name: 'طراحی نسخه موبایل اپلیکیشن CRM',
        description: 'نسخه آفلاین React Native با Expo',
        status: 'PLANNING',
        health: 'ON_TRACK',
      });

      expect(created.id).toBeDefined();
      expect(created.key).toBe('PRJ-MOBILE');
      expect(created.status).toBe('PLANNING');

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'PROJECT_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(actor.id);
    });

    it('rejects duplicate project key with 409 Conflict', async () => {
      await expect(
        projectService.createProject(orgAlpha, actor, {
          key: 'prj-crm', // Same key in lowercase
          name: 'تکراری',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Milestones Management', () => {
    it('adds and toggles milestones and updates progress', async () => {
      const newMs = await projectService.addMilestone(orgAlpha, actor.id, 'prj-002', {
        title: 'طراحی واسط کاربری تیکت‌ها',
        dueDate: '2026-11-01T00:00:00.000Z',
        isCompleted: false,
      });

      expect(newMs.id).toBeDefined();
      expect(newMs.title).toBe('طراحی واسط کاربری تیکت‌ها');
      expect(newMs.isCompleted).toBe(false);

      // Toggle milestone to completed
      const toggled = await projectService.toggleMilestone(
        orgAlpha,
        actor.id,
        'prj-002',
        newMs.id,
        true,
      );
      expect(toggled.isCompleted).toBe(true);

      const detail = await projectService.getProjectDetail(orgAlpha, 'prj-002');
      expect(detail.milestones).toHaveLength(1);
      expect(detail.progressPercent).toBe(100);
    });
  });

  describe('Deletion & Audit', () => {
    it('deletes project and registers audit event', async () => {
      const res = await projectService.deleteProject(orgAlpha, actor.id, 'prj-002');
      expect(res.success).toBe(true);

      const list = await projectService.getProjects(orgAlpha);
      expect(list.some((p) => p.id === 'prj-002')).toBe(false);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'PROJECT_DELETED');
      expect(audit).toBeDefined();
    });
  });
});
