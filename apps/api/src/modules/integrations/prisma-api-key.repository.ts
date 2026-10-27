import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ApiKeyEntity,
  IApiKeyRepository,
  IntegrationProviderEntity,
} from './api-key.repository.js';
import type { IntegrationProviderKey, IntegrationStatus } from '@crm/contracts';

@Injectable()
export class PrismaApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapKey(k: any): ApiKeyEntity {
    return {
      id: k.id,
      organizationId: k.organizationId,
      name: k.name,
      keyPrefix: k.keyPrefix,
      hashedKey: k.hashedKey,
      scopes: k.scopes ?? [],
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
      active: k.active,
      createdAt: k.createdAt.toISOString(),
    };
  }

  private mapProvider(p: any): IntegrationProviderEntity {
    return {
      id: p.id,
      organizationId: p.organizationId,
      providerKey: p.providerKey as IntegrationProviderKey,
      name: p.name,
      description: p.description,
      icon: p.icon,
      status: p.status as IntegrationStatus,
      configSummary: p.configSummary ?? undefined,
      lastSyncedAt: p.lastSyncedAt ? p.lastSyncedAt.toISOString() : null,
      errorMessage: p.errorMessage ?? null,
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async findKeysByOrg(organizationId: string): Promise<ApiKeyEntity[]> {
    const rows = await (this.prisma.tenantClient as any).apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((k: any) => this.mapKey(k));
  }

  async findKeyById(organizationId: string, id: string): Promise<ApiKeyEntity | null> {
    const row = await (this.prisma.tenantClient as any).apiKey.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapKey(row) : null;
  }

  async createKey(data: Omit<ApiKeyEntity, 'id' | 'createdAt'>): Promise<ApiKeyEntity> {
    const created = await (this.prisma.tenantClient as any).apiKey.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        keyPrefix: data.keyPrefix,
        hashedKey: data.hashedKey,
        scopes: data.scopes,
        lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        active: data.active,
      },
    });
    return this.mapKey(created);
  }

  async revokeKey(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findKeyById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).apiKey.update({
      where: { id },
      data: { active: false },
    });
    return true;
  }

  /* Integration providers */

  async findProviders(organizationId: string): Promise<IntegrationProviderEntity[]> {
    const rows = await (this.prisma.tenantClient as any).integrationProvider.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    return rows.map((p: any) => this.mapProvider(p));
  }

  async findProviderByKey(organizationId: string, key: IntegrationProviderKey): Promise<IntegrationProviderEntity | null> {
    const row = await (this.prisma.tenantClient as any).integrationProvider.findFirst({
      where: { organizationId, providerKey: key },
    });
    return row ? this.mapProvider(row) : null;
  }

  async saveProvider(entity: IntegrationProviderEntity): Promise<IntegrationProviderEntity> {
    const client = this.prisma.tenantClient as any;
    const existing = await client.integrationProvider.findFirst({
      where: { organizationId: entity.organizationId, providerKey: entity.providerKey },
    });

    const data = {
      name: entity.name,
      description: entity.description,
      icon: entity.icon,
      status: entity.status,
      configSummary: entity.configSummary ?? undefined,
      lastSyncedAt: entity.lastSyncedAt ? new Date(entity.lastSyncedAt) : null,
      errorMessage: entity.errorMessage ?? null,
    };

    const saved = existing
      ? await client.integrationProvider.update({ where: { id: existing.id }, data })
      : await client.integrationProvider.create({
          data: {
            organizationId: entity.organizationId,
            providerKey: entity.providerKey,
            ...data,
          },
        });
    return this.mapProvider(saved);
  }
}
