import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { assertProductionReadiness } from './common/security/production-readiness.js';
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
import { SavedViewController } from './modules/crm/saved-views/saved-view.controller.js';
import { SearchController } from './modules/search/search.controller.js';
import { WebhookController } from './modules/integrations/webhook.controller.js';
import { FilesController } from './modules/files/files.controller.js';
import { BackupController } from './modules/operations/backup.controller.js';
import { JobController } from './modules/jobs/job.controller.js';
import { DocumentsController } from './modules/documents/document.controller.js';
import { DocumentsService } from './modules/documents/document.service.js';
import { InMemoryDocumentRepository } from './modules/documents/document.repository.js';
import { OrganizationController } from './modules/organization/organization.controller.js';
import { OrganizationService } from './modules/organization/organization.service.js';
import { CustomFieldController } from './modules/custom-fields/custom-field.controller.js';
import { CustomFieldService } from './modules/custom-fields/custom-field.service.js';
import { InMemoryCustomFieldRepository } from './modules/custom-fields/custom-field.repository.js';
import { ProjectController } from './modules/projects/project.controller.js';
import { ProjectService } from './modules/projects/project.service.js';
import { InMemoryProjectRepository } from './modules/projects/project.repository.js';
import { TimeTrackingController } from './modules/timetracking/timetracking.controller.js';
import { TimeTrackingService } from './modules/timetracking/timetracking.service.js';
import { InMemoryTimeTrackingRepository } from './modules/timetracking/timetracking.repository.js';
import { MentionController } from './modules/mentions/mention.controller.js';
import { MentionService } from './modules/mentions/mention.service.js';
import { InMemoryMentionRepository } from './modules/mentions/mention.repository.js';
import { ApiKeyController } from './modules/integrations/api-key.controller.js';
import { ApiKeyService } from './modules/integrations/api-key.service.js';
import { InMemoryApiKeyRepository } from './modules/integrations/api-key.repository.js';
import { AuthService } from './common/auth/auth.service.js';
import { TokenService } from './common/auth/token.service.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { PermissionsGuard } from './common/auth/permissions.guard.js';
import { RateLimiterGuard } from './common/security/rate-limiter.guard.js';
import { SecurityHeadersMiddleware } from './common/security/security-headers.middleware.js';
import { FilesService } from './modules/files/files.service.js';
import { AuditService } from './modules/audit/audit.service.js';
import { AuditController } from './modules/audit/audit.controller.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { InMemoryTaskRepository } from './modules/tasks/task.repository.js';
import { PrismaTaskRepository } from './modules/tasks/prisma-task.repository.js';
import { TasksService } from './modules/tasks/tasks.service.js';
import { InMemoryCrmRepository } from './modules/crm/crm.repository.js';
import { PrismaCrmRepository } from './modules/crm/prisma-crm.repository.js';
import { PipelineStageRepository } from './modules/crm/pipeline/pipeline-stage.repository.js';
import { PipelineStageService } from './modules/crm/pipeline/pipeline-stage.service.js';
import { SavedViewRepository } from './modules/crm/saved-views/saved-view.repository.js';
import { SavedViewService } from './modules/crm/saved-views/saved-view.service.js';
import { CrmService } from './modules/crm/crm.service.js';
import { InMemorySupportRepository } from './modules/support/support.repository.js';
import { PrismaSupportRepository } from './modules/support/prisma-support.repository.js';
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
import { InMemoryBackupRepository } from './modules/operations/backup.repository.js';
import { BackupService } from './modules/operations/backup.service.js';
import { InMemoryJobRepository } from './modules/jobs/job.repository.js';
import { JobWorkerService } from './modules/jobs/job-worker.service.js';
import { VoipController } from './modules/integrations/voip/voip.controller.js';
import { VoipService } from './modules/integrations/voip/voip.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    HealthController,
    AuthController,
    TasksController,
    CrmController,
    PipelineStageController,
    SavedViewController,
    ImportExportController,
    SupportController,
    NotificationController,
    ReportingController,
    AutomationController,
    ActivityController,
    SearchController,
    WebhookController,
    FilesController,
    BackupController,
    JobController,
    DocumentsController,
    OrganizationController,
    CustomFieldController,
    ProjectController,
    TimeTrackingController,
    MentionController,
    ApiKeyController,
    AuditController,
    VoipController,
  ],
  providers: [
    VoipService,
    AuthService,
    TokenService,
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
    {
      provide: 'CRM_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaCrmRepository : InMemoryCrmRepository,
    },
    InMemoryCrmRepository,
    PrismaCrmRepository,
    PipelineStageRepository,
    PipelineStageService,
    SavedViewRepository,
    SavedViewService,
    CrmService,
    ImportExportService,
    {
      provide: 'SUPPORT_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaSupportRepository : InMemorySupportRepository,
    },
    InMemorySupportRepository,
    PrismaSupportRepository,
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
    InMemoryBackupRepository,
    BackupService,
    {
      provide: 'JOB_REPOSITORY',
      useClass: InMemoryJobRepository,
    },
    InMemoryJobRepository,
    JobWorkerService,
    InMemoryDocumentRepository,
    DocumentsService,
    OrganizationService,
  ],
  exports: [
    AuthService,
    TokenService,
    AuditService,
    OutboxService,
    RateLimiterGuard,
    FilesService,
    'TASK_REPOSITORY',
    InMemoryTaskRepository,
    PrismaTaskRepository,
    TasksService,
    'CRM_REPOSITORY',
    InMemoryCrmRepository,
    PrismaCrmRepository,
    PipelineStageRepository,
    PipelineStageService,
    SavedViewRepository,
    SavedViewService,
    CrmService,
    ImportExportService,
    'SUPPORT_REPOSITORY',
    InMemorySupportRepository,
    PrismaSupportRepository,
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
    InMemoryBackupRepository,
    BackupService,
    'JOB_REPOSITORY',
    InMemoryJobRepository,
    JobWorkerService,
    InMemoryDocumentRepository,
    DocumentsService,
    InMemoryCustomFieldRepository,
    CustomFieldService,
    InMemoryProjectRepository,
    ProjectService,
    InMemoryTimeTrackingRepository,
    TimeTrackingService,
    InMemoryMentionRepository,
    MentionService,
    InMemoryApiKeyRepository,
    ApiKeyService,
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  onModuleInit() {
    assertProductionReadiness();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}

