export class CreateTeamDto {
  name!: string;
  description?: string;
  leadMemberId?: string;
  memberIds?: string[];
}

export class UpdateTeamDto {
  name?: string;
  description?: string;
  leadMemberId?: string;
  memberIds?: string[];
}

export class AddTeamMemberDto {
  memberId!: string;
}
