import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PipelineStageDto } from '@crm/contracts';
import type { MembershipRole } from '@crm/domain';
import {
  PipelineStageEntity,
  PipelineStageRepository,
} from './pipeline-stage.repository.js';
import type { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto.js';
import type { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';
import { DealEntity, InMemoryCrmRepository } from '../crm.repository.js';

export function isAdminRole(role?: MembershipRole | string): boolean {
  return role === 'SystemOwner' || role === 'OrganizationAdmin';
}

@Injectable()
export class PipelineStageService {
  constructor(
    private readonly stageRepo: PipelineStageRepository,
    private readonly crmRepo: InMemoryCrmRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  /* CRUD Operations */

  async getStages(organizationId: string): Promise<PipelineStageDto[]> {
    const stages = await this.stageRepo.findStages(organizationId);
    return stages.map((s) => this.mapStage(s));
  }

  async getStageById(organizationId: string, id: string): Promise<PipelineStageDto> {
    const stage = await this.stageRepo.findStageById(organizationId, id);
    if (!stage) {
      throw new NotFoundException(
        `Pipeline stage ${id} not found in this organization`,
      );
    }
    return this.mapStage(stage);
  }

  async getStageByKey(
    organizationId: string,
    key: string,
  ): Promise<PipelineStageDto | null> {
    const stage = await this.stageRepo.findStageByKey(organizationId, key);
    return stage ? this.mapStage(stage) : null;
  }

  async createStage(
    organizationId: string,
    actorId: string,
    dto: CreatePipelineStageDto,
    requestId?: string,
  ): Promise<PipelineStageDto> {
    const normalizedKey = dto.key.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.stageRepo.findStageByKey(organizationId, normalizedKey);
    if (existing) {
      throw new BadRequestException(
        `Pipeline stage with key '${normalizedKey}' already exists in this organization`,
      );
    }

    if (dto.isWon && dto.isLost) {
      throw new BadRequestException('A stage cannot be marked as both Won and Lost');
    }

    const currentStages = await this.stageRepo.findStages(organizationId);
    let order = dto.order;
    if (order === undefined || order === null) {
      const maxOrder = currentStages.reduce(
        (max, s) => (s.order > max ? s.order : max),
        0,
      );
      order = maxOrder + 1;
    }

    const defaultProbability =
      dto.defaultProbability !== undefined
        ? dto.defaultProbability
        : dto.isWon
          ? 100
          : dto.isLost
            ? 0
            : 10;

    const stage = await this.stageRepo.createStage({
      organizationId,
      name: dto.name.trim(),
      key: normalizedKey,
      order,
      defaultProbability,
      isWon: Boolean(dto.isWon),
      isLost: Boolean(dto.isLost),
      color: dto.color ?? null,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_PIPELINE_STAGE_CREATED',
      entityType: 'PipelineStage',
      entityId: stage.id,
      requestId,
      metadata: {
        name: stage.name,
        key: stage.key,
        order: stage.order,
        defaultProbability: stage.defaultProbability,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'PipelineStageCreated',
      aggregateType: 'PipelineStage',
      aggregateId: stage.id,
      payload: {
        key: stage.key,
        name: stage.name,
        order: stage.order,
      },
    });

    return this.mapStage(stage);
  }

  async updateStage(
    organizationId: string,
    actorId: string,
    id: string,
    dto: UpdatePipelineStageDto,
    requestId?: string,
  ): Promise<PipelineStageDto> {
    const existing = await this.stageRepo.findStageById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(
        `Pipeline stage ${id} not found in this organization`,
      );
    }

    let normalizedKey = existing.key;
    if (dto.key && dto.key.trim().toUpperCase() !== existing.key) {
      normalizedKey = dto.key.trim().toUpperCase().replace(/\s+/g, '_');
      const conflict = await this.stageRepo.findStageByKey(organizationId, normalizedKey);
      if (conflict && conflict.id !== id) {
        throw new BadRequestException(
          `Pipeline stage with key '${normalizedKey}' already exists in this organization`,
        );
      }
    }

    const targetIsWon = dto.isWon !== undefined ? dto.isWon : existing.isWon;
    const targetIsLost = dto.isLost !== undefined ? dto.isLost : existing.isLost;
    if (targetIsWon && targetIsLost) {
      throw new BadRequestException('A stage cannot be marked as both Won and Lost');
    }

    const updated = await this.stageRepo.updateStage(organizationId, id, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.key !== undefined ? { key: normalizedKey } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
      ...(dto.defaultProbability !== undefined
        ? { defaultProbability: dto.defaultProbability }
        : {}),
      ...(dto.isWon !== undefined ? { isWon: dto.isWon } : {}),
      ...(dto.isLost !== undefined ? { isLost: dto.isLost } : {}),
      ...(dto.color !== undefined ? { color: dto.color } : {}),
    });

    if (!updated) {
      throw new NotFoundException(
        `Pipeline stage ${id} not found in this organization`,
      );
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_PIPELINE_STAGE_UPDATED',
      entityType: 'PipelineStage',
      entityId: id,
      requestId,
      metadata: {
        updates: dto,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'PipelineStageUpdated',
      aggregateType: 'PipelineStage',
      aggregateId: id,
      payload: {
        key: updated.key,
        name: updated.name,
      },
    });

    return this.mapStage(updated);
  }

  async deleteStage(
    organizationId: string,
    actorId: string,
    id: string,
    requestId?: string,
  ): Promise<{ success: boolean; id: string }> {
    const existing = await this.stageRepo.findStageById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(
        `Pipeline stage ${id} not found in this organization`,
      );
    }

    // Guard: Deals are actively using this stage
    const deals = await this.crmRepo.findDeals(organizationId);
    const dealsInStage = deals.filter((d) => d.stage === existing.key);
    if (dealsInStage.length > 0) {
      throw new BadRequestException(
        `Cannot delete stage '${existing.name}' (${existing.key}) because ${dealsInStage.length} deal(s) are in this stage. Reassign them first.`,
      );
    }

    // Guard: Cannot delete the only won or only lost stage
    const allStages = await this.stageRepo.findStages(organizationId);
    if (existing.isWon) {
      const remainingWon = allStages.filter((s) => s.isWon && s.id !== id);
      if (remainingWon.length === 0) {
        throw new BadRequestException(
          'Cannot delete the only won stage in the pipeline. Each pipeline must have at least one won stage.',
        );
      }
    }

    if (existing.isLost) {
      const remainingLost = allStages.filter((s) => s.isLost && s.id !== id);
      if (remainingLost.length === 0) {
        throw new BadRequestException(
          'Cannot delete the only lost stage in the pipeline. Each pipeline must have at least one lost stage.',
        );
      }
    }

    await this.stageRepo.deleteStage(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_PIPELINE_STAGE_DELETED',
      entityType: 'PipelineStage',
      entityId: id,
      requestId,
      metadata: {
        name: existing.name,
        key: existing.key,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'PipelineStageDeleted',
      aggregateType: 'PipelineStage',
      aggregateId: id,
      payload: {
        key: existing.key,
      },
    });

    return { success: true, id };
  }

  async reorderStages(
    organizationId: string,
    actorId: string,
    stageIds: string[],
    requestId?: string,
  ): Promise<PipelineStageDto[]> {
    const currentStages = await this.stageRepo.findStages(organizationId);
    const existingIds = new Set(currentStages.map((s) => s.id));

    for (const id of stageIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(
          `Stage ID ${id} is not valid for this organization`,
        );
      }
    }

    const updated = await this.stageRepo.reorderStages(organizationId, stageIds);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_PIPELINE_STAGES_REORDERED',
      entityType: 'PipelineStage',
      entityId: organizationId,
      requestId,
      metadata: {
        stageIds,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'PipelineStagesReordered',
      aggregateType: 'PipelineStage',
      aggregateId: organizationId,
      payload: {
        stageIds,
      },
    });

    return updated.map((s) => this.mapStage(s));
  }

  /* Stage Transition Rules & Validation */

  async validateTransition(
    organizationId: string,
    currentStageKey: string,
    targetStageKey: string,
    actorRole?: MembershipRole | string,
  ): Promise<{
    valid: boolean;
    currentStage: PipelineStageDto;
    targetStage: PipelineStageDto;
  }> {
    const currentStage = await this.stageRepo.findStageByKey(
      organizationId,
      currentStageKey,
    );
    if (!currentStage) {
      throw new BadRequestException(
        `Current stage '${currentStageKey}' is not configured in organization pipeline`,
      );
    }

    const targetStage = await this.stageRepo.findStageByKey(
      organizationId,
      targetStageKey,
    );
    if (!targetStage) {
      throw new BadRequestException(
        `Target stage '${targetStageKey}' is not configured in organization pipeline`,
      );
    }

    // If no change, transition is trivially valid
    if (currentStage.key === targetStage.key) {
      return {
        valid: true,
        currentStage: this.mapStage(currentStage),
        targetStage: this.mapStage(targetStage),
      };
    }

    const admin = isAdminRole(actorRole);

    // Rule 1: Closed-to-closed transition (WON -> LOST or LOST -> WON) requires admin
    if (currentStage.isWon && targetStage.isLost && !admin) {
      throw new ForbiddenException(
        `Cannot transition deal from WON to LOST without administrator privileges`,
      );
    }
    if (currentStage.isLost && targetStage.isWon && !admin) {
      throw new ForbiddenException(
        `Cannot transition deal from LOST to WON without administrator privileges`,
      );
    }

    // Rule 2: Reopening a closed deal (WON or LOST -> active stage) requires admin
    const currentIsClosed = currentStage.isWon || currentStage.isLost;
    const targetIsClosed = targetStage.isWon || targetStage.isLost;
    if (currentIsClosed && !targetIsClosed && !admin) {
      throw new ForbiddenException(
        `Reopening a closed deal from stage '${currentStage.name}' requires administrator privileges`,
      );
    }

    return {
      valid: true,
      currentStage: this.mapStage(currentStage),
      targetStage: this.mapStage(targetStage),
    };
  }

  /* Dynamic Probability & Weighted Value Calculations */

  async getStageProbability(
    organizationId: string,
    stageKey: string,
  ): Promise<number> {
    const stage = await this.stageRepo.findStageByKey(organizationId, stageKey);
    return stage?.defaultProbability ?? 10;
  }

  async calculateDealWeightedValue(
    organizationId: string,
    deal: {
      stage: string;
      amountMinor?: number | null;
      probability?: number | null;
    },
  ): Promise<{
    probability: number;
    amountMinor: number;
    weightedAmountMinor: number;
  }> {
    const amountMinor = deal.amountMinor ?? 0;
    let probability: number;

    if (deal.probability !== undefined && deal.probability !== null) {
      probability = deal.probability;
    } else {
      probability = await this.getStageProbability(organizationId, deal.stage);
    }

    const weightedAmountMinor = Math.round((amountMinor * probability) / 100);

    return {
      probability,
      amountMinor,
      weightedAmountMinor,
    };
  }

  async calculatePipelineSummary(
    organizationId: string,
    deals: DealEntity[],
  ): Promise<{
    totalValueMinor: number;
    weightedValueMinor: number;
    stages: Array<{
      stage: PipelineStageDto;
      dealCount: number;
      totalAmountMinor: number;
      weightedAmountMinor: number;
    }>;
  }> {
    const configuredStages = await this.getStages(organizationId);
    let totalValueMinor = 0;
    let weightedValueMinor = 0;

    const stagesBreakdown = configuredStages.map((stage) => {
      const dealsInStage = deals.filter((d) => d.stage === stage.key);
      const dealCount = dealsInStage.length;
      let stageAmount = 0;
      let stageWeightedAmount = 0;

      for (const d of dealsInStage) {
        const amt = d.amountMinor ?? 0;
        const prob = d.probability ?? stage.defaultProbability;
        stageAmount += amt;
        stageWeightedAmount += Math.round((amt * prob) / 100);
      }

      totalValueMinor += stageAmount;
      weightedValueMinor += stageWeightedAmount;

      return {
        stage,
        dealCount,
        totalAmountMinor: stageAmount,
        weightedAmountMinor: stageWeightedAmount,
      };
    });

    return {
      totalValueMinor,
      weightedValueMinor,
      stages: stagesBreakdown,
    };
  }

  private mapStage(entity: PipelineStageEntity): PipelineStageDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      key: entity.key,
      order: entity.order,
      defaultProbability: entity.defaultProbability,
      isWon: entity.isWon,
      isLost: entity.isLost,
      color: entity.color,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
