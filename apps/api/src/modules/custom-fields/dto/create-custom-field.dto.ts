import type { CustomFieldEntityType, CustomFieldType } from '@crm/contracts';

export class CreateCustomFieldDto {
  entityType!: CustomFieldEntityType;
  key!: string;
  label!: string;
  type!: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  defaultValue?: any;
  order?: number;
}
