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
import { CustomFieldService } from './custom-field.service.js';
import type {
  CustomFieldDefinitionDto,
  CustomFieldEntityType,
  ValidateCustomFieldsResponse,
} from '@crm/contracts';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto.js';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto.js';

@Controller('custom-fields')
@UseGuards(AuthGuard, PermissionsGuard)
export class CustomFieldController {
  constructor(private readonly fieldService: CustomFieldService) {}

  @Get()
  @RequirePermission('view_crm')
  async getFields(
    @CurrentUser() user: UserContext,
    @Query('entityType') entityType?: CustomFieldEntityType,
  ): Promise<CustomFieldDefinitionDto[]> {
    return this.fieldService.getFields(user.activeOrganization.id, entityType);
  }

  @Post()
  @RequirePermission('organization_settings')
  async createField(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateCustomFieldDto,
  ): Promise<CustomFieldDefinitionDto> {
    return this.fieldService.createField(user.activeOrganization.id, user.id, dto);
  }

  @Patch(':id')
  @RequirePermission('organization_settings')
  async updateField(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldDto,
  ): Promise<CustomFieldDefinitionDto> {
    return this.fieldService.updateField(user.activeOrganization.id, user.id, id, dto);
  }

  @Post('validate')
  @RequirePermission('view_crm')
  async validateFields(
    @CurrentUser() user: UserContext,
    @Body('entityType') entityType: CustomFieldEntityType,
    @Body('values') values: Record<string, any>,
  ): Promise<ValidateCustomFieldsResponse> {
    return this.fieldService.validateValues(
      user.activeOrganization.id,
      entityType,
      values || {},
    );
  }

  @Delete(':id')
  @RequirePermission('organization_settings')
  async deleteField(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.fieldService.deleteField(user.activeOrganization.id, user.id, id);
  }
}
