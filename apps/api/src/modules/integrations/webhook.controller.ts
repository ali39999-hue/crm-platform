import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { WebhookService } from './webhook.service.js';
import {
  CreateWebhookSubscriptionDto,
  TestWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  VerifyWebhookDto,
  type WebhookDelivery,
  type WebhookDeliveryStatus,
  type WebhookSubscription,
} from './dto/webhook-subscription.dto.js';

@Controller('integrations/webhooks')
@UseGuards(AuthGuard, PermissionsGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('subscriptions')
  @RequirePermission('manage_integrations')
  async createSubscription(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    return this.webhookService.createSubscription(
      user.activeOrganization.id,
      dto,
      user.id,
    );
  }

  @Get('subscriptions')
  @RequirePermission('manage_integrations')
  async getSubscriptions(
    @CurrentUser() user: UserContext,
  ): Promise<WebhookSubscription[]> {
    return this.webhookService.getSubscriptions(user.activeOrganization.id);
  }

  @Get('subscriptions/:id')
  @RequirePermission('manage_integrations')
  async getSubscription(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<WebhookSubscription> {
    return this.webhookService.getSubscription(user.activeOrganization.id, id);
  }

  @Patch('subscriptions/:id')
  @RequirePermission('manage_integrations')
  async updateSubscription(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    return this.webhookService.updateSubscription(
      user.activeOrganization.id,
      id,
      dto,
      user.id,
    );
  }

  @Delete('subscriptions/:id')
  @RequirePermission('manage_integrations')
  async deleteSubscription(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.webhookService.deleteSubscription(
      user.activeOrganization.id,
      id,
      user.id,
    );
  }

  @Post('subscriptions/:id/rotate-secret')
  @RequirePermission('manage_integrations')
  async rotateSecret(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<WebhookSubscription> {
    return this.webhookService.rotateSecret(
      user.activeOrganization.id,
      id,
      user.id,
    );
  }

  @Post('subscriptions/:id/test')
  @RequirePermission('manage_integrations')
  async testSubscription(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: TestWebhookSubscriptionDto,
  ): Promise<WebhookDelivery> {
    return this.webhookService.testSubscription(
      user.activeOrganization.id,
      id,
      dto,
    );
  }

  @Get('deliveries')
  @RequirePermission('manage_integrations')
  async getDeliveries(
    @CurrentUser() user: UserContext,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('status') status?: WebhookDeliveryStatus,
    @Query('limit') limit?: string,
  ): Promise<WebhookDelivery[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const options: {
      subscriptionId?: string | undefined;
      status?: WebhookDeliveryStatus | undefined;
      limit?: number | undefined;
    } = {};
    if (subscriptionId !== undefined) options.subscriptionId = subscriptionId;
    if (status !== undefined) options.status = status;
    if (parsedLimit !== undefined) options.limit = parsedLimit;

    return this.webhookService.getDeliveries(user.activeOrganization.id, options);
  }

  @Get('deliveries/:id')
  @RequirePermission('manage_integrations')
  async getDelivery(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<WebhookDelivery> {
    return this.webhookService.getDelivery(user.activeOrganization.id, id);
  }

  @Post('deliveries/:id/retry')
  @RequirePermission('manage_integrations')
  async retryDelivery(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<WebhookDelivery> {
    return this.webhookService.retryDelivery(user.activeOrganization.id, id);
  }

  @Post('verify')
  @RequirePermission('manage_integrations')
  async verifyWebhook(
    @CurrentUser() user: UserContext,
    @Body() dto: VerifyWebhookDto,
  ): Promise<{ valid: boolean; reason?: string }> {
    let secret = dto.secret;
    if (!secret && dto.subscriptionId) {
      const sub = await this.webhookService.getSubscription(
        user.activeOrganization.id,
        dto.subscriptionId,
      );
      secret = sub.secret;
    }

    if (!secret) {
      return {
        valid: false,
        reason: 'Webhook secret or valid subscriptionId must be provided for verification',
      };
    }

    return this.webhookService.verifyWebhookRequest({
      secret,
      payload: dto.payload,
      signature: dto.signature,
      timestamp: dto.timestamp,
      nonce: dto.nonce,
      scope: user.activeOrganization.id,
    });
  }
}
