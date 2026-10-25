import type { UpdateSavedViewRequest } from '@crm/contracts';

export class UpdateSavedViewDto implements UpdateSavedViewRequest {
  name?: string;
  filters?: Record<string, any>;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  isShared?: boolean;
}
