import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { PrismaDocumentRepository } from './modules/documents/prisma-document.repository.js';
import { OrganizationController } from './modules/organization/organization.controller.js';
import { OrganizationService } from './modules/organization/organization.service.js';
import { CustomFieldController } from './modules/custom-fields/custom-field.controller.js';
import { CustomFieldService } from './modules/custom-fields/custom-field.service.js';
import { InMemoryCustomFieldRepository } from './modules/custom-fields/custom-field.repository.js';
import { PrismaCustomFieldRepository } from './modules/custom-fields/prisma-custom-field.repository.js';
import { ProjectController } from './modules/projects/project.controller.js';
import { ProjectService } from './modules/projects/project.service.js';
import { InMemoryProjectRepository } from './modules/projects/project.repository.js';
import { PrismaProjectRepository } from './modules/projects/prisma-project.repository.js';
import { TimeTrackingController } from './modules/timetracking/timetracking.controller.js';
import { TimeTrackingService } from './modules/timetracking/timetracking.service.js';
import { InMemoryTimeTrackingRepository } from './modules/timetracking/timetracking.repository.js';
import { PrismaTimeTrackingRepository } from './modules/timetracking/prisma-timetracking.repository.js';
import { MentionController } from './modules/mentions/mention.controller.js';
import { MentionService } from './modules/mentions/mention.service.js';
import { InMemoryMentionRepository } from './modules/mentions/mention.repository.js';
import { PrismaMentionRepository } from './modules/mentions/prisma-mention.repository.js';
import { ApiKeyController } from './modules/integrations/api-key.controller.js';
import { ApiKeyService } from './modules/integrations/api-key.service.js';
import { InMemoryApiKeyRepository } from './modules/integrations/api-key.repository.js';
import { PrismaApiKeyRepository } from './modules/integrations/prisma-api-key.repository.js';
import { AuthService } from './common/auth/auth.service.js';
import { TokenService } from './common/auth/token.service.js';
import { InMemoryIdentityStore } from './common/auth/identity-store.js';
import { PrismaIdentityStore } from './common/auth/prisma-identity.store.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { PermissionsGuard } from './common/auth/permissions.guard.js';
import { RateLimiterGuard } from './common/security/rate-limiter.guard.js';
import { SecurityHeadersMiddleware } from './common/security/security-headers.middleware.js';
import { TenantContextMiddleware } from './common/auth/tenant-context.middleware.js';
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
import { PrismaNotificationRepository } from './modules/notifications/prisma-notification.repository.js';
import { InMemoryNotificationDlqRepository } from './modules/notifications/notification-dlq.repository.js';
import { PrismaNotificationDlqRepository } from './modules/notifications/prisma-notification-dlq.repository.js';
import { NotificationService } from './modules/notifications/notification.service.js';
import { NotificationDispatcherService } from './modules/notifications/notification-dispatcher.service.js';
import { EmailAdapter } from './modules/notifications/adapters/email.adapter.js';
import { PushAdapter } from './modules/notifications/adapters/push.adapter.js';
import { SmsAdapter } from './modules/notifications/adapters/sms.adapter.js';
import { ReportingService } from './modules/reporting/reporting.service.js';
import { InMemoryAutomationRepository } from './modules/automation/automation.repository.js';
import { PrismaAutomationRepository } from './modules/automation/prisma-automation.repository.js';
import { AutomationService } from './modules/automation/automation.service.js';
import { InMemoryActivityRepository } from './modules/activity/activity.repository.js';
import { PrismaActivityRepository } from './modules/activity/prisma-activity.repository.js';
import { ActivityService } from './modules/activity/activity.service.js';
import { ImportExportService } from './modules/crm/csv/import-export.service.js';
import { SearchService } from './modules/search/search.service.js';
import { InMemoryWebhookRepository } from './modules/integrations/webhook.repository.js';
import { PrismaWebhookRepository } from './modules/integrations/prisma-webhook.repository.js';
import { WebhookService } from './modules/integrations/webhook.service.js';
import { MetricsService } from './common/observability/metrics.service.js';
import { MetricsInterceptor } from './common/observability/metrics.interceptor.js';
import { InMemoryBackupRepository } from './modules/operations/backup.repository.js';
import { PrismaBackupRepository } from './modules/operations/prisma-backup.repository.js';
import { BackupService } from './modules/operations/backup.service.js';
import { InMemoryJobRepository } from './modules/jobs/job.repository.js';
import { PrismaJobRepository } from './modules/jobs/prisma-job.repository.js';
import { JobWorkerService } from './modules/jobs/job-worker.service.js';
import { VoipController } from './modules/integrations/voip/voip.controller.js';
import { VoipService } from './modules/integrations/voip/voip.service.js';
import { InstallmentsController } from './modules/crm/installments/installments.controller.js';
import { InstallmentsService } from './modules/crm/installments/installments.service.js';
import { CardsPipelineController } from './modules/crm/cards/cards-pipeline.controller.js';
import { CardsPipelineService } from './modules/crm/cards/cards-pipeline.service.js';
import { WebFormController } from './modules/crm/forms/web-form.controller.js';
import { WebFormService } from './modules/crm/forms/web-form.service.js';
import { ExhibitionController } from './modules/crm/exhibition/exhibition.controller.js';
import { ExhibitionService } from './modules/crm/exhibition/exhibition.service.js';
import { LettersController } from './modules/letters/letters.controller.js';
import { LettersService } from './modules/letters/letters.service.js';
import { MeetingsController } from './modules/meetings/meetings.controller.js';
import { MeetingsService } from './modules/meetings/meetings.service.js';

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
    InstallmentsController,
    CardsPipelineController,
    WebFormController,
    ExhibitionController,
    LettersController,
    MeetingsController,
  ],
  providers: [
    // Global guard chain (GATE-002 structural fix): previously the guards were
    // only plain providers, so a controller forgetting class-level
    // @UseGuards(...) would ship completely unauthenticated. Registered order
    // is execution order: authenticate -> authorize -> rate limit.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RateLimiterGuard },
    {
      // Production keeps the strict defaults (60/min general, 10/min
      // sensitive). Local dev and E2E fire bursts from a single client.
      provide: 'RATE_LIMITER_CONFIG',
      useFactory: () => (process.env.NODE_ENV === 'production' ? {} : { generalLimit: 600 }),
    },
    VoipService,
    InstallmentsService,
    CardsPipelineService,
    WebFormService,
    ExhibitionService,
    LettersService,
    MeetingsService,
    {
      // P02 / CRM-AUTH: real identity lives in User/Membership tables when
      // USE_DATABASE=true; dev and unit tests keep the fixture store.
      provide: 'IDENTITY_STORE',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaIdentityStore : InMemoryIdentityStore,
    },
    InMemoryIdentityStore,
    PrismaIdentityStore,
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
      useClass:
        process.env.USE_DATABASE === 'true'
          ? PrismaNotificationRepository
          : InMemoryNotificationRepository,
    },
    InMemoryNotificationRepository,
    PrismaNotificationRepository,
    {
      provide: 'NOTIFICATION_DLQ_REPOSITORY',
      useClass:
        process.env.USE_DATABASE === 'true'
          ? PrismaNotificationDlqRepository
          : InMemoryNotificationDlqRepository,
    },
    InMemoryNotificationDlqRepository,
    PrismaNotificationDlqRepository,
    EmailAdapter,
    PushAdapter,
    SmsAdapter,
    NotificationDispatcherService,
    NotificationService,
    ReportingService,
    {
      provide: 'AUTOMATION_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaAutomationRepository : InMemoryAutomationRepository,
    },
    InMemoryAutomationRepository,
    PrismaAutomationRepository,
    AutomationService,
    {
      provide: 'ACTIVITY_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaActivityRepository : InMemoryActivityRepository,
    },
    InMemoryActivityRepository,
    PrismaActivityRepository,
    ActivityService,
    SearchService,
    {
      provide: 'WEBHOOK_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaWebhookRepository : InMemoryWebhookRepository,
    },
    InMemoryWebhookRepository,
    PrismaWebhookRepository,
    WebhookService,
    MetricsService,
    MetricsInterceptor,
    {
      provide: 'BACKUP_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaBackupRepository : InMemoryBackupRepository,
    },
    InMemoryBackupRepository,
    PrismaBackupRepository,
    BackupService,
    {
      provide: 'JOB_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaJobRepository : InMemoryJobRepository,
    },
    InMemoryJobRepository,
    PrismaJobRepository,
    JobWorkerService,
    {
      provide: 'DOCUMENT_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaDocumentRepository : InMemoryDocumentRepository,
    },
    InMemoryDocumentRepository,
    PrismaDocumentRepository,
    DocumentsService,
    OrganizationService,
    // These were previously registered only in `exports`, which does NOT
    // register a provider — AppModule could never actually bootstrap (latent
    // runtime crash, invisible to unit tests that never compile the module).
    {
      provide: 'CUSTOM_FIELD_REPOSITORY',
      useClass:
        process.env.USE_DATABASE === 'true'
          ? PrismaCustomFieldRepository
          : InMemoryCustomFieldRepository,
    },
    InMemoryCustomFieldRepository,
    PrismaCustomFieldRepository,
    CustomFieldService,
    InMemoryProjectRepository,
    PrismaProjectRepository,
    {
      provide: 'PROJECT_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaProjectRepository : InMemoryProjectRepository,
    },
    ProjectService,
    InMemoryTimeTrackingRepository,
    PrismaTimeTrackingRepository,
    {
      provide: 'TIME_TRACKING_REPOSITORY',
      useClass:
        process.env.USE_DATABASE === 'true'
          ? PrismaTimeTrackingRepository
          : InMemoryTimeTrackingRepository,
    },
    TimeTrackingService,
    {
      provide: 'MENTION_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaMentionRepository : InMemoryMentionRepository,
    },
    InMemoryMentionRepository,
    PrismaMentionRepository,
    MentionService,
    {
      provide: 'API_KEY_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaApiKeyRepository : InMemoryApiKeyRepository,
    },
    InMemoryApiKeyRepository,
    PrismaApiKeyRepository,
    ApiKeyService,
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
    PrismaNotificationDlqRepository,
    NotificationDispatcherService,
    NotificationService,
    PrismaNotificationRepository,
    ReportingService,
    'AUTOMATION_REPOSITORY',
    InMemoryAutomationRepository,
    PrismaAutomationRepository,
    AutomationService,
    'ACTIVITY_REPOSITORY',
    InMemoryActivityRepository,
    PrismaActivityRepository,
    ActivityService,
    SearchService,
    'WEBHOOK_REPOSITORY',
    InMemoryWebhookRepository,
    PrismaWebhookRepository,
    WebhookService,
    MetricsService,
    InMemoryBackupRepository,
    PrismaBackupRepository,
    'BACKUP_REPOSITORY',
    BackupService,
    'JOB_REPOSITORY',
    InMemoryJobRepository,
    PrismaJobRepository,
    JobWorkerService,
    'DOCUMENT_REPOSITORY',
    InMemoryDocumentRepository,
    PrismaDocumentRepository,
    DocumentsService,
    'CUSTOM_FIELD_REPOSITORY',
    InMemoryCustomFieldRepository,
    PrismaCustomFieldRepository,
    CustomFieldService,
    InMemoryProjectRepository,
    PrismaProjectRepository,
    {
      provide: 'PROJECT_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaProjectRepository : InMemoryProjectRepository,
    },
    ProjectService,
    InMemoryTimeTrackingRepository,
    PrismaTimeTrackingRepository,
    {
      provide: 'TIME_TRACKING_REPOSITORY',
      useClass:
        process.env.USE_DATABASE === 'true'
          ? PrismaTimeTrackingRepository
          : InMemoryTimeTrackingRepository,
    },
    TimeTrackingService,
    'MENTION_REPOSITORY',
    InMemoryMentionRepository,
    PrismaMentionRepository,
    MentionService,
    'API_KEY_REPOSITORY',
    InMemoryApiKeyRepository,
    PrismaApiKeyRepository,
    ApiKeyService,
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  onModuleInit() {
    assertProductionReadiness();
  }

  configure(consumer: MiddlewareConsumer) {
    // Tenant context must wrap the whole chain (guards + handler), so it is
    // applied before SecurityHeadersMiddleware.
    consumer.apply(TenantContextMiddleware, SecurityHeadersMiddleware).forRoutes('*');
  }
}

