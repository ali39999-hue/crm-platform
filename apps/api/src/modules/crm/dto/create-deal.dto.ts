import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import type { CreateDealRequest } from '@crm/contracts';

export class CreateDealDto implements CreateDealRequest {
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  amountMinor?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @IsString()
  @IsOptional()
  targetCloseAt?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
