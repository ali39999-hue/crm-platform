import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type {
  CurrentUserDto,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
  SwitchWorkspaceRequest,
  LogoutRequest,
} from '@crm/contracts';

export class LoginRequestDto implements LoginRequest {
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password!: string;

  /** Required only when the account has MFA enabled (P02). */
  @IsOptional()
  @IsString({ message: 'MFA code must be a string' })
  mfaCode?: string;
}

export class EnableMfaDto {
  @IsString({ message: 'MFA code must be a string' })
  @IsNotEmpty({ message: 'MFA code is required' })
  code!: string;
}

export class RefreshTokenRequestDto implements RefreshTokenRequest {
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token cannot be empty' })
  refreshToken!: string;
}

export class SwitchWorkspaceRequestDto implements SwitchWorkspaceRequest {
  @IsString({ message: 'Organization ID must be a string' })
  @IsNotEmpty({ message: 'Organization ID cannot be empty' })
  organizationId!: string;
}

export class LogoutRequestDto implements LogoutRequest {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class AuthResponseDto implements AuthResponse {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  tokenType?: string;
  user!: CurrentUserDto;
}

export class RegisterRequestDto {
  @IsString({ message: 'Organization name must be a string' })
  @IsNotEmpty({ message: 'Organization name is required' })
  @MaxLength(80, { message: 'Organization name must be at most 80 characters' })
  organizationName!: string;

  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  password!: string;

  @IsString({ message: 'Display name must be a string' })
  @IsNotEmpty({ message: 'Display name is required' })
  @MaxLength(80, { message: 'Display name must be at most 80 characters' })
  displayName!: string;
}

export class AcceptInvitationDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  displayName?: string;
}
