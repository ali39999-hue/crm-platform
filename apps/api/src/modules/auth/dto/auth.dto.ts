import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
