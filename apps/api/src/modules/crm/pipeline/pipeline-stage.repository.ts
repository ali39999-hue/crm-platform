import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type PipelineStageEntity = {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  order: number;
  defaultProbability: number;
  isWon: boolean;
  isLost: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PIPELINE_STAGES: ReadonlyArray<
  Omit<PipelineStageEntity, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
> = [
  {
    name: 'شناسایی و احراز صلاحیت',
    key: 'QUALIFICATION',
    order: 1,
    defaultProbability: 10,
    isWon: false,
    isLost: false,
    color: '#64748b',
  },
  {
    name: 'تحلیل نیازها',
    key: 'NEED_ANALYSIS',
    order: 2,
    defaultProbability: 25,
    isWon: false,
    isLost: false,
    color: '#3b82f6',
  },
  {
    name: 'ارائه پیشنهاد',
    key: 'PROPOSAL',
    order: 3,
    defaultProbability: 50,
    isWon: false,
    isLost: false,
    color: '#8b5cf6',
  },
  {
    name: 'مذاکره و توافق',
    key: 'NEGOTIATION',
    order: 4,
    defaultProbability: 80,
    isWon: false,
    isLost: false,
    color: '#f59e0b',
  },
  {
    name: 'موفق (بسته‌شده)',
    key: 'WON',
    order: 5,
    defaultProbability: 100,
    isWon: true,
    isLost: false,
    color: '#10b981',
  },
  {
    name: 'ناموفق (از دست رفته)',
    key: 'LOST',
    order: 6,
    defaultProbability: 0,
    isWon: false,
    isLost: true,
    color: '#ef4444',
  },
];

@Injectable()
export class PipelineStageRepository {
  private stages: Map<string, PipelineStageEntity> = new Map();
  private initializedOrgs: Set<string> = new Set();

  constructor() {
    // Seed default organizations
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    this.ensureDefaultStages(orgAlpha);
    this.ensureDefaultStages(orgBeta);
  }

  ensureDefaultStages(organizationId: string): void {
    if (this.initializedOrgs.has(organizationId)) {
      return;
    }
    this.initializedOrgs.add(organizationId);

    const now = new Date().toISOString();
    for (const def of DEFAULT_PIPELINE_STAGES) {
      const id = randomUUID();
      this.stages.set(id, {
        id,
        organizationId,
        ...def,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async findStages(organizationId: string): Promise<PipelineStageEntity[]> {
    this.ensureDefaultStages(organizationId);
    return Array.from(this.stages.values())
      .filter((s) => s.organizationId === organizationId)
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }

  async findStageById(
    organizationId: string,
    id: string,
  ): Promise<PipelineStageEntity | null> {
    this.ensureDefaultStages(organizationId);
    const stage = this.stages.get(id);
    if (!stage || stage.organizationId !== organizationId) {
      return null;
    }
    return stage;
  }

  async findStageByKey(
    organizationId: string,
    key: string,
  ): Promise<PipelineStageEntity | null> {
    this.ensureDefaultStages(organizationId);
    const normalizedKey = key.trim().toUpperCase();
    for (const stage of this.stages.values()) {
      if (
        stage.organizationId === organizationId &&
        stage.key.toUpperCase() === normalizedKey
      ) {
        return stage;
      }
    }
    return null;
  }

  async createStage(
    data: Omit<PipelineStageEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PipelineStageEntity> {
    this.ensureDefaultStages(data.organizationId);
    const id = randomUUID();
    const now = new Date().toISOString();
    const entity: PipelineStageEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.stages.set(id, entity);
    return entity;
  }

  async updateStage(
    organizationId: string,
    id: string,
    data: Partial<
      Omit<PipelineStageEntity, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<PipelineStageEntity | null> {
    const existing = await this.findStageById(organizationId, id);
    if (!existing) {
      return null;
    }

    const updated: PipelineStageEntity = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.stages.set(id, updated);
    return updated;
  }

  async deleteStage(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findStageById(organizationId, id);
    if (!existing) {
      return false;
    }
    this.stages.delete(id);
    return true;
  }

  async reorderStages(
    organizationId: string,
    stageIds: string[],
  ): Promise<PipelineStageEntity[]> {
    this.ensureDefaultStages(organizationId);
    const now = new Date().toISOString();

    stageIds.forEach((id, index) => {
      const stage = this.stages.get(id);
      if (stage && stage.organizationId === organizationId) {
        this.stages.set(id, {
          ...stage,
          order: index + 1,
          updatedAt: now,
        });
      }
    });

    return this.findStages(organizationId);
  }
}
