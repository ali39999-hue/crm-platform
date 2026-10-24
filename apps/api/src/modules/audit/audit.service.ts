import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type AuditRecord = {
  id: string;
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string | undefined;
  metadata?: Record<string, any> | undefined;
  createdAt: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private auditEvents: AuditRecord[] = [];

  record(params: {
    organizationId: string;
    actorId?: string | null | undefined;
    action: string;
    entityType: string;
    entityId: string;
    requestId?: string | undefined;
    metadata?: Record<string, any> | undefined;
  }): AuditRecord {
    const record: AuditRecord = {
      id: randomUUID(),
      organizationId: params.organizationId,
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      requestId: params.requestId,
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
    };

    this.auditEvents.push(record);
    this.logger.log(
      `[AUDIT] org=${record.organizationId} actor=${record.actorId} action=${record.action} entity=${record.entityType}:${record.entityId}`,
    );
    return record;
  }

  getEvents(organizationId: string, limit = 50): AuditRecord[] {
    return this.auditEvents
      .filter((e) => e.organizationId === organizationId)
      .slice(-limit)
      .reverse();
  }
}
