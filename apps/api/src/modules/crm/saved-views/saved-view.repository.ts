import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { SavedViewEntityType } from '@crm/contracts';

export type SavedViewEntity = {
  id: string;
  organizationId: string;
  entityType: SavedViewEntityType;
  name: string;
  filters: Record<string, any>;
  sortField?: string | undefined;
  sortOrder?: ('ASC' | 'DESC') | undefined;
  isShared: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export interface ISavedViewRepository {
  create(
    data: Omit<SavedViewEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SavedViewEntity>;
  findById(organizationId: string, id: string): Promise<SavedViewEntity | null>;
  findMany(
    organizationId: string,
    options?: {
      userId?: string | undefined;
      entityType?: SavedViewEntityType | undefined;
    },
  ): Promise<SavedViewEntity[]>;
  update(
    organizationId: string,
    id: string,
    data: Partial<
      Omit<SavedViewEntity, 'id' | 'organizationId' | 'createdBy' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<SavedViewEntity | null>;
  delete(organizationId: string, id: string): Promise<boolean>;
}

@Injectable()
export class SavedViewRepository implements ISavedViewRepository {
  private views: Map<string, SavedViewEntity> = new Map();

  async create(
    data: Omit<SavedViewEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SavedViewEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const entity: SavedViewEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.views.set(id, entity);
    return entity;
  }

  async findById(organizationId: string, id: string): Promise<SavedViewEntity | null> {
    const view = this.views.get(id);
    if (!view || view.organizationId !== organizationId) {
      return null;
    }
    return view;
  }

  async findMany(
    organizationId: string,
    options?: {
      userId?: string | undefined;
      entityType?: SavedViewEntityType | undefined;
    },
  ): Promise<SavedViewEntity[]> {
    return Array.from(this.views.values())
      .filter((v) => {
        if (v.organizationId !== organizationId) {
          return false;
        }
        if (options?.entityType && v.entityType !== options.entityType) {
          return false;
        }
        if (options?.userId && !v.isShared && v.createdBy !== options.userId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async update(
    organizationId: string,
    id: string,
    data: Partial<
      Omit<SavedViewEntity, 'id' | 'organizationId' | 'createdBy' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<SavedViewEntity | null> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      return null;
    }

    const updated: SavedViewEntity = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.views.set(id, updated);
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      return false;
    }
    return this.views.delete(id);
  }

  // Testing helper to clear repository state
  clear(): void {
    this.views.clear();
  }
}
