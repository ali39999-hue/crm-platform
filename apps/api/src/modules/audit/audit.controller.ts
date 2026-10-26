import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { AuditService, type AuditRecord } from './audit.service.js';

@Controller('audit')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission('view_audit')
  async getAuditEvents(
    @CurrentUser() user: UserContext,
    @Query('limit') limit?: string,
  ): Promise<AuditRecord[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditService.getEvents(user.activeOrganization.id, limitNum);
  }
}
