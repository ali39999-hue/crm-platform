import {
  Body,
  Controller,
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
import { InstallmentsService } from './installments.service.js';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto.js';
import { UpdateCheckStatusDto } from './dto/update-check-status.dto.js';
import type { Request } from 'express';
import type { CheckItemDto, InstallmentPlanDto } from '@crm/contracts';

@Controller('crm')
@UseGuards(AuthGuard, PermissionsGuard)
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  @Post('deals/:id/installments')
  @RequirePermission('edit_crm')
  async createInstallmentPlan(
    @CurrentUser() user: UserContext,
    @Param('id') dealId: string,
    @Body() dto: CreateInstallmentPlanDto,
    @Req() req: Request,
  ): Promise<InstallmentPlanDto> {
    dto.dealId = dealId;
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.installmentsService.createInstallmentPlan(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Get('deals/:id/installments')
  @RequirePermission('view_crm')
  async getInstallmentPlan(
    @CurrentUser() user: UserContext,
    @Param('id') dealId: string,
  ): Promise<InstallmentPlanDto> {
    return this.installmentsService.getInstallmentPlan(
      user.activeOrganization.id,
      dealId,
    );
  }

  @Patch('checks/:id/status')
  @RequirePermission('edit_crm')
  async updateCheckStatus(
    @CurrentUser() user: UserContext,
    @Param('id') checkId: string,
    @Body() dto: UpdateCheckStatusDto,
    @Req() req: Request,
  ): Promise<CheckItemDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.installmentsService.updateCheckStatus(
      user.activeOrganization.id,
      user.id,
      checkId,
      dto.status,
      requestId,
    );
  }

  @Post('checks/:id/send-reminder')
  @RequirePermission('edit_crm')
  async sendCheckReminder(
    @CurrentUser() user: UserContext,
    @Param('id') checkId: string,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.installmentsService.sendCheckReminder(
      user.activeOrganization.id,
      user.id,
      checkId,
      requestId,
    );
  }
}
