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
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { SupportService } from './support.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto.js';
import type { Request } from 'express';
import type {
  AssignTicketRequest,
  CreateSupportMacroRequest,
  SupportMacroDto,
  TicketDto,
  UpdateSupportMacroRequest,
} from '@crm/contracts';

@Controller('tickets')
@UseGuards(AuthGuard, PermissionsGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('macros/all')
  @RequirePermission('reply_to_customer')
  async getMacros(
    @CurrentUser() user: UserContext,
    @Query('category') category?: string,
  ): Promise<SupportMacroDto[]> {
    return this.supportService.getMacros(user.activeOrganization.id, category);
  }

  @Post('macros')
  @RequirePermission('reply_to_customer')
  async createMacro(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateSupportMacroRequest,
  ): Promise<SupportMacroDto> {
    return this.supportService.createMacro(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Patch('macros/:id')
  @RequirePermission('reply_to_customer')
  async updateMacro(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateSupportMacroRequest,
  ): Promise<SupportMacroDto> {
    return this.supportService.updateMacro(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
    );
  }

  @Delete('macros/:id')
  @RequirePermission('reply_to_customer')
  async deleteMacro(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.supportService.deleteMacro(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }

  @Get()
  async getTickets(
    @CurrentUser() user: UserContext,
    @Query('accountId') accountId?: string,
  ) {
    return this.supportService.getTickets(user.activeOrganization.id, accountId);
  }

  @Post()
  async createTicket(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateTicketDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.supportService.createTicket(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Get(':id')
  async getTicketById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.supportService.getTicketById(user.activeOrganization.id, id);
  }

  @Patch(':id')
  @RequirePermission('reply_to_customer')
  async updateTicket(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: AssignTicketRequest,
  ): Promise<TicketDto> {
    return this.supportService.updateTicketStatusOrAssign(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
    );
  }

  @Get(':id/messages')
  async getTicketMessages(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.supportService.getTicketMessages(
      user.activeOrganization.id,
      user.activeOrganization.role,
      id,
    );
  }

  @Post(':id/messages')
  async addTicketMessage(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.supportService.addMessage(
      user.activeOrganization.id,
      user,
      id,
      dto,
      requestId,
    );
  }
}
