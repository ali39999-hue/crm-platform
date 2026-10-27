import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { NotificationService } from './notification.service.js';
import {
  NotificationDispatcherService,
  type RetryDeadLetterResult,
} from './notification-dispatcher.service.js';
import type {
  DeadLetterNotificationDto,
  NotificationDto,
  NotificationPreferencesDto,
} from '@crm/contracts';

  // Self-service writes (mark-read, preferences) stay at view_internal_tasks
  // by design: they only mutate the caller's own rows; a dedicated
  // self-service action is a P02 matrix follow-up.
@Controller('notifications')
@UseGuards(AuthGuard, PermissionsGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    @Optional()
    private readonly dispatcherService?: NotificationDispatcherService,
  ) {}

  private checkAdminRole(user: UserContext): void {
    const role = user?.activeOrganization?.role;
    if (role !== 'SystemOwner' && role !== 'OrganizationAdmin') {
      throw new ForbiddenException(
        'Admin permissions (SystemOwner or OrganizationAdmin) required for dead-letter queue operations',
      );
    }
  }

  @Get()
  @RequirePermission('view_internal_tasks')
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

  @Get('dlq')
  @RequirePermission('manage_integrations')
  async getDeadLetters(
    @CurrentUser() user: UserContext,
    @Query('limit') limit?: number,
  ): Promise<DeadLetterNotificationDto[]> {
    this.checkAdminRole(user);
    if (this.dispatcherService) {
      return this.dispatcherService.getDeadLetters(
        user.activeOrganization.id,
        limit ? Number(limit) : 50,
      );
    }
    return this.notificationService.getDeadLetters(
      user.activeOrganization.id,
      limit ? Number(limit) : 50,
    );
  }

  @Post('dlq/:id/retry')
  @RequirePermission('manage_integrations')
  async retryDeadLetter(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<RetryDeadLetterResult> {
    this.checkAdminRole(user);
    if (this.dispatcherService) {
      return this.dispatcherService.retryDeadLetter(
        user.activeOrganization.id,
        id,
      );
    }
    return this.notificationService.retryDeadLetter(
      user.activeOrganization.id,
      id,
    );
  }

  @Post(':id/read')
  @RequirePermission('view_internal_tasks')
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
  @RequirePermission('view_internal_tasks')
  async markAllAsRead(@CurrentUser() user: UserContext): Promise<{ count: number }> {
    return this.notificationService.markAllAsRead(
      user.activeOrganization.id,
      user.id,
    );
  }

  @Get('preferences')
  @RequirePermission('view_internal_tasks')
  async getPreferences(@CurrentUser() user: UserContext): Promise<NotificationPreferencesDto> {
    return this.notificationService.getPreferences(user.id);
  }

  @Put('preferences')
  @RequirePermission('view_internal_tasks')
  async setPreferences(
    @CurrentUser() user: UserContext,
    @Body() prefs: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationService.setPreferences(user.id, prefs);
  }
}
