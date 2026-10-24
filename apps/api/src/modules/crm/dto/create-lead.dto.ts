import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateLeadRequest } from '@crm/contracts';

export class CreateLeadDto implements CreateLeadRequest {
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
