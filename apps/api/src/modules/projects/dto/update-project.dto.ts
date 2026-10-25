import type { ProjectHealth, ProjectStatus } from '@crm/contracts';

export class UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
  startDate?: string;
  targetDate?: string;
  ownerId?: string;
}

export class CreateMilestoneDto {
  title!: string;
  dueDate!: string;
  isCompleted?: boolean;
}
