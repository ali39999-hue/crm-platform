import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateContactRequest } from '@crm/contracts';

export class CreateContactDto implements CreateContactRequest {
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
