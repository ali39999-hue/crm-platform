import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { ReportingService } from './reporting.service.js';
import type { DashboardKpiReport, CrmFunnelReport, SupportSlaReport, WorkloadReportItem } from '@crm/contracts';

@Controller('reporting')
@UseGuards(AuthGuard, PermissionsGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('dashboard')
  @RequirePermission('view_internal_tasks')
  async getDashboard(@CurrentUser() user: UserContext): Promise<DashboardKpiReport> {
    return this.reportingService.getDashboardKpi(user.activeOrganization.id);
  }

  @Get('workload')
  @RequirePermission('view_internal_tasks')
  async getWorkload(@CurrentUser() user: UserContext): Promise<WorkloadReportItem[]> {
    return this.reportingService.getWorkloadReport(user.activeOrganization.id);
  }

  @Get('funnel')
  @RequirePermission('view_crm')
  async getFunnel(@CurrentUser() user: UserContext): Promise<CrmFunnelReport> {
    return this.reportingService.getCrmFunnel(user.activeOrganization.id);
  }

  @Get('support-sla')
  @RequirePermission('view_audit')
  async getSupportSla(@CurrentUser() user: UserContext): Promise<SupportSlaReport> {
    return this.reportingService.getSupportSlaReport(user.activeOrganization.id);
  }
}
