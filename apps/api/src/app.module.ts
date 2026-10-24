import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { TasksController } from './modules/tasks/tasks.controller.js';
import { CrmController } from './modules/crm/crm.controller.js';
import { SupportController } from './modules/support/support.controller.js';
import { NotificationController } from './modules/notifications/notification.controller.js';
import { ReportingController } from './modules/reporting/reporting.controller.js';
import { AutomationController } from './modules/automation/automation.controller.js';
import { ActivityController } from './modules/activity/activity.controller.js';
import { ImportExportController } from './modules/crm/csv/import-export.controller.js';
import { SearchController } from './modules/search/search.controller.js';
import { AuthService } from './common/auth/auth.service.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { PermissionsGuard } from './common/auth/permissions.guard.js';
import { AuditService } from './modules/audit/audit.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { InMemoryTaskRepository } from './modules/tasks/task.repository.js';
import { PrismaTaskRepository } from './modules/tasks/prisma-task.repository.js';
import { TasksService } from './modules/tasks/tasks.service.js';
import { InMemoryCrmRepository } from './modules/crm/crm.repository.js';
import { CrmService } from './modules/crm/crm.service.js';
import { InMemorySupportRepository } from './modules/support/support.repository.js';
import { SupportService } from './modules/support/support.service.js';
import { InMemoryNotificationRepository } from './modules/notifications/notification.repository.js';
import { NotificationService } from './modules/notifications/notification.service.js';
import { ReportingService } from './modules/reporting/reporting.service.js';
import { InMemoryAutomationRepository } from './modules/automation/automation.repository.js';
import { AutomationService } from './modules/automation/automation.service.js';
import { InMemoryActivityRepository } from './modules/activity/activity.repository.js';
import { ActivityService } from './modules/activity/activity.service.js';
import { ImportExportService } from './modules/crm/csv/import-export.service.js';
import { SearchService } from './modules/search/search.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    HealthController,
    AuthController,
    TasksController,
    CrmController,
    ImportExportController,
    SupportController,
    NotificationController,
    ReportingController,
    AutomationController,
    ActivityController,
    SearchController,
  ],
  providers: [
    AuthService,
    AuthGuard,
    PermissionsGuard,
    AuditService,
    OutboxService,
    {
      provide: 'TASK_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaTaskRepository : InMemoryTaskRepository,
    },
    InMemoryTaskRepository,
    PrismaTaskRepository,
    TasksService,
    InMemoryCrmRepository,
    CrmService,
    ImportExportService,
    InMemorySupportRepository,
    SupportService,
    {
      provide: 'NOTIFICATION_REPOSITORY',
      useClass: InMemoryNotificationRepository,
    },
    InMemoryNotificationRepository,
    NotificationService,
    ReportingService,
    InMemoryAutomationRepository,
    AutomationService,
    InMemoryActivityRepository,
    ActivityService,
    SearchService,
  ],
  exports: [
    AuthService,
    AuditService,
    OutboxService,
    'TASK_REPOSITORY',
    InMemoryTaskRepository,
    PrismaTaskRepository,
    TasksService,
    InMemoryCrmRepository,
    CrmService,
    ImportExportService,
    InMemorySupportRepository,
    SupportService,
    NotificationService,
    ReportingService,
    AutomationService,
    ActivityService,
    SearchService,
  ],
})
export class AppModule {}
