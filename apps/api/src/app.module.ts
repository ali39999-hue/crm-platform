import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { TasksController } from './modules/tasks/tasks.controller.js';
import { CrmController } from './modules/crm/crm.controller.js';
import { SupportController } from './modules/support/support.controller.js';
import { AuthService } from './common/auth/auth.service.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { PermissionsGuard } from './common/auth/permissions.guard.js';
import { AuditService } from './modules/audit/audit.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { InMemoryTaskRepository } from './modules/tasks/task.repository.js';
import { TasksService } from './modules/tasks/tasks.service.js';
import { InMemoryCrmRepository } from './modules/crm/crm.repository.js';
import { CrmService } from './modules/crm/crm.service.js';
import { InMemorySupportRepository } from './modules/support/support.repository.js';
import { SupportService } from './modules/support/support.service.js';

@Module({
  controllers: [
    HealthController,
    AuthController,
    TasksController,
    CrmController,
    SupportController,
  ],
  providers: [
    AuthService,
    AuthGuard,
    PermissionsGuard,
    AuditService,
    OutboxService,
    InMemoryTaskRepository,
    TasksService,
    InMemoryCrmRepository,
    CrmService,
    InMemorySupportRepository,
    SupportService,
  ],
  exports: [
    AuthService,
    AuditService,
    OutboxService,
    InMemoryTaskRepository,
    TasksService,
    InMemoryCrmRepository,
    CrmService,
    InMemorySupportRepository,
    SupportService,
  ],
})
export class AppModule {}
