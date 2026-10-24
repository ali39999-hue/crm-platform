import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import type { FileVisibility } from '@crm/contracts';

export class CreateUploadIntentDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsNumber()
  @Min(1)
  fileSize!: number;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsOptional()
  @IsString()
  @IsIn(['INTERNAL', 'CUSTOMER_SHARED'])
  visibility?: FileVisibility;

  @IsOptional()
  @IsString()
  associatedEntityType?: string;

  @IsOptional()
  @IsString()
  associatedEntityId?: string;
}

export class VerifyFileScanDto {
  @IsString()
  @IsIn(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  scanDetails?: string;
}

export class GenerateSignedUrlDto {
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  expiresInSec?: number;
}
