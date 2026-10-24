import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import type { ConvertLeadRequest } from '@crm/contracts';

export class ConvertLeadDto implements ConvertLeadRequest {
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  dealName?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  dealAmountMinor?: number;

  @IsString()
  @IsOptional()
  dealCurrency?: string;
}
