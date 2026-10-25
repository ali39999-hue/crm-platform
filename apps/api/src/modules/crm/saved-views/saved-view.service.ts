import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SavedViewDto, SavedViewEntityType } from '@crm/contracts';
import type { MembershipRole } from '@crm/domain';
import { SavedViewEntity, SavedViewRepository } from './saved-view.repository.js';
import type { CreateSavedViewDto } from './dto/create-saved-view.dto.js';
import type { UpdateSavedViewDto } from './dto/update-saved-view.dto.js';
import { AuditService } from '../../audit/audit.service.js';

export function isAdminRole(role?: MembershipRole | string): boolean {
  return role === 'SystemOwner' || role === 'OrganizationAdmin';
}

const VALID_ENTITY_TYPES: ReadonlySet<SavedViewEntityType> = new Set([
  'TASK',
  'ACCOUNT',
  'CONTACT',
  'LEAD',
  'TICKET',
]);

@Injectable()
export class SavedViewService {
  constructor(
    private readonly repo: SavedViewRepository,
    private readonly auditService: AuditService,
  ) {}

  async createView(
    organizationId: string,
    userId: string,
    dto: CreateSavedViewDto,
    actorRole?: string,
    requestId?: string,
  ): Promise<SavedViewDto> {
    if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('View name is required and cannot be empty');
    }

    if (!dto.entityType || !VALID_ENTITY_TYPES.has(dto.entityType)) {
      throw new BadRequestException(
        `Invalid entityType '${dto.entityType}'. Must be one of: ${Array.from(VALID_ENTITY_TYPES).join(', ')}`,
      );
    }

    if (!dto.filters || typeof dto.filters !== 'object' || Array.isArray(dto.filters)) {
      throw new BadRequestException('Filters must be a valid key-value object');
    }

    if (dto.sortOrder && dto.sortOrder !== 'ASC' && dto.sortOrder !== 'DESC') {
      throw new BadRequestException("sortOrder must be either 'ASC' or 'DESC'");
    }

    const isShared = Boolean(dto.isShared);

    const entity = await this.repo.create({
      organizationId,
      entityType: dto.entityType,
      name: dto.name.trim(),
      filters: dto.filters,
      sortField: dto.sortField?.trim(),
      sortOrder: dto.sortOrder,
      isShared,
      createdBy: userId,
    });

    this.auditService.record({
      organizationId,
      actorId: userId,
      action: 'SAVED_VIEW_CREATED',
      entityType: 'SavedView',
      entityId: entity.id,
      requestId,
      metadata: {
        name: entity.name,
        entityType: entity.entityType,
        isShared: entity.isShared,
      },
    });

    return this.mapToDto(entity);
  }

  async getViews(
    organizationId: string,
    userId: string,
    entityType?: SavedViewEntityType,
  ): Promise<SavedViewDto[]> {
    if (entityType && !VALID_ENTITY_TYPES.has(entityType)) {
      throw new BadRequestException(
        `Invalid entityType '${entityType}'. Must be one of: ${Array.from(VALID_ENTITY_TYPES).join(', ')}`,
      );
    }

    const views = await this.repo.findMany(organizationId, {
      userId,
      ...(entityType ? { entityType } : {}),
    });

    return views.map((v) => this.mapToDto(v));
  }

  async getViewById(
    organizationId: string,
    id: string,
    userId: string,
  ): Promise<SavedViewDto> {
    const view = await this.repo.findById(organizationId, id);
    if (!view) {
      throw new NotFoundException(`Saved view ${id} not found in this organization`);
    }

    // Permission check: private views only visible to createdBy, shared views visible to organization members
    if (!view.isShared && view.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this private saved view',
      );
    }

    return this.mapToDto(view);
  }

  async updateView(
    organizationId: string,
    id: string,
    userId: string,
    dto: UpdateSavedViewDto,
    actorRole?: string,
    requestId?: string,
  ): Promise<SavedViewDto> {
    const existing = await this.repo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Saved view ${id} not found in this organization`);
    }

    // Permission check for modifying views
    const isCreator = existing.createdBy === userId;
    const isAdmin = isAdminRole(actorRole);

    if (!existing.isShared && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to modify this private saved view',
      );
    }

    if (existing.isShared && !isCreator && !isAdmin) {
      throw new ForbiddenException(
        'Only the view creator or an organization admin can modify this shared view',
      );
    }

    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
        throw new BadRequestException('View name cannot be empty');
      }
    }

    if (dto.filters !== undefined) {
      if (typeof dto.filters !== 'object' || Array.isArray(dto.filters) || dto.filters === null) {
        throw new BadRequestException('Filters must be a valid key-value object');
      }
    }

    if (dto.sortOrder !== undefined && dto.sortOrder !== 'ASC' && dto.sortOrder !== 'DESC') {
      throw new BadRequestException("sortOrder must be either 'ASC' or 'DESC'");
    }

    const updates: Partial<Omit<SavedViewEntity, 'id' | 'organizationId' | 'createdBy' | 'createdAt' | 'updatedAt'>> = {};
    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.filters !== undefined) updates.filters = dto.filters;
    if (dto.sortField !== undefined) updates.sortField = dto.sortField ? dto.sortField.trim() : undefined;
    if (dto.sortOrder !== undefined) updates.sortOrder = dto.sortOrder;
    if (dto.isShared !== undefined) updates.isShared = dto.isShared;

    const updated = await this.repo.update(organizationId, id, updates);
    if (!updated) {
      throw new NotFoundException(`Saved view ${id} not found in this organization`);
    }

    this.auditService.record({
      organizationId,
      actorId: userId,
      action: 'SAVED_VIEW_UPDATED',
      entityType: 'SavedView',
      entityId: id,
      requestId,
      metadata: { updates: dto },
    });

    return this.mapToDto(updated);
  }

  async deleteView(
    organizationId: string,
    id: string,
    userId: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<{ success: boolean; id: string }> {
    const existing = await this.repo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Saved view ${id} not found in this organization`);
    }

    // Permission check for deleting views
    const isCreator = existing.createdBy === userId;
    const isAdmin = isAdminRole(actorRole);

    if (!existing.isShared && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to delete this private saved view',
      );
    }

    if (existing.isShared && !isCreator && !isAdmin) {
      throw new ForbiddenException(
        'Only the view creator or an organization admin can delete this shared view',
      );
    }

    await this.repo.delete(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId: userId,
      action: 'SAVED_VIEW_DELETED',
      entityType: 'SavedView',
      entityId: id,
      requestId,
      metadata: { name: existing.name, entityType: existing.entityType },
    });

    return { success: true, id };
  }

  private mapToDto(entity: SavedViewEntity): SavedViewDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      entityType: entity.entityType,
      name: entity.name,
      filters: entity.filters,
      sortField: entity.sortField,
      sortOrder: entity.sortOrder,
      isShared: entity.isShared,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    };
  }
}
