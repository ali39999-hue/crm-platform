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
import { MarkDealLostDto } from './dto/mark-deal-lost.dto.js';
import { ScheduleNextActionDto } from './dto/schedule-next-action.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import type { Request } from 'express';
import type {
  DuplicateCandidateDto,
  MergeRecordsRequest,
  ProductCatalogItemDto,
  ProformaInvoiceDto,
  SalesLossAnalyticsDto,
  SalesTargetDto,
} from '@crm/contracts';

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

  @Get('contacts/birthdays/today')
  @RequirePermission('view_crm')
  async getTodayBirthdays(@CurrentUser() user: UserContext) {
    return this.crmService.getTodayBirthdays(user.activeOrganization.id);
  }

  @Post('contacts/:id/birthday-sms')
  @RequirePermission('edit_crm')
  async sendBirthdaySms(
    @CurrentUser() user: UserContext,
    @Param('id') contactId: string,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.sendBirthdaySms(
      user.activeOrganization.id,
      user.id,
      contactId,
      requestId,
    );
  }

  @Get('contacts/dormant')
  @RequirePermission('view_crm')
  async getDormantCustomers(
    @CurrentUser() user: UserContext,
    @Query('thresholdDays') thresholdDays?: string,
  ) {
    const days = thresholdDays ? parseInt(thresholdDays, 10) : 60;
    return this.crmService.getDormantCustomers(user.activeOrganization.id, days);
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

  @Post('deals/:id/lost')
  @RequirePermission('edit_crm')
  async markDealLost(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: MarkDealLostDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.markDealLost(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
      requestId,
    );
  }

  @Post('deals/:id/next-action')
  @RequirePermission('edit_crm')
  async scheduleNextAction(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: ScheduleNextActionDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.scheduleNextAction(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
      requestId,
    );
  }

  /* Products & Services Catalog */
  @Get('products')
  @RequirePermission('view_crm')
  async getProducts(@CurrentUser() user: UserContext): Promise<ProductCatalogItemDto[]> {
    return this.crmService.getProducts(user.activeOrganization.id);
  }

  @Post('products')
  @RequirePermission('edit_crm')
  async createProduct(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateProductDto,
    @Req() req: Request,
  ): Promise<ProductCatalogItemDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.createProduct(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  /* Proforma Invoicing & Line Items */
  @Get('deals/:id/invoices')
  @RequirePermission('view_crm')
  async getInvoices(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<ProformaInvoiceDto[]> {
    return this.crmService.getInvoices(user.activeOrganization.id, id);
  }

  @Post('deals/:id/invoices')
  @RequirePermission('edit_crm')
  async createInvoice(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateInvoiceDto,
    @Req() req: Request,
  ): Promise<ProformaInvoiceDto> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    dto.dealId = id;
    return this.crmService.createInvoice(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  /* Sales Failure Analytics & Target Quota */
  @Get('analytics/loss-reasons')
  @RequirePermission('view_crm')
  async getSalesLossAnalytics(@CurrentUser() user: UserContext): Promise<SalesLossAnalyticsDto> {
    return this.crmService.getSalesLossAnalytics(user.activeOrganization.id);
  }

  @Get('analytics/sales-target')
  @RequirePermission('view_crm')
  async getSalesTarget(@CurrentUser() user: UserContext): Promise<SalesTargetDto> {
    return this.crmService.getSalesTarget(user.activeOrganization.id, user.id);
  }

  @Get('analytics/conversion-speed')
  @RequirePermission('view_crm')
  async getConversionSpeedAnalytics(@CurrentUser() user: UserContext) {
    return this.crmService.getConversionSpeedAnalytics(user.activeOrganization.id);
  }

  /* Duplicate Resolution & Merging */
  @Get('duplicates/candidates')
  @RequirePermission('edit_crm')
  async getDuplicateCandidates(
    @CurrentUser() user: UserContext,
  ): Promise<DuplicateCandidateDto[]> {
    return this.crmService.getDuplicateCandidates(user.activeOrganization.id);
  }

  @Post('duplicates/merge')
  @RequirePermission('edit_crm')
  async mergeDuplicates(
    @CurrentUser() user: UserContext,
    @Body() dto: MergeRecordsRequest,
    @Req() req: Request,
  ): Promise<{ success: boolean; mergedId: string }> {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.crmService.mergeRecords(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }
}
