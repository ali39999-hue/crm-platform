import { Injectable, Logger } from '@nestjs/common';

export type RetentionPolicy = {
  auditLogsDays: number;
  tempFilesDays: number;
  deletedItemsDays: number;
};

export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  auditLogsDays: 365,
  tempFilesDays: 7,
  deletedItemsDays: 30,
};

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);
  private policies: Map<string, RetentionPolicy> = new Map();

  getPolicy(organizationId: string): RetentionPolicy {
    return this.policies.get(organizationId) ?? DEFAULT_RETENTION_POLICY;
  }

  setPolicy(organizationId: string, policy: Partial<RetentionPolicy>): RetentionPolicy {
    const current = this.getPolicy(organizationId);
    const updated = { ...current, ...policy };
    this.policies.set(organizationId, updated);
    this.logger.log(`[RETENTION] Updated policy for org ${organizationId}: ${JSON.stringify(updated)}`);
    return updated;
  }

  isExpired(date: Date | string, retentionDays: number, now: Date = new Date()): boolean {
    const itemDate = typeof date === 'string' ? new Date(date) : date;
    const expiryDate = new Date(itemDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    return now.getTime() > expiryDate.getTime();
  }
}
