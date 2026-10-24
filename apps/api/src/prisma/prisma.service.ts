import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://crm_dev:local_dev_only_change_me@localhost:5432/crm_dev?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
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
