import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateInvoiceRequest, DealProductItemDto } from '@crm/contracts';

export class CreateInvoiceDto implements CreateInvoiceRequest {
  @IsUUID()
  @IsNotEmpty()
  dealId!: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  items!: DealProductItemDto[];

  @IsString()
  @IsOptional()
  currency?: string;
}
