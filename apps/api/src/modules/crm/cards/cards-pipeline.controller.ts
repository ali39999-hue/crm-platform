import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../../common/auth/auth.types.js';
import { CardsPipelineService } from './cards-pipeline.service.js';
import type { Request } from 'express';
import type {
  CreateProjectCardRequest,
  HandoffDealToProjectRequest,
  ProjectCardDto,
  ProjectCardStage,
  UpdateProjectCardRequest,
} from '@crm/contracts';

@Controller('crm')
@UseGuards(AuthGuard, PermissionsGuard)
export class CardsPipelineController {
  constructor(private readonly cardsService: CardsPipelineService) {}

  @Get('cards')
  @RequirePermission('view_crm')
  async getCards(
    @CurrentUser() user: UserContext,
    @Query('stage') stage?: ProjectCardStage,
  ): Promise<ProjectCardDto[]> {
    return this.cardsService.getCards(user.activeOrganization.id, stage);
  }

  @Get('cards/:id')
  @RequirePermission('view_crm')
  async getCardById(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<ProjectCardDto> {
    return this.cardsService.getCardById(user.activeOrganization.id, id);
  }

  @Post('cards')
  @RequirePermission('edit_crm')
  async createCard(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateProjectCardRequest,
    @Req() req: Request,
  ): Promise<ProjectCardDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.cardsService.createCard(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Patch('cards/:id')
  @RequirePermission('edit_crm')
  async updateCard(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProjectCardRequest,
    @Req() req: Request,
  ): Promise<ProjectCardDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.cardsService.updateCard(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
      requestId,
    );
  }

  @Post('deals/:id/handoff-to-project')
  @RequirePermission('edit_crm')
  async handoffWonDealToProject(
    @CurrentUser() user: UserContext,
    @Param('id') dealId: string,
    @Body() dto: HandoffDealToProjectRequest,
    @Req() req: Request,
  ): Promise<ProjectCardDto> {
    dto.dealId = dealId;
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.cardsService.handoffWonDealToProject(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }
}
