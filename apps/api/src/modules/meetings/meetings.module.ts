import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller.js';
import { MeetingsService } from './meetings.service.js';
import { AuditService } from '../audit/audit.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { InMemoryTaskRepository } from '../tasks/task.repository.js';
import { OutboxService } from '../outbox/outbox.service.js';

@Module({
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    AuditService,
    TasksService,
    OutboxService,
    { provide: 'TASK_REPOSITORY', useClass: InMemoryTaskRepository },
  ],
  exports: [MeetingsService],
})
export class MeetingsModule {}
