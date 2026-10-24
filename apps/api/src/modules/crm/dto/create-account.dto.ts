import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CreateAccountRequest } from '@crm/contracts';

export class CreateAccountDto implements CreateAccountRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;
}
