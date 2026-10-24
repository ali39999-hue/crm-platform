import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { AddTicketMessageRequest, RecordVisibility } from '@crm/contracts';

export class AddTicketMessageDto implements AddTicketMessageRequest {
  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsString()
  @IsOptional()
  @IsIn(['INTERNAL', 'CUSTOMER_SHARED'])
  visibility?: RecordVisibility;
}
