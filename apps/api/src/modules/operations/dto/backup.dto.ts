import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type BackupScope = 'TENANT' | 'SYSTEM';
export type BackupStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'RESTORING' | 'EXPIRED';

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  @IsIn(['TENANT', 'SYSTEM'])
  scope?: BackupScope | undefined;

  @IsOptional()
  @IsString()
  description?: string | undefined;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  retentionDays?: number | undefined;

  @IsOptional()
  @IsString()
  organizationId?: string | undefined;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeTables?: string[] | undefined;
}

export class ExecuteRestoreDrillDto {
  @IsOptional()
  @IsBoolean()
  simulationMode?: boolean | undefined;

  @IsOptional()
  @IsString()
  targetPointInTime?: string | undefined;
}

export class ListBackupsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['TENANT', 'SYSTEM'])
  scope?: BackupScope | undefined;

  @IsOptional()
  includeExpired?: boolean | string | undefined;
}

export interface BackupSnapshotDto {
  id: string;
  organizationId: string | null;
  scope: BackupScope;
  status: BackupStatus;
  description: string | null;
  checksumSha256: string;
  algorithm: string;
  iv: string;
  authTag: string;
  encryptedData: string;
  sizeBytes: number;
  recordCounts: Record<string, number>;
  rpoTargetMinutes: number;
  rtoEstimatedSeconds: number;
  retentionDays: number;
  expiresAt: string;
  isExpired: boolean;
  version: string;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface BackupDownloadPackageDto {
  id: string;
  scope: BackupScope;
  organizationId: string | null;
  algorithm: string;
  checksumSha256: string;
  iv: string;
  authTag: string;
  encryptedData: string;
  version: string;
  sizeBytes: number;
  recordCounts: Record<string, number>;
  createdAt: string;
  expiresAt: string;
}

export interface RestoreDrillResultDto {
  backupId: string;
  success: boolean;
  integrityVerified: boolean;
  checksumMatched: boolean;
  decryptionSuccessful: boolean;
  versionCompatible: boolean;
  schemaCompatible: boolean;
  simulatedRecordsRestored: number;
  rtoActualMs: number;
  rpoActualMinutes: number;
  rpoTargetMinutes: number;
  rtoEstimatedSeconds: number;
  meetsRpoTarget: boolean;
  meetsRtoTarget: boolean;
  drillExecutedAt: string;
  details: string;
  validationErrors?: string[] | undefined;
}
