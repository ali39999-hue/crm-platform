import { describe, expect, it, beforeEach } from 'vitest';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BackupService, DEFAULT_BACKUP_RETENTION_DAYS } from './backup.service.js';
import { BackupController } from './backup.controller.js';
import { InMemoryBackupRepository } from './backup.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { InMemoryTaskRepository } from '../tasks/task.repository.js';
import { InMemoryCrmRepository } from '../crm/crm.repository.js';
import { InMemorySupportRepository } from '../support/support.repository.js';
import { InMemoryActivityRepository } from '../activity/activity.repository.js';
import { InMemoryAutomationRepository } from '../automation/automation.repository.js';
import { InMemoryWebhookRepository } from '../integrations/webhook.repository.js';
import type { UserContext } from '../../common/auth/auth.types.js';

describe('Task F9-04: Automated Backup & Restore Service, DR Drill, and Snapshot Management', () => {
  let backupRepo: InMemoryBackupRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;
  let taskRepo: InMemoryTaskRepository;
  let crmRepo: InMemoryCrmRepository;
  let supportRepo: InMemorySupportRepository;
  let activityRepo: InMemoryActivityRepository;
  let automationRepo: InMemoryAutomationRepository;
  let webhookRepo: InMemoryWebhookRepository;
  let backupService: BackupService;
  let backupController: BackupController;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const systemOwner: UserContext = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'owner@system.internal',
    displayName: 'System Owner',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'SystemOwner',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'SystemOwner',
        active: true,
      },
    ],
  };

  const adminAlpha: UserContext = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@alphacorp.internal',
    displayName: 'Admin Alpha',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const adminBeta: UserContext = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@betacorp.internal',
    displayName: 'Admin Beta',
    activeOrganization: {
      id: orgBeta,
      name: 'Beta Corp',
      slug: 'beta-corp',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgBeta,
        organizationName: 'Beta Corp',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const employeeAlpha: UserContext = {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'employee@alphacorp.internal',
    displayName: 'Employee Alpha',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'Employee',
        active: true,
      },
    ],
  };

  const mockResponse = (): Response => {
    const headers: Record<string, string> = {};
    return {
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
      getHeader: (name: string) => headers[name],
    } as unknown as Response;
  };

  beforeEach(() => {
    backupRepo = new InMemoryBackupRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    taskRepo = new InMemoryTaskRepository();
    crmRepo = new InMemoryCrmRepository();
    supportRepo = new InMemorySupportRepository();
    activityRepo = new InMemoryActivityRepository();
    automationRepo = new InMemoryAutomationRepository();
    webhookRepo = new InMemoryWebhookRepository();

    backupService = new BackupService(
      backupRepo,
      auditService,
      outboxService,
      taskRepo,
      crmRepo,
      supportRepo,
      activityRepo,
      automationRepo,
      webhookRepo,
    );

    backupController = new BackupController(backupService);
  });

  describe('1. Backup Creation and SHA-256 Checksum Verification', () => {
    it('creates an AES-256-GCM encrypted snapshot with valid SHA-256 checksum and metadata', async () => {
      const backup = await backupService.createBackup(adminAlpha, {
        description: 'Nightly production tenant backup',
        retentionDays: 45,
      });

      expect(backup.id).toBeDefined();
      expect(backup.organizationId).toBe(orgAlpha);
      expect(backup.scope).toBe('TENANT');
      expect(backup.status).toBe('COMPLETED');
      expect(backup.algorithm).toBe('aes-256-gcm');
      expect(backup.iv).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(backup.authTag).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(backup.checksumSha256).toHaveLength(64); // SHA-256 = 64 hex chars
      expect(backup.sizeBytes).toBeGreaterThan(0);
      expect(backup.rpoTargetMinutes).toBe(60);
      expect(backup.rtoEstimatedSeconds).toBe(180);
      expect(backup.retentionDays).toBe(45);
      expect(backup.recordCounts).toBeDefined();
      expect(backup.recordCounts.total).toBeGreaterThan(0);

      // Verify SHA-256 checksum strictly matches the ciphertext
      const computedChecksum = backupService.calculateChecksum(backup.encryptedData);
      expect(computedChecksum).toBe(backup.checksumSha256);

      // Verify AES-256-GCM decryption
      const decrypted = backupService.decryptPayload(
        backup.encryptedData,
        backup.iv,
        backup.authTag,
      );
      expect(decrypted.metadata).toBeDefined();
      expect(decrypted.metadata.organizationId).toBe(orgAlpha);
      expect(decrypted.metadata.version).toBe('1.0.0');
      expect(decrypted.data.tasks).toBeInstanceOf(Array);
      expect(decrypted.data.accounts).toBeInstanceOf(Array);
    });

    it('defaults retention days to 30 when omitted', async () => {
      const backup = await backupService.createBackup(adminAlpha, {});
      expect(backup.retentionDays).toBe(DEFAULT_BACKUP_RETENTION_DAYS);

      const expiresDate = new Date(backup.expiresAt).getTime();
      const createdDate = new Date(backup.createdAt).getTime();
      const diffDays = Math.round((expiresDate - createdDate) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });
  });

  describe('2. Disaster Recovery Restore Drill Validation', () => {
    it('executes DR restore drill successfully on an intact snapshot', async () => {
      const backup = await backupService.createBackup(adminAlpha, {
        description: 'Pre-drill backup',
      });

      const drill = await backupService.executeRestoreDrill(adminAlpha, backup.id);

      expect(drill.backupId).toBe(backup.id);
      expect(drill.success).toBe(true);
      expect(drill.integrityVerified).toBe(true);
      expect(drill.checksumMatched).toBe(true);
      expect(drill.decryptionSuccessful).toBe(true);
      expect(drill.versionCompatible).toBe(true);
      expect(drill.schemaCompatible).toBe(true);
      expect(drill.simulatedRecordsRestored).toBeGreaterThan(0);
      expect(drill.rtoActualMs).toBeGreaterThan(0);
      expect(drill.meetsRtoTarget).toBe(true);
      expect(drill.meetsRpoTarget).toBe(true);
      expect(drill.validationErrors).toBeUndefined();
      expect(drill.details).toContain('Disaster Recovery Drill SUCCEEDED');
    });

    it('fails restore drill when SHA-256 checksum is corrupted or tampered', async () => {
      const backup = await backupService.createBackup(adminAlpha, {
        description: 'Integrity test backup',
      });

      // Tamper with checksumSha256 in storage
      await backupRepo.update(backup.id, {
        checksumSha256: 'deadbeef'.repeat(8),
      });

      const drill = await backupService.executeRestoreDrill(adminAlpha, backup.id);

      expect(drill.success).toBe(false);
      expect(drill.checksumMatched).toBe(false);
      expect(drill.integrityVerified).toBe(false);
      expect(drill.decryptionSuccessful).toBe(false);
      expect(drill.validationErrors).toBeDefined();
      expect(drill.validationErrors![0]).toContain('SHA-256 Checksum mismatch');
      expect(drill.details).toContain('Disaster Recovery Drill FAILED');
    });

    it('fails restore drill when encrypted data payload is corrupted', async () => {
      const backup = await backupService.createBackup(adminAlpha, {});

      // Corrupt the ciphertext payload
      const corruptedData = backup.encryptedData.slice(0, -10) + '0000000000';
      const updatedChecksum = backupService.calculateChecksum(corruptedData);

      // Even if checksum is updated to match corrupted data, AES-256-GCM auth tag must fail
      await backupRepo.update(backup.id, {
        encryptedData: corruptedData,
        checksumSha256: updatedChecksum,
      });

      const drill = await backupService.executeRestoreDrill(adminAlpha, backup.id);

      expect(drill.success).toBe(false);
      expect(drill.checksumMatched).toBe(true);
      expect(drill.decryptionSuccessful).toBe(false);
      expect(drill.integrityVerified).toBe(false);
      expect(drill.validationErrors?.some((e) => e.includes('Decryption failed'))).toBe(true);
    });

    it('fails restore drill when backup format version is incompatible', async () => {
      const backup = await backupService.createBackup(adminAlpha, {});

      // Invalidate the version in stored metadata
      await backupRepo.update(backup.id, {
        version: '99.0.0',
      });

      const drill = await backupService.executeRestoreDrill(adminAlpha, backup.id);

      expect(drill.success).toBe(false);
      expect(drill.versionCompatible).toBe(false);
      expect(drill.validationErrors?.some((e) => e.includes('Version incompatibility'))).toBe(true);
    });
  });

  describe('3. Multi-Tenant Isolation & Role Enforcement', () => {
    it('Org Alpha admin cannot download Org Beta backup', async () => {
      const betaBackup = await backupService.createBackup(adminBeta, {
        description: 'Confidential Beta Backup',
      });

      await expect(
        backupService.getBackupDownload(adminAlpha, betaBackup.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Org Alpha admin cannot execute restore drill on Org Beta backup', async () => {
      const betaBackup = await backupService.createBackup(adminBeta, {
        description: 'Confidential Beta Backup',
      });

      await expect(
        backupService.executeRestoreDrill(adminAlpha, betaBackup.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Org Alpha admin cannot delete Org Beta backup', async () => {
      const betaBackup = await backupService.createBackup(adminBeta, {
        description: 'Confidential Beta Backup',
      });

      await expect(
        backupService.deleteBackup(adminAlpha, betaBackup.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('listing backups only returns snapshots for the caller organization', async () => {
      await backupService.createBackup(adminAlpha, { description: 'Alpha Backup 1' });
      await backupService.createBackup(adminAlpha, { description: 'Alpha Backup 2' });
      await backupService.createBackup(adminBeta, { description: 'Beta Backup 1' });

      const alphaList = await backupService.listBackups(adminAlpha);
      expect(alphaList.length).toBe(2);
      expect(alphaList.every((b) => b.organizationId === orgAlpha)).toBe(true);

      const betaList = await backupService.listBackups(adminBeta);
      expect(betaList.length).toBe(1);
      expect(betaList[0]!.organizationId).toBe(orgBeta);
    });

    it('regular employee cannot trigger, list, or download backups', async () => {
      await expect(
        backupService.createBackup(employeeAlpha, {}),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        backupService.listBackups(employeeAlpha),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SystemOwner can trigger full system-wide snapshot and view all backups', async () => {
      const sysBackup = await backupService.createBackup(systemOwner, {
        scope: 'SYSTEM',
        description: 'System disaster recovery master snapshot',
      });

      expect(sysBackup.scope).toBe('SYSTEM');
      expect(sysBackup.organizationId).toBeNull();

      const allBackups = await backupService.listBackups(systemOwner);
      expect(allBackups.some((b) => b.scope === 'SYSTEM')).toBe(true);

      // SystemOwner can run restore drill on system backup
      const drill = await backupService.executeRestoreDrill(systemOwner, sysBackup.id);
      expect(drill.success).toBe(true);
    });

    it('OrganizationAdmin cannot trigger full system backup', async () => {
      await expect(
        backupService.createBackup(adminAlpha, { scope: 'SYSTEM' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('OrganizationAdmin cannot access system-wide backup', async () => {
      const sysBackup = await backupService.createBackup(systemOwner, {
        scope: 'SYSTEM',
      });

      await expect(
        backupService.getBackupDownload(adminAlpha, sysBackup.id),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        backupService.executeRestoreDrill(adminAlpha, sysBackup.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Retention Policy Enforcement', () => {
    it('correctly calculates expiration status and remaining days', async () => {
      const backup = await backupService.createBackup(adminAlpha, {
        retentionDays: 10,
      });

      const entity = (await backupRepo.findById(backup.id))!;

      // Currently active
      expect(backupService.isBackupExpired(entity)).toBe(false);
      expect(backupService.getRemainingRetentionDays(entity)).toBe(10);

      // Simulated 5 days later
      const day5 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      expect(backupService.isBackupExpired(entity, day5)).toBe(false);
      expect(backupService.getRemainingRetentionDays(entity, day5)).toBe(5);

      // Simulated 11 days later (expired)
      const day11 = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000);
      expect(backupService.isBackupExpired(entity, day11)).toBe(true);
      expect(backupService.getRemainingRetentionDays(entity, day11)).toBe(0);
    });

    it('automatically flags expired backups during retention enforcement', async () => {
      const backup = await backupService.createBackup(adminAlpha, {
        retentionDays: 5,
      });

      // Enforce at day 2 -> not expired
      const res1 = await backupService.enforceRetentionPolicy(
        orgAlpha,
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      );
      expect(res1.expiredCount).toBe(0);

      // Enforce at day 6 -> expired and flagged
      const res2 = await backupService.enforceRetentionPolicy(
        orgAlpha,
        new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      );
      expect(res2.expiredCount).toBe(1);
      expect(res2.flaggedIds).toContain(backup.id);

      const updated = await backupRepo.findById(backup.id);
      expect(updated?.status).toBe('EXPIRED');
    });

    it('deletes backup snapshot and verifies removal', async () => {
      const backup = await backupService.createBackup(adminAlpha, {});

      const deleteRes = await backupService.deleteBackup(adminAlpha, backup.id);
      expect(deleteRes.success).toBe(true);
      expect(deleteRes.id).toBe(backup.id);

      await expect(
        backupService.getBackupById(adminAlpha, backup.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. Audit Event Logging', () => {
    it('records strict audit events for BACKUP_CREATED, BACKUP_RESTORE_DRILL_COMPLETED, and BACKUP_DELETED', async () => {
      // 1. Create backup -> BACKUP_CREATED
      const backup = await backupService.createBackup(adminAlpha, {
        description: 'Audit test backup',
      });

      const eventsAfterCreate = auditService.getEvents(orgAlpha);
      const createEvent = eventsAfterCreate.find(
        (e) => e.action === 'BACKUP_CREATED' && e.entityId === backup.id,
      );
      expect(createEvent).toBeDefined();
      expect(createEvent?.actorId).toBe(adminAlpha.id);
      expect(createEvent?.metadata?.checksumSha256).toBe(backup.checksumSha256);
      expect(createEvent?.metadata?.sizeBytes).toBe(backup.sizeBytes);

      // 2. Restore drill -> BACKUP_RESTORE_DRILL_COMPLETED
      await backupService.executeRestoreDrill(adminAlpha, backup.id);

      const eventsAfterDrill = auditService.getEvents(orgAlpha);
      const drillEvent = eventsAfterDrill.find(
        (e) => e.action === 'BACKUP_RESTORE_DRILL_COMPLETED' && e.entityId === backup.id,
      );
      expect(drillEvent).toBeDefined();
      expect(drillEvent?.actorId).toBe(adminAlpha.id);
      expect(drillEvent?.metadata?.success).toBe(true);
      expect(drillEvent?.metadata?.checksumMatched).toBe(true);
      expect(drillEvent?.metadata?.integrityVerified).toBe(true);
      expect(drillEvent?.metadata?.rtoActualMs).toBeDefined();

      // 3. Delete backup -> BACKUP_DELETED
      await backupService.deleteBackup(adminAlpha, backup.id);

      const eventsAfterDelete = auditService.getEvents(orgAlpha);
      const deleteEvent = eventsAfterDelete.find(
        (e) => e.action === 'BACKUP_DELETED' && e.entityId === backup.id,
      );
      expect(deleteEvent).toBeDefined();
      expect(deleteEvent?.actorId).toBe(adminAlpha.id);
      expect(deleteEvent?.metadata?.wasExpired).toBe(false);
    });
  });

  describe('6. Controller Integration & HTTP Headers', () => {
    it('creates backup through controller', async () => {
      const result = await backupController.createBackup(adminAlpha, {
        description: 'Controller create test',
      });
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(orgAlpha);
    });

    it('rejects system backup in controller when user is not SystemOwner', async () => {
      await expect(
        backupController.createBackup(adminAlpha, { scope: 'SYSTEM' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('downloads backup package with proper HTTP attachment headers', async () => {
      const backup = await backupController.createBackup(adminAlpha, {
        description: 'Download header test',
      });

      const res = mockResponse();
      const pkg = await backupController.downloadBackup(adminAlpha, backup.id, res);

      expect(pkg.id).toBe(backup.id);
      expect(pkg.checksumSha256).toBe(backup.checksumSha256);
      expect(res.getHeader('Content-Type')).toBe('application/json');
      expect(res.getHeader('Content-Disposition')).toContain(`attachment; filename="backup-${backup.id}.enc.json"`);
    });

    it('executes restore drill through controller', async () => {
      const backup = await backupController.createBackup(adminAlpha, {});
      const drill = await backupController.executeRestoreDrill(adminAlpha, backup.id);
      expect(drill.success).toBe(true);
      expect(drill.backupId).toBe(backup.id);
    });

    it('deletes backup through controller', async () => {
      const backup = await backupController.createBackup(adminAlpha, {});
      const res = await backupController.deleteBackup(adminAlpha, backup.id, 'true');
      expect(res.success).toBe(true);
      expect(res.id).toBe(backup.id);
    });
  });
});
