import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { ClickToCallRequest } from '@crm/contracts';

export class ClickToCallDto implements ClickToCallRequest {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  extension!: string;

  @IsUUID()
  @IsOptional()
  contactId?: string;
}
