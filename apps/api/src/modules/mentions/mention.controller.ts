import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { MentionService } from './mention.service.js';
import type { MentionDto } from '@crm/contracts';
import { CreateMentionDto } from './dto/create-mention.dto.js';

  // Self-service read-state writes stay at view_internal_tasks by design:
  // a dedicated self-service action does not exist in the matrix yet (P02
  // follow-up); the route only mutates the caller's own mention state.
@Controller('mentions')
@UseGuards(AuthGuard, PermissionsGuard)
export class MentionController {
  constructor(private readonly mentionService: MentionService) {}

  @Get()
  @RequirePermission('view_internal_tasks')
  async getMentions(@CurrentUser() user: UserContext): Promise<MentionDto[]> {
    return this.mentionService.getMentions(user.activeOrganization.id, user.id);
  }

  @Post()
  @RequirePermission('create_or_edit_tasks')
  async createMention(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateMentionDto,
  ): Promise<MentionDto> {
    return this.mentionService.createMention(
      user.activeOrganization.id,
      {
        id: user.id,
        name: user.displayName,
      },
      dto,
    );
  }

  @Patch(':id/read')
  @RequirePermission('view_internal_tasks')
  async markAsRead(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<MentionDto> {
    return this.mentionService.markAsRead(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }
}
