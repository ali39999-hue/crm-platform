import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

export const RATE_LIMIT_KEY = 'RATE_LIMIT_OPTIONS';
export const SKIP_RATE_LIMIT_KEY = 'SKIP_RATE_LIMIT';
export const SENSITIVE_ENDPOINT_KEY = 'SENSITIVE_ENDPOINT';

export interface RateLimitOptions {
  limit?: number;
  windowSec?: number;
  isSensitive?: boolean;
}

export interface RateLimiterConfig {
  generalLimit?: number;
  generalWindowSec?: number;
  sensitiveLimit?: number;
  sensitiveWindowSec?: number;
  clock?: () => number;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

export const SensitiveEndpoint = () =>
  SetMetadata(SENSITIVE_ENDPOINT_KEY, true);

export const SkipRateLimit = () =>
  SetMetadata(SKIP_RATE_LIMIT_KEY, true);

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRatePerMs: number;
  windowSec: number;
}

const DEFAULT_GENERAL_LIMIT = 60;
const DEFAULT_GENERAL_WINDOW_SEC = 60;
const DEFAULT_SENSITIVE_LIMIT = 10;
const DEFAULT_SENSITIVE_WINDOW_SEC = 60;

const SENSITIVE_PATH_PATTERN = /(?:^|\/)(?:auth|export|search)(?:\/|$|\?)/i;

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly buckets = new Map<string, TokenBucket>();
  private clock: () => number;
  private generalLimit: number;
  private generalWindowSec: number;
  private sensitiveLimit: number;
  private sensitiveWindowSec: number;

  constructor(
    @Optional() private readonly reflector?: Reflector,
    @Optional() @Inject('RATE_LIMITER_CONFIG') config?: RateLimiterConfig,
  ) {
    this.generalLimit = config?.generalLimit ?? DEFAULT_GENERAL_LIMIT;
    this.generalWindowSec = config?.generalWindowSec ?? DEFAULT_GENERAL_WINDOW_SEC;
    this.sensitiveLimit = config?.sensitiveLimit ?? DEFAULT_SENSITIVE_LIMIT;
    this.sensitiveWindowSec = config?.sensitiveWindowSec ?? DEFAULT_SENSITIVE_WINDOW_SEC;
    this.clock = config?.clock ?? (() => Date.now());
  }

  setClock(clock: () => number): void {
    this.clock = clock;
  }

  setLimits(params: {
    generalLimit?: number;
    generalWindowSec?: number;
    sensitiveLimit?: number;
    sensitiveWindowSec?: number;
  }): void {
    if (params.generalLimit !== undefined) this.generalLimit = params.generalLimit;
    if (params.generalWindowSec !== undefined) this.generalWindowSec = params.generalWindowSec;
    if (params.sensitiveLimit !== undefined) this.sensitiveLimit = params.sensitiveLimit;
    if (params.sensitiveWindowSec !== undefined) this.sensitiveWindowSec = params.sensitiveWindowSec;
  }

  reset(): void {
    this.buckets.clear();
  }

  getBucket(key: string): TokenBucket | undefined {
    return this.buckets.get(key);
  }

  isSensitive(
    req: Request,
    context?: ExecutionContext,
  ): boolean {
    if (context && this.reflector) {
      const isExplicitSensitive = this.reflector.getAllAndOverride<boolean>(
        SENSITIVE_ENDPOINT_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isExplicitSensitive !== undefined) {
        return Boolean(isExplicitSensitive);
      }

      const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
        RATE_LIMIT_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (rateLimitOptions?.isSensitive !== undefined) {
        return Boolean(rateLimitOptions.isSensitive);
      }
    }

    const url = req.originalUrl || req.url || '';
    const path = req.path || url;
    return SENSITIVE_PATH_PATTERN.test(path);
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector) {
      const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (skip) {
        return true;
      }
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const rateLimitOptions = this.reflector
      ? this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
          context.getHandler(),
          context.getClass(),
        ])
      : undefined;

    const sensitive = this.isSensitive(req, context);
    const capacity = rateLimitOptions?.limit ?? (sensitive ? this.sensitiveLimit : this.generalLimit);
    const windowSec = rateLimitOptions?.windowSec ?? (sensitive ? this.sensitiveWindowSec : this.generalWindowSec);

    const clientKey = this.resolveClientKey(req, sensitive);
    const now = this.clock();

    let bucket = this.buckets.get(clientKey);
    const refillRatePerMs = capacity / (windowSec * 1000);

    if (!bucket || bucket.capacity !== capacity || bucket.windowSec !== windowSec) {
      bucket = {
        capacity,
        tokens: capacity,
        lastRefill: now,
        refillRatePerMs,
        windowSec,
      };
      this.buckets.set(clientKey, bucket);
    } else {
      const elapsed = Math.max(0, now - bucket.lastRefill);
      const refilled = elapsed * bucket.refillRatePerMs;
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refilled);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      const remaining = Math.max(0, Math.floor(bucket.tokens));
      const tokensNeededToFull = bucket.capacity - bucket.tokens;
      const msToFull = tokensNeededToFull / bucket.refillRatePerMs;
      const resetTimestamp = Math.ceil((now + msToFull) / 1000);

      this.setHeaderSafe(res, 'X-RateLimit-Limit', String(capacity));
      this.setHeaderSafe(res, 'X-RateLimit-Remaining', String(remaining));
      this.setHeaderSafe(res, 'X-RateLimit-Reset', String(resetTimestamp));

      return true;
    }

    // Rate limit exceeded
    const tokensNeeded = 1 - bucket.tokens;
    const retryAfterMs = tokensNeeded / bucket.refillRatePerMs;
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    const resetTimestamp = Math.ceil((now + (bucket.capacity - bucket.tokens) / bucket.refillRatePerMs) / 1000);

    this.setHeaderSafe(res, 'Retry-After', String(retryAfterSec));
    this.setHeaderSafe(res, 'X-RateLimit-Limit', String(capacity));
    this.setHeaderSafe(res, 'X-RateLimit-Remaining', '0');
    this.setHeaderSafe(res, 'X-RateLimit-Reset', String(resetTimestamp));

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: retryAfterSec,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private resolveClientKey(req: Request, isSensitive: boolean): string {
    const rawIp =
      req.ip ||
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const user = (req as any).user;
    const userId = user?.id || (req.headers?.['x-user-id'] as string);
    const clientIdentifier = userId ? `user:${userId}` : `ip:${rawIp}`;
    const scope = isSensitive ? 'sensitive' : 'general';

    return `${clientIdentifier}:${scope}`;
  }

  private setHeaderSafe(res: Response | undefined, header: string, value: string): void {
    if (!res) return;
    if (typeof res.setHeader === 'function') {
      res.setHeader(header, value);
    } else if (typeof (res as any).header === 'function') {
      (res as any).header(header, value);
    }
  }
}
