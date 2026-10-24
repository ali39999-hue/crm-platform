import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { PipelineStageController } from './modules/crm/pipeline/pipeline-stage.controller.js';
import { SearchController } from './modules/search/search.controller.js';
import { WebhookController } from './modules/integrations/webhook.controller.js';
import { FilesController } from './modules/files/files.controller.js';
import { AuthService } from './common/auth/auth.service.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { PermissionsGuard } from './common/auth/permissions.guard.js';
import { RateLimiterGuard } from './common/security/rate-limiter.guard.js';
import { SecurityHeadersMiddleware } from './common/security/security-headers.middleware.js';
import { FilesService } from './modules/files/files.service.js';
import { AuditService } from './modules/audit/audit.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { InMemoryTaskRepository } from './modules/tasks/task.repository.js';
import { PrismaTaskRepository } from './modules/tasks/prisma-task.repository.js';
import { TasksService } from './modules/tasks/tasks.service.js';
import { InMemoryCrmRepository } from './modules/crm/crm.repository.js';
import { PipelineStageRepository } from './modules/crm/pipeline/pipeline-stage.repository.js';
import { PipelineStageService } from './modules/crm/pipeline/pipeline-stage.service.js';
import { CrmService } from './modules/crm/crm.service.js';
import { InMemorySupportRepository } from './modules/support/support.repository.js';
import { SupportService } from './modules/support/support.service.js';
import { InMemoryNotificationRepository } from './modules/notifications/notification.repository.js';
import { InMemoryNotificationDlqRepository } from './modules/notifications/notification-dlq.repository.js';
import { NotificationService } from './modules/notifications/notification.service.js';
import { NotificationDispatcherService } from './modules/notifications/notification-dispatcher.service.js';
import { EmailAdapter } from './modules/notifications/adapters/email.adapter.js';
import { PushAdapter } from './modules/notifications/adapters/push.adapter.js';
import { SmsAdapter } from './modules/notifications/adapters/sms.adapter.js';
import { ReportingService } from './modules/reporting/reporting.service.js';
import { InMemoryAutomationRepository } from './modules/automation/automation.repository.js';
import { AutomationService } from './modules/automation/automation.service.js';
import { InMemoryActivityRepository } from './modules/activity/activity.repository.js';
import { ActivityService } from './modules/activity/activity.service.js';
import { ImportExportService } from './modules/crm/csv/import-export.service.js';
import { SearchService } from './modules/search/search.service.js';
import { InMemoryWebhookRepository } from './modules/integrations/webhook.repository.js';
import { WebhookService } from './modules/integrations/webhook.service.js';
import { MetricsService } from './common/observability/metrics.service.js';
import { MetricsInterceptor } from './common/observability/metrics.interceptor.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    HealthController,
    AuthController,
    TasksController,
    CrmController,
    PipelineStageController,
    ImportExportController,
    SupportController,
    NotificationController,
    ReportingController,
    AutomationController,
    ActivityController,
    SearchController,
    WebhookController,
    FilesController,
  ],
  providers: [
    AuthService,
    AuthGuard,
    PermissionsGuard,
    RateLimiterGuard,
    AuditService,
    OutboxService,
    FilesService,
    {
      provide: 'TASK_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaTaskRepository : InMemoryTaskRepository,
    },
    InMemoryTaskRepository,
    PrismaTaskRepository,
    TasksService,
    InMemoryCrmRepository,
    PipelineStageRepository,
    PipelineStageService,
    CrmService,
    ImportExportService,
    InMemorySupportRepository,
    SupportService,
    {
      provide: 'NOTIFICATION_REPOSITORY',
      useClass: InMemoryNotificationRepository,
    },
    InMemoryNotificationRepository,
    {
      provide: 'NOTIFICATION_DLQ_REPOSITORY',
      useClass: InMemoryNotificationDlqRepository,
    },
    InMemoryNotificationDlqRepository,
    EmailAdapter,
    PushAdapter,
    SmsAdapter,
    NotificationDispatcherService,
    NotificationService,
    ReportingService,
    InMemoryAutomationRepository,
    AutomationService,
    InMemoryActivityRepository,
    ActivityService,
    SearchService,
    InMemoryWebhookRepository,
    WebhookService,
    MetricsService,
    MetricsInterceptor,
  ],
  exports: [
    AuthService,
    AuditService,
    OutboxService,
    RateLimiterGuard,
    FilesService,
    'TASK_REPOSITORY',
    InMemoryTaskRepository,
    PrismaTaskRepository,
    TasksService,
    InMemoryCrmRepository,
    PipelineStageRepository,
    PipelineStageService,
    CrmService,
    ImportExportService,
    InMemorySupportRepository,
    SupportService,
    EmailAdapter,
    PushAdapter,
    SmsAdapter,
    InMemoryNotificationDlqRepository,
    NotificationDispatcherService,
    NotificationService,
    ReportingService,
    AutomationService,
    ActivityService,
    SearchService,
    WebhookService,
    MetricsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}

