import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import type { ReorderPipelineStagesRequest } from '@crm/contracts';

export class ReorderPipelineStagesDto implements ReorderPipelineStagesRequest {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  stageIds!: string[];
}
