import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import { Public } from '../../../common/auth/public.decorator.js';
import type { UserContext } from '../../../common/auth/auth.types.js';
import { WebFormService } from './web-form.service.js';
import type { Request } from 'express';
import type {
  CreateWebFormRequest,
  SubmitWebFormRequest,
  SubmitWebFormResponse,
  WebFormDto,
} from '@crm/contracts';

@Controller('crm')
@UseGuards(AuthGuard, PermissionsGuard)
export class WebFormController {
  constructor(private readonly webFormService: WebFormService) {}

  /* Admin Management Routes */

  @Get('forms')
  @RequirePermission('view_crm')
  async getForms(@CurrentUser() user: UserContext): Promise<WebFormDto[]> {
    return this.webFormService.getForms(user.activeOrganization.id);
  }

  @Get('forms/:id')
  @RequirePermission('view_crm')
  async getFormById(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<WebFormDto> {
    return this.webFormService.getFormById(user.activeOrganization.id, id);
  }

  @Post('forms')
  @RequirePermission('edit_crm')
  async createForm(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateWebFormRequest,
    @Req() req: Request,
  ): Promise<WebFormDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.webFormService.createForm(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  /* Public Lead Capture Routes */

  @Public()
  @Get('public/forms/:slug')
  async getPublicFormBySlug(@Param('slug') slug: string): Promise<WebFormDto> {
    return this.webFormService.getFormBySlug(slug);
  }

  @Public()
  @Post('public/forms/:id/submit')
  async submitPublicForm(
    @Param('id') formId: string,
    @Body() dto: SubmitWebFormRequest,
  ): Promise<SubmitWebFormResponse> {
    return this.webFormService.submitForm(formId, dto);
  }
}
