import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { SupportService } from './support.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto.js';
import type { Request } from 'express';

@Controller('tickets')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

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
