import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CustomFieldEntity,
  ICustomFieldRepository,
} from './custom-field.repository.js';
import type { CustomFieldEntityType, CustomFieldType } from '@crm/contracts';

@Injectable()
export class PrismaCustomFieldRepository implements ICustomFieldRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(c: any): CustomFieldEntity {
    return {
      id: c.id,
      organizationId: c.organizationId,
      entityType: c.entityType as CustomFieldEntityType,
      key: c.key,
      label: c.label,
      type: c.type as CustomFieldType,
      options: c.options ?? undefined,
      isRequired: c.isRequired,
      defaultValue: c.defaultValue ?? undefined,
      order: c.order,
      active: c.active,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async findByOrg(organizationId: string, entityType?: CustomFieldEntityType): Promise<CustomFieldEntity[]> {
    const where: any = { organizationId };
    if (entityType) where.entityType = entityType;
    const rows = await (this.prisma.tenantClient as any).customField.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return rows.map((c: any) => this.mapToEntity(c));
  }

  async findById(organizationId: string, id: string): Promise<CustomFieldEntity | null> {
    const row = await (this.prisma.tenantClient as any).customField.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapToEntity(row) : null;
  }

  async findByKey(
    organizationId: string,
    entityType: CustomFieldEntityType,
    key: string,
  ): Promise<CustomFieldEntity | null> {
    const row = await (this.prisma.tenantClient as any).customField.findFirst({
      where: { organizationId, entityType, key },
    });
    return row ? this.mapToEntity(row) : null;
  }

  async create(data: Omit<CustomFieldEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomFieldEntity> {
    const created = await (this.prisma.tenantClient as any).customField.create({
      data: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        key: data.key,
        label: data.label,
        type: data.type,
        options: data.options ?? [],
        isRequired: data.isRequired,
        defaultValue: data.defaultValue ?? undefined,
        order: data.order,
        active: data.active,
      },
    });
    return this.mapToEntity(created);
  }

  async update(entity: CustomFieldEntity): Promise<CustomFieldEntity> {
    const updated = await (this.prisma.tenantClient as any).customField.update({
      where: { id: entity.id },
      data: {
        label: entity.label,
        type: entity.type,
        options: entity.options ?? [],
        isRequired: entity.isRequired,
        defaultValue: entity.defaultValue ?? undefined,
        order: entity.order,
        active: entity.active,
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).customField.delete({ where: { id } });
    return true;
  }
}
