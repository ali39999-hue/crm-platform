import type { CreateSavedViewRequest, SavedViewEntityType } from '@crm/contracts';

export class CreateSavedViewDto implements CreateSavedViewRequest {
  entityType!: SavedViewEntityType;
  name!: string;
  filters!: Record<string, any>;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  isShared?: boolean;
}
