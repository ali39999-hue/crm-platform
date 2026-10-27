import {
  Body,
  Controller,
  Get,
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
import { ExhibitionService } from './exhibition.service.js';
import { CreateExhibitionLeadDto } from './dto/create-exhibition-lead.dto.js';
import type { Request } from 'express';
import type { ExhibitionLeadIntakeDto } from '@crm/contracts';

@Controller('crm')
@UseGuards(AuthGuard, PermissionsGuard)
export class ExhibitionController {
  constructor(private readonly exhibitionService: ExhibitionService) {}

  @Get('exhibitions/leads')
  @RequirePermission('view_crm')
  async getExhibitionLeads(
    @CurrentUser() user: UserContext,
    @Query('exhibitionName') exhibitionName?: string,
  ): Promise<ExhibitionLeadIntakeDto[]> {
    return this.exhibitionService.getExhibitionLeads(
      user.activeOrganization.id,
      exhibitionName,
    );
  }

  @Get('exhibitions/stats')
  @RequirePermission('view_crm')
  async getExhibitionStats(
    @CurrentUser() user: UserContext,
    @Query('exhibitionName') exhibitionName: string,
  ) {
    return this.exhibitionService.getExhibitionStats(
      user.activeOrganization.id,
      exhibitionName || 'عمومی',
    );
  }

  @Post('exhibitions/leads')
  @RequirePermission('edit_crm')
  async captureVisitorLead(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateExhibitionLeadDto,
    @Req() req: Request,
  ): Promise<ExhibitionLeadIntakeDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.exhibitionService.captureVisitorLead(
      user.activeOrganization.id,
      user.id,
      user.displayName || 'کارشناس غرفه',
      dto,
      requestId,
    );
  }
}
