import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SavedViewDto, SavedViewEntityType } from '@crm/contracts';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../../common/auth/auth.types.js';
import { SavedViewService } from './saved-view.service.js';
import { CreateSavedViewDto } from './dto/create-saved-view.dto.js';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto.js';

@Controller('crm/saved-views')
@UseGuards(AuthGuard, PermissionsGuard)
export class SavedViewController {
  constructor(private readonly savedViewService: SavedViewService) {}

  @Post()
  @RequirePermission('view_crm')
  async createView(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateSavedViewDto,
    @Req() req: Request,
  ): Promise<SavedViewDto> {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.savedViewService.createView(
      user.activeOrganization.id,
      user.id,
      dto,
      user.activeOrganization.role,
      requestId,
    );
  }

  @Get()
  @RequirePermission('view_crm')
  async getViews(
    @CurrentUser() user: UserContext,
    @Query('entityType') entityType?: SavedViewEntityType,
  ): Promise<SavedViewDto[]> {
    return this.savedViewService.getViews(
      user.activeOrganization.id,
      user.id,
      entityType,
    );
  }

  @Get(':id')
  @RequirePermission('view_crm')
  async getViewById(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<SavedViewDto> {
    return this.savedViewService.getViewById(
      user.activeOrganization.id,
      id,
      user.id,
    );
  }

  @Patch(':id')
  @RequirePermission('view_crm')
  async updateView(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateSavedViewDto,
    @Req() req: Request,
  ): Promise<SavedViewDto> {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.savedViewService.updateView(
      user.activeOrganization.id,
      id,
      user.id,
      dto,
      user.activeOrganization.role,
      requestId,
    );
  }

  @Delete(':id')
  @RequirePermission('view_crm')
  async deleteView(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ success: boolean; id: string }> {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.savedViewService.deleteView(
      user.activeOrganization.id,
      id,
      user.id,
      user.activeOrganization.role,
      requestId,
    );
  }
}
