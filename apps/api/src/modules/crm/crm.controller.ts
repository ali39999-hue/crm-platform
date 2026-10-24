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
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { CrmService } from './crm.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { ConvertLeadDto } from './dto/convert-lead.dto.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { UpdateDealDto } from './dto/update-deal.dto.js';
import type { Request } from 'express';

@Controller('crm')
@UseGuards(AuthGuard, PermissionsGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  /* Accounts */
  @Get('accounts')
  @RequirePermission('view_crm')
  async getAccounts(@CurrentUser() user: UserContext) {
    return this.crmService.getAccounts(user.activeOrganization.id);
  }

  @Post('accounts')
  @RequirePermission('edit_crm')
  async createAccount(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateAccountDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.createAccount(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Get('accounts/:id/timeline')
  @RequirePermission('view_crm')
  async getCustomerTimeline(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.crmService.getCustomerTimeline(user.activeOrganization.id, id);
  }

  /* Contacts */
  @Get('contacts')
  @RequirePermission('view_crm')
  async getContacts(@CurrentUser() user: UserContext, @Query('accountId') accountId?: string) {
    return this.crmService.getContacts(user.activeOrganization.id, accountId);
  }

  @Post('contacts')
  @RequirePermission('edit_crm')
  async createContact(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateContactDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.createContact(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  /* Leads */
  @Get('leads')
  @RequirePermission('view_crm')
  async getLeads(@CurrentUser() user: UserContext) {
    return this.crmService.getLeads(user.activeOrganization.id);
  }

  @Post('leads')
  @RequirePermission('edit_crm')
  async createLead(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateLeadDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.createLead(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Post('leads/:id/convert')
  @RequirePermission('edit_crm')
  async convertLead(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.convertLead(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
      requestId,
    );
  }

  /* Deals */
  @Get('deals')
  @RequirePermission('view_crm')
  async getDeals(@CurrentUser() user: UserContext, @Query('accountId') accountId?: string) {
    return this.crmService.getDeals(user.activeOrganization.id, accountId);
  }

  @Get('deals/:id')
  @RequirePermission('view_crm')
  async getDealById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.crmService.getDealById(user.activeOrganization.id, id);
  }

  @Post('deals')
  @RequirePermission('edit_crm')
  async createDeal(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateDealDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.createDeal(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Patch('deals/:id')
  @RequirePermission('edit_crm')
  async updateDeal(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.updateDeal(
      user.activeOrganization.id,
      user.id,
      user.activeOrganization.role,
      id,
      dto,
      requestId,
    );
  }
}
