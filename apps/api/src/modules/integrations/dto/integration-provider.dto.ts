import type { IntegrationProviderKey } from '@crm/contracts';

export class ConnectIntegrationDto {
  providerKey!: IntegrationProviderKey;
  credentials!: Record<string, string>;
}
