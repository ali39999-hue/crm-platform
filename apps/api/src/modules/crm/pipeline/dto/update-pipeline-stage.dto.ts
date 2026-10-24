import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { UpdatePipelineStageRequest } from '@crm/contracts';

export class UpdatePipelineStageDto implements UpdatePipelineStageRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultProbability?: number;

  @IsBoolean()
  @IsOptional()
  isWon?: boolean;

  @IsBoolean()
  @IsOptional()
  isLost?: boolean;

  @IsString()
  @IsOptional()
  color?: string;
}
