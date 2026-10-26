import type { MentionEntityType } from '@crm/contracts';

export class CreateMentionDto {
  sourceEntityType!: MentionEntityType;
  sourceEntityId!: string;
  sourceTitle!: string;
  recipientId!: string;
  contextSnippet!: string;
}
