import { Prisma } from '../generated/prisma/client.js';

export const TENANT_SCOPED_MODELS = [
  'Task',
  'TaskComment',
  'Account',
  'Contact',
  'Lead',
  'Deal',
  'Ticket',
  'TicketMessage',
  'Project',
  'Team',
  'Activity',
  'AuditEvent',
  'Notification',
];

/**
 * Prisma Client Extension ($extends) for Strict Multi-Tenant Scoping (SEC-001)
 * Automatically restricts read, write, count, and mutation operations on tenant models
 * to the active organization ID, preventing data leakage and IDOR.
 */
export function createTenantScoper(activeOrganizationId?: string, isPlatformAdmin: boolean = false) {
  return Prisma.defineExtension({
    name: 'tenant-isolation-extension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model?: string; operation: string; args: any; query: (args: any) => Promise<any> }) {
          if (!model || !TENANT_SCOPED_MODELS.includes(model) || isPlatformAdmin) {
            return query(args);
          }

          if (!activeOrganizationId) {
            throw new Error(`SECURITY_ERROR: Access denied. Missing tenant organization context for model ${model}`);
          }

          const modifiedArgs = (args ?? {}) as Record<string, any>;

          if (['findFirst', 'findMany', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
            modifiedArgs.where = {
              ...(modifiedArgs.where || {}),
              organizationId: activeOrganizationId,
            };
            return query(modifiedArgs);
          }

          if (['create'].includes(operation)) {
            const data = (modifiedArgs.data || {});
            if (data.organizationId && data.organizationId !== activeOrganizationId) {
              throw new Error(
                `SECURITY_ERROR: Cross-tenant write blocked. Organization ${activeOrganizationId} cannot create resource for ${data.organizationId}`,
              );
            }
            if (!data.organizationId) {
              data.organizationId = activeOrganizationId;
            }
            modifiedArgs.data = data;
            return query(modifiedArgs);
          }

          if (['upsert'].includes(operation)) {
            const createData = (modifiedArgs.create || {});
            if (createData.organizationId && createData.organizationId !== activeOrganizationId) {
              throw new Error(
                `SECURITY_ERROR: Cross-tenant write blocked. Organization ${activeOrganizationId} cannot create resource for ${createData.organizationId}`,
              );
            }
            if (!createData.organizationId) {
              createData.organizationId = activeOrganizationId;
            }
            modifiedArgs.create = createData;
            return query(modifiedArgs);
          }

          if (['findUnique', 'findUniqueOrThrow'].includes(operation)) {
            const result = await query(args);
            if (result && 'organizationId' in result && result.organizationId && result.organizationId !== activeOrganizationId) {
              if (operation === 'findUniqueOrThrow') {
                throw new Error(`SECURITY_ERROR: Cross-tenant access denied for model ${model}`);
              }
              return null;
            }
            return result;
          }

          return query(args);
        },
      },
    },
  });
}
