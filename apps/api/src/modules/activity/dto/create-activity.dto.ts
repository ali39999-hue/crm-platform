import type { ActivityType } from '@crm/contracts';

export class CreateActivityDto {
  type!: ActivityType;
  title!: string;
  description?: string;
  startsAt!: string;
  endsAt?: string;
  isAllDay?: boolean;
  associatedEntityType?: string;
  associatedEntityId?: string;
  associatedEntityTitle?: string;
  participantIds?: string[];
  visibility?: 'INTERNAL' | 'CUSTOMER_SHARED';
  reminderMinutesBefore?: number;
}
