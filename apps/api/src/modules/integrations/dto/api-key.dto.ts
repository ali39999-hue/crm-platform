export class CreateApiKeyDto {
  name!: string;
  scopes?: string[];
  expiresInDays?: number;
}
