import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CustomFieldDefinitionDto,
  CustomFieldEntityType,
  CustomFieldType,
} from '@crm/contracts';

export type CustomFieldEntity = {
  id: string;
  organizationId: string;
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[] | undefined;
  isRequired: boolean;
  defaultValue?: any;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface ICustomFieldRepository {
  findByOrg(organizationId: string, entityType?: CustomFieldEntityType): Promise<CustomFieldEntity[]>;
  findById(organizationId: string, id: string): Promise<CustomFieldEntity | null>;
  findByKey(organizationId: string, entityType: CustomFieldEntityType, key: string): Promise<CustomFieldEntity | null>;
  create(data: Omit<CustomFieldEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomFieldEntity>;
  update(entity: CustomFieldEntity): Promise<CustomFieldEntity>;
  delete(organizationId: string, id: string): Promise<boolean>;
}

@Injectable()
export class InMemoryCustomFieldRepository implements ICustomFieldRepository {
  private fields: Map<string, CustomFieldEntity> = new Map();

  constructor() {
    this.seedDefaultFields();
  }

  private seedDefaultFields() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const seeded: CustomFieldEntity[] = [
      {
        id: 'cf-001',
        organizationId: orgAlpha,
        entityType: 'ACCOUNT',
        key: 'national_id',
        label: 'شناسه ملی / کد اقتصادی',
        type: 'TEXT',
        isRequired: true,
        order: 1,
        active: true,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'cf-002',
        organizationId: orgAlpha,
        entityType: 'DEAL',
        key: 'channel_source',
        label: 'کانال معرفی فرصت تجاری',
        type: 'SELECT',
        options: ['نمایشگاه تخصصی', 'معرفی مشتری سابق', 'کمپین دیجیتال', 'تماس مستقیم'],
        isRequired: false,
        defaultValue: 'نمایشگاه تخصصی',
        order: 2,
        active: true,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'cf-003',
        organizationId: orgAlpha,
        entityType: 'TASK',
        key: 'estimated_hours',
        label: 'برآورد نفر-ساعت کار',
        type: 'NUMBER',
        isRequired: false,
        order: 3,
        active: true,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ];

    for (const f of seeded) {
      this.fields.set(f.id, f);
    }
  }

  async findByOrg(
    organizationId: string,
    entityType?: CustomFieldEntityType,
  ): Promise<CustomFieldEntity[]> {
    return Array.from(this.fields.values())
      .filter((f) => {
        if (f.organizationId !== organizationId) return false;
        if (entityType && f.entityType !== entityType) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }

  async findById(organizationId: string, id: string): Promise<CustomFieldEntity | null> {
    const f = this.fields.get(id);
    if (!f || f.organizationId !== organizationId) return null;
    return f;
  }

  async findByKey(
    organizationId: string,
    entityType: CustomFieldEntityType,
    key: string,
  ): Promise<CustomFieldEntity | null> {
    return (
      Array.from(this.fields.values()).find(
        (f) =>
          f.organizationId === organizationId &&
          f.entityType === entityType &&
          f.key.toLowerCase() === key.toLowerCase(),
      ) ?? null
    );
  }

  async create(
    data: Omit<CustomFieldEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CustomFieldEntity> {
    const now = new Date().toISOString();
    const entity: CustomFieldEntity = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.fields.set(entity.id, entity);
    return entity;
  }

  async update(entity: CustomFieldEntity): Promise<CustomFieldEntity> {
    const updated: CustomFieldEntity = {
      ...entity,
      updatedAt: new Date().toISOString(),
    };
    this.fields.set(entity.id, updated);
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const f = await this.findById(organizationId, id);
    if (!f) return false;
    this.fields.delete(id);
    return true;
  }
}
