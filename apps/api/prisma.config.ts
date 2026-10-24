import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://crm_dev:local_dev_only_change_me@localhost:5432/crm_dev?schema=public',
  },
});
