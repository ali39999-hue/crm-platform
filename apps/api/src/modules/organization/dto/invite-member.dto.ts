import type { MembershipRole } from '@crm/domain';

export class InviteMemberDto {
  email!: string;
  displayName!: string;
  role!: MembershipRole;
}

export class UpdateMemberRoleDto {
  role!: MembershipRole;
}
