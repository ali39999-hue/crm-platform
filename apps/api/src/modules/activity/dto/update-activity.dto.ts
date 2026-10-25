import type { ActivityStatus } from '@crm/contracts';

export class UpdateActivityDto {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isAllDay?: boolean;
  status?: ActivityStatus;
  associatedEntityType?: string;
  associatedEntityId?: string;
  associatedEntityTitle?: string;
  participantIds?: string[];
  visibility?: 'INTERNAL' | 'CUSTOMER_SHARED';
  reminderMinutesBefore?: number;
}
