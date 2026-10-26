import { IsIn, IsNotEmpty } from 'class-validator';
import type { CheckStatus } from '@crm/contracts';

export class UpdateCheckStatusDto {
  @IsIn(['PENDING', 'CLEARED', 'BOUNCED'])
  @IsNotEmpty()
  status!: CheckStatus;
}
