import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../../common/auth/auth.types.js';
import { PipelineStageService } from './pipeline-stage.service.js';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto.js';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto.js';
import { ReorderPipelineStagesDto } from './dto/reorder-pipeline-stages.dto.js';
import type { Request } from 'express';

@Controller('crm/pipeline-stages')
@UseGuards(AuthGuard, PermissionsGuard)
export class PipelineStageController {
  constructor(private readonly stageService: PipelineStageService) {}

  @Get()
  @RequirePermission('view_crm')
  async getStages(@CurrentUser() user: UserContext) {
    return this.stageService.getStages(user.activeOrganization.id);
  }

  @Post('reorder')
  @RequirePermission('organization_settings')
  async reorderStages(
    @CurrentUser() user: UserContext,
    @Body() dto: ReorderPipelineStagesDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.stageService.reorderStages(
      user.activeOrganization.id,
      user.id,
      dto.stageIds,
      requestId,
    );
  }

  @Post()
  @RequirePermission('organization_settings')
  async createStage(
    @CurrentUser() user: UserContext,
    @Body() dto: CreatePipelineStageDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.stageService.createStage(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Patch(':id')
  @RequirePermission('organization_settings')
  async updateStage(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdatePipelineStageDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.stageService.updateStage(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
      requestId,
    );
  }

  @Delete(':id')
  @RequirePermission('organization_settings')
  async deleteStage(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny?.requestId as string | undefined;
    return this.stageService.deleteStage(
      user.activeOrganization.id,
      user.id,
      id,
      requestId,
    );
  }
}
