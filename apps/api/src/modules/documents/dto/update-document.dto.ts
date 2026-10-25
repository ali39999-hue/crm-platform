import type { DocumentVisibility } from '@crm/domain';

export class UpdateDocumentDto {
  title?: string;
  content?: string;
  visibility?: DocumentVisibility;
  isPublished?: boolean;
  tags?: string[];
  summaryChange?: string;
  expectedVersion?: number;
  associatedEntityType?: string;
  associatedEntityId?: string;
}

export class RestoreDocumentRevisionDto {
  revisionVersion!: number;
  summaryChange?: string;
}
