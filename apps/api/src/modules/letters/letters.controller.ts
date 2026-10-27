import {
  Body,
  Controller,
  Delete,
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
import { LettersService } from './letters.service.js';
import type { Request } from 'express';
import type {
  CreateLetterRequest,
  CreateParaffRequest,
  LetterDto,
  LetterParaffDto,
  ReferLetterRequest,
} from '@crm/contracts';

@Controller('letters')
@UseGuards(AuthGuard)
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Get()
  async listLetters(
    @CurrentUser() user: UserContext,
    @Query('mailbox') mailbox?: 'inbox' | 'sent' | 'all',
  ): Promise<LetterDto[]> {
    return this.lettersService.listLetters(
      user.activeOrganization.id,
      user.id,
      mailbox,
    );
  }

  @Post()
  async createLetter(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateLetterRequest,
    @Req() req: Request,
  ): Promise<LetterDto> {
    const requestId = (req as any).requestId as string | undefined;
    return this.lettersService.createLetter(
      user.activeOrganization.id,
      user.id,
      user.displayName || user.email,
      user.activeOrganization.role,
      dto,
      requestId,
    );
  }

  @Get(':id')
  async getLetterById(
    @CurrentUser() user: UserContext,
    @Param('id') letterId: string,
  ): Promise<LetterDto> {
    return this.lettersService.getLetterById(
      user.activeOrganization.id,
      user.id,
      letterId,
    );
  }

  @Delete(':id')
  async deleteLetter(
    @CurrentUser() user: UserContext,
    @Param('id') letterId: string,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const requestId = (req as any).requestId as string | undefined;
    return this.lettersService.deleteLetter(
      user.activeOrganization.id,
      user.id,
      user.activeOrganization.role,
      letterId,
      requestId,
    );
  }

  @Post(':id/referrals')
  async referLetter(
    @CurrentUser() user: UserContext,
    @Param('id') letterId: string,
    @Body() dto: ReferLetterRequest,
    @Req() req: Request,
  ): Promise<LetterDto> {
    const requestId = (req as any).requestId as string | undefined;
    return this.lettersService.referLetter(
      user.activeOrganization.id,
      user.id,
      user.displayName || user.email,
      letterId,
      dto,
      requestId,
    );
  }

  @Post(':id/paraffs')
  async addParaff(
    @CurrentUser() user: UserContext,
    @Param('id') letterId: string,
    @Body() dto: CreateParaffRequest,
    @Req() req: Request,
  ): Promise<LetterParaffDto> {
    const requestId = (req as any).requestId as string | undefined;
    return this.lettersService.addParaff(
      user.activeOrganization.id,
      user.id,
      user.displayName || user.email,
      letterId,
      dto,
      requestId,
    );
  }

  @Delete(':id/paraffs/:paraffId')
  async deleteParaff(
    @CurrentUser() user: UserContext,
    @Param('id') letterId: string,
    @Param('paraffId') paraffId: string,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const requestId = (req as any).requestId as string | undefined;
    return this.lettersService.deleteParaff(
      user.activeOrganization.id,
      user.id,
      user.activeOrganization.role,
      letterId,
      paraffId,
      requestId,
    );
  }
}
