import type { MembershipRole } from '@crm/domain';

export type UserContext = {
  id: string;
  email: string;
  displayName: string;
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
    role: MembershipRole;
  };
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    role: MembershipRole;
    active: boolean;
  }>;
};
