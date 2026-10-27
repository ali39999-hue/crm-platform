import { Module } from '@nestjs/common';
import { JobController } from './job.controller.js';
import { InMemoryJobRepository } from './job.repository.js';
import { PrismaJobRepository } from './prisma-job.repository.js';
import { JobWorkerService } from './job-worker.service.js';
import { AuditService } from '../audit/audit.service.js';

@Module({
  controllers: [JobController],
  providers: [
    AuditService,
    {
      provide: 'JOB_REPOSITORY',
      useClass: process.env.USE_DATABASE === 'true' ? PrismaJobRepository : InMemoryJobRepository,
    },
    InMemoryJobRepository,
    PrismaJobRepository,
    JobWorkerService,
  ],
  exports: ['JOB_REPOSITORY', InMemoryJobRepository, PrismaJobRepository, JobWorkerService],
})
export class JobModule {}
