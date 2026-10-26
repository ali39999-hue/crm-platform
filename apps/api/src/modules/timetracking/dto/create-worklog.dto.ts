import type { WorkLogEntityType } from '@crm/contracts';

export class CreateWorkLogDto {
  entityType!: WorkLogEntityType;
  entityId!: string;
  entityTitle!: string;
  durationMinutes!: number;
  description!: string;
  isBillable?: boolean;
  loggedDate?: string;
}
