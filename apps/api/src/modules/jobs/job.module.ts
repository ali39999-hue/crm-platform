import { Module } from '@nestjs/common';
import { JobController } from './job.controller.js';
import { InMemoryJobRepository } from './job.repository.js';
import { JobWorkerService } from './job-worker.service.js';
import { AuditService } from '../audit/audit.service.js';

@Module({
  controllers: [JobController],
  providers: [
    AuditService,
    {
      provide: 'JOB_REPOSITORY',
      useClass: InMemoryJobRepository,
    },
    InMemoryJobRepository,
    JobWorkerService,
  ],
  exports: ['JOB_REPOSITORY', InMemoryJobRepository, JobWorkerService],
})
export class JobModule {}
