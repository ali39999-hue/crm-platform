import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateTaskRequest, RecordVisibility, TaskPriority } from '@crm/contracts';

export class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  @IsIn(['INTERNAL', 'CUSTOMER_SHARED'])
  visibility?: RecordVisibility;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  dueAt?: string;
}
