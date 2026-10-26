import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import type { VoipCallDirection, VoipCallEventDto, VoipCallStatus } from '@crm/contracts';

export class VoipCallEventDtoClass implements VoipCallEventDto {
  @IsString()
  @IsNotEmpty()
  callId!: string;

  @IsString()
  @IsNotEmpty()
  callerNumber!: string;

  @IsString()
  @IsNotEmpty()
  calleeNumber!: string;

  @IsIn(['INBOUND', 'OUTBOUND'])
  direction!: VoipCallDirection;

  @IsIn(['RINGING', 'ANSWERED', 'MISSED', 'ENDED'])
  status!: VoipCallStatus;

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsString()
  @IsOptional()
  recordingUrl?: string;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;
}
