import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { ApiKeyService } from './api-key.service.js';
import type {
  ApiKeyDto,
  ConnectIntegrationRequest,
  IntegrationProviderDto,
  IntegrationProviderKey,
} from '@crm/contracts';
import { CreateApiKeyDto } from './dto/api-key.dto.js';
import { ConnectIntegrationDto } from './dto/integration-provider.dto.js';

@Controller('integrations')
@UseGuards(AuthGuard, PermissionsGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  /* API Keys */

  @Get('api-keys')
  @RequirePermission('manage_integrations')
  async getKeys(@CurrentUser() user: UserContext): Promise<ApiKeyDto[]> {
    return this.apiKeyService.getKeys(user.activeOrganization.id);
  }

  @Post('api-keys')
  @RequirePermission('manage_integrations')
  async createKey(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyDto> {
    return this.apiKeyService.createKey(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Delete('api-keys/:id')
  @RequirePermission('manage_integrations')
  async revokeKey(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.apiKeyService.revokeKey(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }

  /* Connected Providers */

  @Get('providers')
  @RequirePermission('manage_integrations')
  async getProviders(
    @CurrentUser() user: UserContext,
  ): Promise<IntegrationProviderDto[]> {
    return this.apiKeyService.getProviders(user.activeOrganization.id);
  }

  @Post('providers/connect')
  @RequirePermission('manage_integrations')
  async connectProvider(
    @CurrentUser() user: UserContext,
    @Body() dto: ConnectIntegrationDto,
  ): Promise<IntegrationProviderDto> {
    return this.apiKeyService.connectProvider(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Post('providers/:key/disconnect')
  @RequirePermission('manage_integrations')
  async disconnectProvider(
    @CurrentUser() user: UserContext,
    @Param('key') key: IntegrationProviderKey,
  ): Promise<IntegrationProviderDto> {
    return this.apiKeyService.disconnectProvider(
      user.activeOrganization.id,
      user.id,
      key,
    );
  }
}
