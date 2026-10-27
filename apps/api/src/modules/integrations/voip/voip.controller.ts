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
import { VoipService } from './voip.service.js';
import { VoipCallEventDtoClass } from './dto/voip-call-event.dto.js';
import { ClickToCallDto } from './dto/click-to-call.dto.js';
import type { VoipCallerProfileDto } from '@crm/contracts';

@Controller('integrations/voip')
@UseGuards(AuthGuard, PermissionsGuard)
export class VoipController {
  constructor(private readonly voipService: VoipService) {}

  @Post('call-event')
  @RequirePermission('edit_crm')
  async handleCallEvent(
    @CurrentUser() user: UserContext,
    @Body() dto: VoipCallEventDtoClass,
  ): Promise<VoipCallerProfileDto> {
    return this.voipService.handleCallEvent(user.activeOrganization.id, dto);
  }

  @Get('active-call')
  @RequirePermission('view_crm')
  async getActiveCall(
    @CurrentUser() user: UserContext,
    @Query('extension') extension?: string,
  ): Promise<VoipCallerProfileDto | null> {
    return this.voipService.getActiveCall(user.activeOrganization.id, extension);
  }

  @Post('click-to-call')
  @RequirePermission('edit_crm')
  async clickToCall(
    @CurrentUser() user: UserContext,
    @Body() dto: ClickToCallDto,
  ): Promise<{ success: boolean; message: string; callId: string }> {
    return this.voipService.initiateClickToCall(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }
}
