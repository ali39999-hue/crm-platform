import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { CreatePipelineStageRequest } from '@crm/contracts';

export class CreatePipelineStageDto implements CreatePipelineStageRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

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
