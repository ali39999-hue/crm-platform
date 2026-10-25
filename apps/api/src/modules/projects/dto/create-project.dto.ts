import type { ProjectHealth, ProjectStatus } from '@crm/contracts';

export class CreateProjectDto {
  key!: string;
  name!: string;
  description?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
  startDate?: string;
  targetDate?: string;
  associatedAccountId?: string;
}
