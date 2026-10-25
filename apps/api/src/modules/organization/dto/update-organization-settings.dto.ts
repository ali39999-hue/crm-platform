export class UpdateOrganizationSettingsDto {
  name?: string;
  timezone?: string;
  locale?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  retentionPolicy?: {
    auditLogsDays?: number;
    tempFilesDays?: number;
  };
}
