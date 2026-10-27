import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  DocumentDetailDto,
  DocumentSpaceDto,
  DocumentSummaryDto,
  DocumentVisibility,
} from '@crm/contracts';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { DocumentsService } from './document.service.js';
import {
  CreateDocumentDto,
  CreateDocumentSpaceDto,
} from './dto/create-document.dto.js';
import {
  UpdateDocumentDto,
  RestoreDocumentRevisionDto,
} from './dto/update-document.dto.js';

@Controller('documents')
@UseGuards(AuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /* Spaces */

  @Get('spaces')
  @RequirePermission('view_internal_tasks')
  async getSpaces(
    @CurrentUser() user: UserContext,
  ): Promise<DocumentSpaceDto[]> {
    return this.documentsService.getSpaces(user.activeOrganization.id);
  }

  @Post('spaces')
  @RequirePermission('create_or_edit_tasks')
  async createSpace(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateDocumentSpaceDto,
  ): Promise<DocumentSpaceDto> {
    return this.documentsService.createSpace(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  /* Documents */

  @Get()
  @RequirePermission('view_internal_tasks')
  async getDocuments(
    @CurrentUser() user: UserContext,
    @Query('spaceId') spaceId?: string,
    @Query('visibility') visibility?: DocumentVisibility,
    @Query('isPublished') isPublishedStr?: string,
    @Query('search') search?: string,
  ): Promise<DocumentSummaryDto[]> {
    const isPublished =
      isPublishedStr === 'true'
        ? true
        : isPublishedStr === 'false'
          ? false
          : undefined;

    const filters: {
      spaceId?: string | undefined;
      visibility?: DocumentVisibility | undefined;
      isPublished?: boolean | undefined;
      search?: string | undefined;
    } = {};
    if (spaceId !== undefined) filters.spaceId = spaceId;
    if (visibility !== undefined) filters.visibility = visibility;
    if (isPublished !== undefined) filters.isPublished = isPublished;
    if (search !== undefined) filters.search = search;

    return this.documentsService.getDocuments(
      user.activeOrganization.id,
      {
        id: user.id,
        role: user.activeOrganization.role,
      },
      filters,
    );
  }

  @Post()
  @RequirePermission('create_or_edit_tasks')
  async createDocument(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentDetailDto> {
    return this.documentsService.createDocument(
      user.activeOrganization.id,
      {
        id: user.id,
        name: user.displayName,
        role: user.activeOrganization.role,
      },
      dto,
    );
  }

  @Get(':id')
  @RequirePermission('view_internal_tasks')
  async getDocumentDetail(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<DocumentDetailDto> {
    return this.documentsService.getDocumentDetail(
      user.activeOrganization.id,
      {
        id: user.id,
        role: user.activeOrganization.role,
      },
      id,
    );
  }

  @Patch(':id')
  @RequirePermission('create_or_edit_tasks')
  async updateDocument(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentDetailDto> {
    return this.documentsService.updateDocument(
      user.activeOrganization.id,
      {
        id: user.id,
        name: user.displayName,
        role: user.activeOrganization.role,
      },
      id,
      dto,
    );
  }

  @Post(':id/restore')
  @RequirePermission('create_or_edit_tasks')
  async restoreRevision(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: RestoreDocumentRevisionDto,
  ): Promise<DocumentDetailDto> {
    return this.documentsService.restoreRevision(
      user.activeOrganization.id,
      {
        id: user.id,
        name: user.displayName,
        role: user.activeOrganization.role,
      },
      id,
      dto.revisionVersion,
      dto.summaryChange,
    );
  }

  @Delete(':id')
  @RequirePermission('create_or_edit_tasks')
  async deleteDocument(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.documentsService.deleteDocument(
      user.activeOrganization.id,
      {
        id: user.id,
        role: user.activeOrganization.role,
      },
      id,
    );
    return { success };
  }
}
