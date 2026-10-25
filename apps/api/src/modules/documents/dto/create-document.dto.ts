import type { DocumentVisibility } from '@crm/domain';

export class CreateDocumentDto {
  spaceId!: string;
  title!: string;
  content!: string;
  visibility!: DocumentVisibility;
  isPublished?: boolean;
  tags?: string[];
  associatedEntityType?: string;
  associatedEntityId?: string;
}

export class CreateDocumentSpaceDto {
  name!: string;
  description?: string;
  icon?: string;
}
