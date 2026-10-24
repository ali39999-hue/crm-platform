import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { NotificationService } from './notification.service.js';
import type { NotificationDto, NotificationPreferencesDto } from '@crm/contracts';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(
    @CurrentUser() user: UserContext,
    @Query('limit') limit?: number,
  ): Promise<NotificationDto[]> {
    return this.notificationService.getMyNotifications(
      user.activeOrganization.id,
      user.id,
      limit ? Number(limit) : 50,
    );
  }

  @Post(':id/read')
  async markAsRead(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<NotificationDto> {
    return this.notificationService.markAsRead(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: UserContext): Promise<{ count: number }> {
    return this.notificationService.markAllAsRead(
      user.activeOrganization.id,
      user.id,
    );
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: UserContext): Promise<NotificationPreferencesDto> {
    return this.notificationService.getPreferences(user.id);
  }

  @Put('preferences')
  async setPreferences(
    @CurrentUser() user: UserContext,
    @Body() prefs: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationService.setPreferences(user.id, prefs);
  }
}
