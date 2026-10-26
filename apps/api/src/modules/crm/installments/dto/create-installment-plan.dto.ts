import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { CheckItemDto, CheckStatus, CreateInstallmentPlanRequest } from '@crm/contracts';

export class CheckItemDtoClass implements Omit<CheckItemDto, 'id' | 'reminderSent'> {
  @IsString()
  @IsNotEmpty()
  checkNumber!: string;

  @IsString()
  @IsOptional()
  sayadiNumber?: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsInt()
  @Min(0)
  amountMinor!: number;

  @IsString()
  @IsNotEmpty()
  dueDate!: string;

  @IsString()
  @IsNotEmpty()
  status!: CheckStatus;

  @IsString()
  @IsNotEmpty()
  drawerName!: string;
}

export class CreateInstallmentPlanDto implements CreateInstallmentPlanRequest {
  @IsUUID()
  @IsNotEmpty()
  dealId!: string;

  @IsInt()
  @Min(0)
  downPaymentMinor!: number;

  @IsInt()
  @Min(1)
  installmentsCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckItemDtoClass)
  checks!: CheckItemDtoClass[];
}
