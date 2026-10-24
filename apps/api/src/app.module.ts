import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { TasksController } from './modules/tasks/tasks.controller.js';
import { AuthService } from './common/auth/auth.service.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { PermissionsGuard } from './common/auth/permissions.guard.js';
import { AuditService } from './modules/audit/audit.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { InMemoryTaskRepository } from './modules/tasks/task.repository.js';
import { TasksService } from './modules/tasks/tasks.service.js';

@Module({
  controllers: [HealthController, AuthController, TasksController],
  providers: [
    AuthService,
    AuthGuard,
    PermissionsGuard,
    AuditService,
    OutboxService,
    InMemoryTaskRepository,
    TasksService,
  ],
  exports: [
    AuthService,
    AuditService,
    OutboxService,
    InMemoryTaskRepository,
    TasksService,
  ],
})
export class AppModule {}
