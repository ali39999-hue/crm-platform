import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  BackupEntity,
  IBackupRepository,
  RestoreDrillRecord,
} from './backup.repository.js';
import type { BackupScope, BackupStatus } from './dto/backup.dto.js';

/**
 * Note: BackupRecord/RestoreDrill are intentionally NOT in
 * TENANT_SCOPED_MODELS — findById/findAll are platform-admin operations
 * without an organization argument. Organization filtering stays manual in
 * findByOrg (defense reviewed in the P01 report).
 */
@Injectable()
export class PrismaBackupRepository implements IBackupRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapBackup(b: any): BackupEntity {
    return {
      id: b.id,
      organizationId: b.organizationId ?? null,
      scope: b.scope as BackupScope,
      status: b.status as BackupStatus,
      description: b.description ?? null,
      version: b.version,
      algorithm: b.algorithm,
      iv: b.iv,
      authTag: b.authTag,
      checksumSha256: b.checksumSha256,
      encryptedData: b.encryptedData,
      sizeBytes: Number(b.sizeBytes),
      recordCounts: b.recordCounts ?? {},
      rpoTargetMinutes: b.rpoTargetMinutes,
      rtoEstimatedSeconds: b.rtoEstimatedSeconds,
      retentionDays: b.retentionDays,
      expiresAt: b.expiresAt.toISOString(),
      createdBy: b.createdBy,
      createdAt: b.createdAt.toISOString(),
      completedAt: b.completedAt ? b.completedAt.toISOString() : null,
      metadata: b.metadata ?? undefined,
    };
  }

  private mapDrill(d: any): RestoreDrillRecord {
    return {
      id: d.id,
      backupId: d.backupId,
      organizationId: d.organizationId ?? null,
      executedBy: d.executedBy,
      success: d.success,
      integrityVerified: d.integrityVerified,
      checksumMatched: d.checksumMatched,
      decryptionSuccessful: d.decryptionSuccessful,
      versionCompatible: d.versionCompatible,
      schemaCompatible: d.schemaCompatible,
      simulatedRecordsRestored: d.simulatedRecordsRestored,
      rtoActualMs: d.rtoActualMs,
      rpoActualMinutes: d.rpoActualMinutes,
      rpoTargetMinutes: d.rpoTargetMinutes,
      rtoEstimatedSeconds: d.rtoEstimatedSeconds,
      meetsRpoTarget: d.meetsRpoTarget,
      meetsRtoTarget: d.meetsRtoTarget,
      executedAt: d.executedAt.toISOString(),
      details: d.details,
      validationErrors: d.validationErrors ?? undefined,
    };
  }

  async create(
    backup: Omit<BackupEntity, 'id' | 'createdAt'> & {
      id?: string | undefined;
      createdAt?: string | undefined;
    },
  ): Promise<BackupEntity> {
    const created = await (this.prisma.tenantClient as any).backupRecord.create({
      data: {
        id: backup.id,
        organizationId: backup.organizationId,
        scope: backup.scope,
        status: backup.status,
        description: backup.description,
        version: backup.version,
        algorithm: backup.algorithm,
        iv: backup.iv,
        authTag: backup.authTag,
        checksumSha256: backup.checksumSha256,
        encryptedData: backup.encryptedData,
        sizeBytes: BigInt(backup.sizeBytes),
        recordCounts: backup.recordCounts,
        rpoTargetMinutes: backup.rpoTargetMinutes,
        rtoEstimatedSeconds: backup.rtoEstimatedSeconds,
        retentionDays: backup.retentionDays,
        expiresAt: new Date(backup.expiresAt),
        createdBy: backup.createdBy,
        createdAt: backup.createdAt ? new Date(backup.createdAt) : undefined,
        completedAt: backup.completedAt ? new Date(backup.completedAt) : null,
        metadata: backup.metadata ?? undefined,
      },
    });
    return this.mapBackup(created);
  }

  async findById(id: string): Promise<BackupEntity | null> {
    const row = await (this.prisma.tenantClient as any).backupRecord.findUnique({
      where: { id },
    });
    return row ? this.mapBackup(row) : null;
  }

  async findByOrg(
    organizationId: string,
    options?: { includeExpired?: boolean | undefined; scope?: BackupScope | undefined },
  ): Promise<BackupEntity[]> {
    const rows = await (this.prisma.tenantClient as any).backupRecord.findMany({
      where: this.buildWhere(organizationId, options),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((b: any) => this.mapBackup(b));
  }

  async findAll(options?: {
    includeExpired?: boolean | undefined;
    scope?: BackupScope | undefined;
  }): Promise<BackupEntity[]> {
    const rows = await (this.prisma.tenantClient as any).backupRecord.findMany({
      where: this.buildWhere(undefined, options),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((b: any) => this.mapBackup(b));
  }

  private buildWhere(
    organizationId: string | undefined,
    options?: { includeExpired?: boolean | undefined; scope?: BackupScope | undefined },
  ): Record<string, any> {
    const where: Record<string, any> = {};
    if (organizationId) where.organizationId = organizationId;
    if (options?.scope) where.scope = options.scope;
    if (!options?.includeExpired) where.expiresAt = { gte: new Date() };
    return where;
  }

  async update(id: string, updates: Partial<BackupEntity>): Promise<BackupEntity | null> {
    const data: Record<string, any> = {};
    const assign = (key: string, value: any, transform?: (v: any) => any) => {
      if (updates[key as keyof BackupEntity] !== undefined) {
        data[key] = transform ? transform(value) : value;
      }
    };
    assign('scope', updates.scope);
    assign('status', updates.status);
    assign('description', updates.description);
    assign('version', updates.version);
    assign('algorithm', updates.algorithm);
    assign('iv', updates.iv);
    assign('authTag', updates.authTag);
    assign('checksumSha256', updates.checksumSha256);
    assign('encryptedData', updates.encryptedData);
    assign('sizeBytes', updates.sizeBytes, (v) => BigInt(v));
    assign('recordCounts', updates.recordCounts);
    assign('rpoTargetMinutes', updates.rpoTargetMinutes);
    assign('rtoEstimatedSeconds', updates.rtoEstimatedSeconds);
    assign('retentionDays', updates.retentionDays);
    assign('expiresAt', updates.expiresAt, (v) => new Date(v));
    assign('completedAt', updates.completedAt, (v) => (v ? new Date(v) : null));
    assign('metadata', updates.metadata);
    assign('status', updates.status);

    if (Object.keys(data).length === 0) {
      const current = await this.findById(id);
      return current;
    }
    try {
      const updated = await (this.prisma.tenantClient as any).backupRecord.update({
        where: { id },
        data,
      });
      return this.mapBackup(updated);
    } catch (err: any) {
      if (err?.code === 'P2025') return null; // record vanished between check and update
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).backupRecord.delete({ where: { id } });
    return true;
  }

  async recordDrill(drill: Omit<RestoreDrillRecord, 'id' | 'executedAt'>): Promise<RestoreDrillRecord> {
    const created = await (this.prisma.tenantClient as any).restoreDrill.create({
      data: {
        backupId: drill.backupId,
        organizationId: drill.organizationId,
        executedBy: drill.executedBy,
        success: drill.success,
        integrityVerified: drill.integrityVerified,
        checksumMatched: drill.checksumMatched,
        decryptionSuccessful: drill.decryptionSuccessful,
        versionCompatible: drill.versionCompatible,
        schemaCompatible: drill.schemaCompatible,
        simulatedRecordsRestored: drill.simulatedRecordsRestored,
        rtoActualMs: drill.rtoActualMs,
        rpoActualMinutes: drill.rpoActualMinutes,
        rpoTargetMinutes: drill.rpoTargetMinutes,
        rtoEstimatedSeconds: drill.rtoEstimatedSeconds,
        meetsRpoTarget: drill.meetsRpoTarget,
        meetsRtoTarget: drill.meetsRtoTarget,
        details: drill.details,
        validationErrors: drill.validationErrors ?? [],
      },
    });
    return this.mapDrill(created);
  }

  async findDrills(backupId?: string | undefined): Promise<RestoreDrillRecord[]> {
    const rows = await (this.prisma.tenantClient as any).restoreDrill.findMany({
      where: backupId ? { backupId } : undefined,
      orderBy: { executedAt: 'desc' },
    });
    return rows.map((d: any) => this.mapDrill(d));
  }
}
