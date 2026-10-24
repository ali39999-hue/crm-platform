import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { BackupScope, BackupStatus } from './dto/backup.dto.js';

export type BackupEntity = {
  id: string;
  organizationId: string | null;
  scope: BackupScope;
  status: BackupStatus;
  description: string | null;
  version: string;
  algorithm: string;
  iv: string;
  authTag: string;
  checksumSha256: string;
  encryptedData: string;
  sizeBytes: number;
  recordCounts: Record<string, number>;
  rpoTargetMinutes: number;
  rtoEstimatedSeconds: number;
  retentionDays: number;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  metadata?: Record<string, any> | undefined;
};

export type RestoreDrillRecord = {
  id: string;
  backupId: string;
  organizationId: string | null;
  executedBy: string;
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
  executedAt: string;
  details: string;
  validationErrors?: string[] | undefined;
};

export interface IBackupRepository {
  create(backup: Omit<BackupEntity, 'id' | 'createdAt'> & { id?: string | undefined; createdAt?: string | undefined }): Promise<BackupEntity>;
  findById(id: string): Promise<BackupEntity | null>;
  findByOrg(organizationId: string, options?: { includeExpired?: boolean | undefined; scope?: BackupScope | undefined }): Promise<BackupEntity[]>;
  findAll(options?: { includeExpired?: boolean | undefined; scope?: BackupScope | undefined }): Promise<BackupEntity[]>;
  update(id: string, updates: Partial<BackupEntity>): Promise<BackupEntity | null>;
  delete(id: string): Promise<boolean>;
  recordDrill(drill: Omit<RestoreDrillRecord, 'id' | 'executedAt'>): Promise<RestoreDrillRecord>;
  findDrills(backupId?: string | undefined): Promise<RestoreDrillRecord[]>;
}

@Injectable()
export class InMemoryBackupRepository implements IBackupRepository {
  private backups: Map<string, BackupEntity> = new Map();
  private drills: Map<string, RestoreDrillRecord> = new Map();

  clear(): void {
    this.backups.clear();
    this.drills.clear();
  }

  async create(
    backup: Omit<BackupEntity, 'id' | 'createdAt'> & { id?: string | undefined; createdAt?: string | undefined },
  ): Promise<BackupEntity> {
    const id = backup.id ?? randomUUID();
    const createdAt = backup.createdAt ?? new Date().toISOString();
    const entity: BackupEntity = {
      ...backup,
      id,
      createdAt,
    };
    this.backups.set(id, { ...entity });
    return { ...entity };
  }

  async findById(id: string): Promise<BackupEntity | null> {
    const item = this.backups.get(id);
    if (!item) return null;
    return { ...item };
  }

  async findByOrg(
    organizationId: string,
    options?: { includeExpired?: boolean | undefined; scope?: BackupScope | undefined },
  ): Promise<BackupEntity[]> {
    const now = Date.now();
    return Array.from(this.backups.values())
      .filter((b) => {
        if (b.organizationId !== organizationId) return false;
        if (options?.scope && b.scope !== options.scope) return false;
        if (options?.includeExpired === false) {
          const expiresAt = new Date(b.expiresAt).getTime();
          if (now > expiresAt) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findAll(
    options?: { includeExpired?: boolean | undefined; scope?: BackupScope | undefined },
  ): Promise<BackupEntity[]> {
    const now = Date.now();
    return Array.from(this.backups.values())
      .filter((b) => {
        if (options?.scope && b.scope !== options.scope) return false;
        if (options?.includeExpired === false) {
          const expiresAt = new Date(b.expiresAt).getTime();
          if (now > expiresAt) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, updates: Partial<BackupEntity>): Promise<BackupEntity | null> {
    const existing = this.backups.get(id);
    if (!existing) return null;
    const updated: BackupEntity = {
      ...existing,
      ...updates,
      id: existing.id,
    };
    this.backups.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.backups.delete(id);
  }

  async recordDrill(
    drill: Omit<RestoreDrillRecord, 'id' | 'executedAt'>,
  ): Promise<RestoreDrillRecord> {
    const id = randomUUID();
    const executedAt = new Date().toISOString();
    const entity: RestoreDrillRecord = {
      ...drill,
      id,
      executedAt,
    };
    this.drills.set(id, entity);
    return { ...entity };
  }

  async findDrills(backupId?: string | undefined): Promise<RestoreDrillRecord[]> {
    return Array.from(this.drills.values())
      .filter((d) => (!backupId ? true : d.backupId === backupId))
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  }
}
