import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type {
  CreateMilestoneRequest,
  CreateProjectRequest,
  GanttProjectScheduleDto,
  MilestoneDto,
  ProjectDetailDto,
  ProjectSummaryDto,
  UpdateProjectRequest,
} from '@crm/contracts';
import { calculateGanttSchedule, type GanttInputTask } from '@crm/domain';
import {
  InMemoryProjectRepository,
  type MilestoneEntity,
  type ProjectEntity,
} from './project.repository.js';
import type { ITaskRepository } from '../tasks/task.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly projectRepo: InMemoryProjectRepository,
    @Inject('TASK_REPOSITORY') private readonly taskRepo: ITaskRepository,
    private readonly auditService: AuditService,
  ) {}

  async getProjects(organizationId: string): Promise<ProjectSummaryDto[]> {
    const projects = await this.projectRepo.findByOrg(organizationId);
    const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });

    const results: ProjectSummaryDto[] = [];
    for (const p of projects) {
      const milestones = await this.projectRepo.findMilestones(p.id);
      const summary = this.mapSummary(p, tasks, milestones);
      results.push(summary);
    }

    return results;
  }

  async getProjectDetail(
    organizationId: string,
    id: string,
  ): Promise<ProjectDetailDto> {
    const project = await this.projectRepo.findById(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project ${id} not found in this organization`);
    }

    const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });
    const milestones = await this.projectRepo.findMilestones(project.id);
    const summary = this.mapSummary(project, tasks, milestones);

    const detail: ProjectDetailDto = {
      ...summary,
      milestones: milestones.map((m) => this.mapMilestone(m)),
    };
    if (project.associatedAccountId !== undefined) {
      detail.associatedAccountId = project.associatedAccountId;
    }
    if (project.associatedAccountName !== undefined) {
      detail.associatedAccountName = project.associatedAccountName;
    }
    return detail;
  }

  async createProject(
    organizationId: string,
    actor: { id: string; name: string },
    dto: CreateProjectRequest,
  ): Promise<ProjectDetailDto> {
    const normalizedKey = dto.key.trim().toUpperCase();

    // Check duplicate key
    const existing = await this.projectRepo.findByKey(organizationId, normalizedKey);
    if (existing) {
      throw new ConflictException(
        `پروژه‌ای با کلید «${normalizedKey}» قبلاً در این سازمان ثبت شده است`,
      );
    }

    const projectData: Omit<ProjectEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      key: normalizedKey,
      name: dto.name.trim(),
      status: dto.status ?? 'ACTIVE',
      health: dto.health ?? 'ON_TRACK',
      ownerId: actor.id,
      ownerName: actor.name,
    };

    if (dto.description !== undefined) projectData.description = dto.description;
    if (dto.startDate !== undefined) projectData.startDate = dto.startDate;
    if (dto.targetDate !== undefined) projectData.targetDate = dto.targetDate;
    if (dto.associatedAccountId !== undefined) {
      projectData.associatedAccountId = dto.associatedAccountId;
      projectData.associatedAccountName = 'مشتری مرتبط';
    }

    const created = await this.projectRepo.create(projectData);

    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: created.id,
      metadata: { key: created.key, name: created.name },
    });

    return {
      ...this.mapSummary(created, [], []),
      milestones: [],
    };
  }

  async updateProject(
    organizationId: string,
    actorId: string,
    id: string,
    dto: UpdateProjectRequest,
  ): Promise<ProjectDetailDto> {
    const existing = await this.projectRepo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Project ${id} not found in this organization`);
    }

    if (dto.name !== undefined) existing.name = dto.name.trim();
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.health !== undefined) existing.health = dto.health;
    if (dto.startDate !== undefined) existing.startDate = dto.startDate;
    if (dto.targetDate !== undefined) existing.targetDate = dto.targetDate;
    if (dto.ownerId !== undefined) existing.ownerId = dto.ownerId;

    const updated = await this.projectRepo.update(existing);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: updated.id,
      metadata: { status: updated.status, health: updated.health },
    });

    return this.getProjectDetail(organizationId, updated.id);
  }

  async addMilestone(
    organizationId: string,
    actorId: string,
    projectId: string,
    dto: CreateMilestoneRequest,
  ): Promise<MilestoneDto> {
    const project = await this.projectRepo.findById(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const milestone = await this.projectRepo.createMilestone({
      projectId,
      title: dto.title.trim(),
      dueDate: dto.dueDate,
      isCompleted: Boolean(dto.isCompleted),
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'PROJECT_MILESTONE_ADDED',
      entityType: 'ProjectMilestone',
      entityId: milestone.id,
      metadata: { projectId, title: milestone.title },
    });

    return this.mapMilestone(milestone);
  }

  async toggleMilestone(
    organizationId: string,
    actorId: string,
    projectId: string,
    milestoneId: string,
    isCompleted: boolean,
  ): Promise<MilestoneDto> {
    const updated = await this.projectRepo.toggleMilestone(projectId, milestoneId, isCompleted);
    if (!updated) {
      throw new NotFoundException(`Milestone ${milestoneId} not found`);
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'PROJECT_MILESTONE_TOGGLED',
      entityType: 'ProjectMilestone',
      entityId: milestoneId,
      metadata: { projectId, isCompleted },
    });

    return this.mapMilestone(updated);
  }

  async getProjectGanttSchedule(
    organizationId: string,
    projectId: string,
  ): Promise<GanttProjectScheduleDto> {
    const project = await this.projectRepo.findById(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found in this organization`);
    }

    const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });
    const projectTasks = tasks.filter((t) => t.projectId === projectId);

    const ganttInputTasks: GanttInputTask[] = [];

    for (const t of projectTasks) {
      const deps = await this.taskRepo.getDependencies(organizationId, t.id);
      const predecessorIds = deps.map((d) => d.id);

      // Duration estimate in days
      let durationDays = 3;
      if (t.dueAt) {
        const diffMs = new Date(t.dueAt).getTime() - new Date(t.createdAt).getTime();
        durationDays = Math.max(1, Math.round(diffMs / 86400000));
      }

      const progressPercent = t.status === 'DONE' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0;

      ganttInputTasks.push({
        id: t.id,
        title: t.title,
        durationDays,
        predecessorIds,
        weight: (t as any).weight || 1,
        progressPercent,
      });
    }

    const schedule = calculateGanttSchedule({
      projectStartDate: project.startDate || project.createdAt.slice(0, 10),
      tasks: ganttInputTasks,
    });

    const result: GanttProjectScheduleDto = {
      hasCycle: schedule.hasCycle,
      totalDurationDays: schedule.totalDurationDays,
      projectStartDate: schedule.projectStartDate,
      projectFinishDate: schedule.projectFinishDate,
      criticalPathIds: schedule.criticalPathIds,
      tasks: schedule.scheduledTasks,
    };
    if (schedule.errorMessage) {
      result.errorMessage = schedule.errorMessage;
    }

    return result;
  }

  async deleteProject(
    organizationId: string,
    actorId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const project = await this.projectRepo.findById(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    await this.projectRepo.delete(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'PROJECT_DELETED',
      entityType: 'Project',
      entityId: id,
      metadata: { key: project.key, name: project.name },
    });

    return { success: true };
  }

  private mapSummary(
    p: ProjectEntity,
    tasks: any[],
    milestones: MilestoneEntity[],
  ): ProjectSummaryDto {
    // Calculate progress based on milestones or general tasks count
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.isCompleted).length;

    let progressPercent = 0;
    if (totalMilestones > 0) {
      progressPercent = Math.round((completedMilestones / totalMilestones) * 100);
    } else {
      progressPercent = p.status === 'COMPLETED' ? 100 : 25;
    }

    const summary: ProjectSummaryDto = {
      id: p.id,
      organizationId: p.organizationId,
      key: p.key,
      name: p.name,
      status: p.status,
      health: p.health,
      ownerId: p.ownerId,
      ownerName: p.ownerName,
      progressPercent,
      tasksCount: tasks.length,
      completedTasksCount: tasks.filter((t) => t.status === 'DONE').length,
      milestonesCount: totalMilestones,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    if (p.description !== undefined) summary.description = p.description;
    if (p.startDate !== undefined) summary.startDate = p.startDate;
    if (p.targetDate !== undefined) summary.targetDate = p.targetDate;

    return summary;
  }

  private mapMilestone(m: MilestoneEntity): MilestoneDto {
    return {
      id: m.id,
      projectId: m.projectId,
      title: m.title,
      dueDate: m.dueDate,
      isCompleted: m.isCompleted,
      createdAt: m.createdAt,
    };
  }
}
