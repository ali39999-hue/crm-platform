import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import type { UpdateDealRequest } from '@crm/contracts';

export class UpdateDealDto implements UpdateDealRequest {
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  name?: string;

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
