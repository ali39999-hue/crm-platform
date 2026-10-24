import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import type { TaskStatus, TransitionTaskRequest } from '@crm/contracts';
import { TASK_STATUSES } from '@crm/domain';

export class TransitionTaskDto implements TransitionTaskRequest {
  @IsString()
  @IsNotEmpty()
  @IsIn(TASK_STATUSES as unknown as string[])
  targetStatus!: TaskStatus;

  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
