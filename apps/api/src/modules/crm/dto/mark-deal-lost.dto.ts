import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { DealLossReasonType, MarkDealLostRequest } from '@crm/contracts';
import { DEAL_LOSS_REASONS } from '@crm/domain';

export class MarkDealLostDto implements MarkDealLostRequest {
  @IsIn(DEAL_LOSS_REASONS as unknown as string[])
  @IsNotEmpty()
  lossReason!: DealLossReasonType;

  @IsString()
  @IsOptional()
  lossDescription?: string;
}
