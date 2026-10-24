import { Injectable, UnauthorizedException } from '@nestjs/common';
import crypto, { randomUUID } from 'crypto';

export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  jti: string;
  sub: string;
  email: string;
  sessionId: string;
  orgId: string;
  role: string;
  type: TokenType;
  iat: number;
  exp: number;
}

export interface GenerateTokenOptions {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  sessionId?: string | undefined;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  sessionId: string;
}

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly accessTokenTtl: number; // in seconds (default: 900 = 15m)
  private readonly refreshTokenTtl: number; // in seconds (default: 604800 = 7d)

  // Blacklist store with TTL: key -> expiresAt (epoch seconds)
  private readonly revokedTokens: Map<string, number> = new Map();
  private readonly revokedSessions: Map<string, number> = new Map();

  // User revocation timestamp: userId -> revokedAt (epoch seconds)
  // Any token for this user issued at or before revokedAt is considered revoked
  private readonly userRevocations: Map<string, number> = new Map();

  constructor(
    secret?: string,
    accessTokenTtl = 900, // 15 minutes
    refreshTokenTtl = 604800, // 7 days
  ) {
    this.secret =
      secret ||
      process.env.JWT_SECRET ||
      'crm-platform-secure-jwt-hmac-sha256-secret-key-32-chars-minimum';
    this.accessTokenTtl = accessTokenTtl;
    this.refreshTokenTtl = refreshTokenTtl;
  }

  /**
   * Generates a signed token pair (access + refresh) for a user context.
   */
  generateTokenPair(options: GenerateTokenOptions): TokenPair {
    const sessionId = options.sessionId || randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const accessPayload: TokenPayload = {
      jti: randomUUID(),
      sub: options.userId,
      email: options.email,
      sessionId,
      orgId: options.orgId,
      role: options.role,
      type: 'access',
      iat: now,
      exp: now + this.accessTokenTtl,
    };

    const refreshPayload: TokenPayload = {
      jti: randomUUID(),
      sub: options.userId,
      email: options.email,
      sessionId,
      orgId: options.orgId,
      role: options.role,
      type: 'refresh',
      iat: now,
      exp: now + this.refreshTokenTtl,
    };

    const accessToken = this.signPayload(accessPayload);
    const refreshToken = this.signPayload(refreshPayload);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtl,
      tokenType: 'Bearer',
      sessionId,
    };
  }

  /**
   * Generates a single access token.
   */
  generateAccessToken(options: GenerateTokenOptions & { expiresIn?: number | undefined }): {
    token: string;
    jti: string;
    exp: number;
    sessionId: string;
  } {
    const sessionId = options.sessionId || randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const ttl = options.expiresIn ?? this.accessTokenTtl;
    const exp = now + ttl;

    const payload: TokenPayload = {
      jti: randomUUID(),
      sub: options.userId,
      email: options.email,
      sessionId,
      orgId: options.orgId,
      role: options.role,
      type: 'access',
      iat: now,
      exp,
    };

    return {
      token: this.signPayload(payload),
      jti: payload.jti,
      exp,
      sessionId,
    };
  }

  /**
   * Generates a single refresh token.
   */
  generateRefreshToken(options: GenerateTokenOptions & { expiresIn?: number | undefined }): {
    token: string;
    jti: string;
    exp: number;
    sessionId: string;
  } {
    const sessionId = options.sessionId || randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const ttl = options.expiresIn ?? this.refreshTokenTtl;
    const exp = now + ttl;

    const payload: TokenPayload = {
      jti: randomUUID(),
      sub: options.userId,
      email: options.email,
      sessionId,
      orgId: options.orgId,
      role: options.role,
      type: 'refresh',
      iat: now,
      exp,
    };

    return {
      token: this.signPayload(payload),
      jti: payload.jti,
      exp,
      sessionId,
    };
  }

  /**
   * Revoke a single token by its JTI (or full token string).
   */
  revokeToken(jtiOrToken: string, expiresAt?: number | undefined): void {
    this.cleanupExpired();
    let exp = expiresAt;
    let jti = jtiOrToken;

    if (jtiOrToken.includes('.')) {
      try {
        const payload = this.decodeToken(jtiOrToken);
        if (payload) {
          jti = payload.jti || jtiOrToken;
          if (!exp && payload.exp) {
            exp = payload.exp;
          }
        }
      } catch {
        // Fall back to original value
      }
    }

    const defaultExp = Math.floor(Date.now() / 1000) + this.refreshTokenTtl;
    const expiry = exp ?? defaultExp;
    this.revokedTokens.set(jti, expiry);
    if (jti !== jtiOrToken) {
      this.revokedTokens.set(jtiOrToken, expiry);
    }
  }

  /**
   * Revoke an entire session by session ID.
   */
  revokeSession(sessionId: string, expiresAt?: number | undefined): void {
    this.cleanupExpired();
    const defaultExp = Math.floor(Date.now() / 1000) + this.refreshTokenTtl;
    this.revokedSessions.set(sessionId, expiresAt ?? defaultExp);
  }

  /**
   * Revoke all tokens for a user (session invalidation on password change or admin action).
   */
  revokeAllForUser(userId: string): void {
    const now = Math.floor(Date.now() / 1000);
    this.userRevocations.set(userId, now);
  }

  /**
   * Check if a token, token payload, or JTI is revoked.
   */
  isRevoked(tokenOrPayloadOrJti: string | TokenPayload): boolean {
    if (!tokenOrPayloadOrJti) {
      return false;
    }

    if (typeof tokenOrPayloadOrJti === 'string') {
      if (this.revokedTokens.has(tokenOrPayloadOrJti)) {
        return true;
      }
      if (this.revokedSessions.has(tokenOrPayloadOrJti)) {
        return true;
      }
      if (tokenOrPayloadOrJti.includes('.')) {
        const payload = this.decodeToken(tokenOrPayloadOrJti);
        if (payload) {
          return this.isRevokedPayload(payload);
        }
      }
      return false;
    }

    return this.isRevokedPayload(tokenOrPayloadOrJti);
  }

  private isRevokedPayload(payload: TokenPayload): boolean {
    if (payload.jti && this.revokedTokens.has(payload.jti)) {
      return true;
    }
    if (payload.sessionId && this.revokedSessions.has(payload.sessionId)) {
      return true;
    }
    if (payload.sub && payload.iat) {
      const userRevokedAt = this.userRevocations.get(payload.sub);
      if (userRevokedAt !== undefined && payload.iat <= userRevokedAt) {
        return true;
      }
    }
    return false;
  }

  /**
   * Decodes a token without verifying signature.
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return null;
      }
      const json = Buffer.from(parts[1], 'base64url').toString('utf-8');
      return JSON.parse(json) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verifies token signature, expiration, and revocation status.
   */
  verifyToken(token: string, expectedType?: TokenType | undefined): TokenPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing token');
    }

    const parts = token.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new UnauthorizedException('Malformed token');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify HMAC-SHA256 signature with timingSafeEqual
    const expectedSig = crypto
      .createHmac('sha256', this.secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid token signature');
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Token has expired');
    }

    if (this.isRevokedPayload(payload)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if (expectedType && payload.type !== expectedType) {
      throw new UnauthorizedException(
        `Expected token type ${expectedType}, but got ${payload.type}`,
      );
    }

    return payload;
  }

  /**
   * Cleans up expired blacklist records to prevent memory leaks.
   */
  cleanupExpired(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, expiresAt] of this.revokedTokens.entries()) {
      if (expiresAt < now) {
        this.revokedTokens.delete(key);
      }
    }
    for (const [key, expiresAt] of this.revokedSessions.entries()) {
      if (expiresAt < now) {
        this.revokedSessions.delete(key);
      }
    }
  }

  /**
   * Helper to check if string looks like a JWT token (3 base64url segments).
   */
  isTokenFormat(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const parts = value.split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
  }

  private signPayload(payload: TokenPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }
}
