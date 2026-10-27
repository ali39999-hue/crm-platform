import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createTenantScoper } from './tenant-scoper.js';

function buildTenantClient(client: PrismaClient) {
  return client.$extends(createTenantScoper());
}

export type TenantScopedPrismaClient = ReturnType<typeof buildTenantClient>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;
  private tenantScoped?: TenantScopedPrismaClient;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://crm_dev:local_dev_only_change_me@localhost:5432/crm_dev?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  /**
   * PrismaClient with the strict tenant-scoper extension (SEC-001 / GAP-006).
   * The active organization comes from the per-request AsyncLocalStorage
   * store (TenantContextMiddleware + AuthGuard); repositories that touch
   * tenant-scoped models must use this client instead of the raw one.
   */
  get tenantClient(): TenantScopedPrismaClient {
    return (this.tenantScoped ??= buildTenantClient(this));
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma Client connected to database');
    } catch (err: any) {
      this.logger.warn(`Database connection deferred: ${err.message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('Prisma Client disconnected from database');
    } catch (err: any) {
      this.logger.warn(`Error disconnecting: ${err.message}`);
    }
  }
}
