import { describe, expect, it, beforeEach } from 'vitest';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RateLimiterGuard,
  RateLimit,
  SensitiveEndpoint,
  SkipRateLimit,
} from './rate-limiter.guard.js';
import { SecurityHeadersMiddleware } from './security-headers.middleware.js';

describe('Security & Rate Limiting (Task F4-04)', () => {
  let guard: RateLimiterGuard;
  let reflector: Reflector;
  let simulatedTime: number;

  const createMockContext = (options: {
    url?: string;
    ip?: string;
    userId?: string;
    handler?: any;
    targetClass?: any;
  }): {
    context: ExecutionContext;
    headers: Record<string, string>;
    req: any;
    res: any;
  } => {
    const headers: Record<string, string> = {};
    const req: any = {
      url: options.url ?? '/api/v1/tasks',
      path: options.url ?? '/api/v1/tasks',
      ip: options.ip ?? '192.168.1.10',
      headers: {
        'x-user-id': options.userId,
      },
      user: options.userId ? { id: options.userId } : undefined,
    };
    const res: any = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
      header: (key: string, value: string) => {
        headers[key] = value;
      },
    };

    const handler = options.handler ?? (() => {});
    const targetClass = options.targetClass ?? class DummyController {};

    const context = {
      getHandler: () => handler,
      getClass: () => targetClass,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;

    return { context, headers, req, res };
  };

  beforeEach(() => {
    simulatedTime = 1700000000000;
    reflector = new Reflector();
    guard = new RateLimiterGuard(reflector, {
      generalLimit: 5,
      generalWindowSec: 60,
      sensitiveLimit: 2,
      sensitiveWindowSec: 60,
      clock: () => simulatedTime,
    });
  });

  describe('RateLimiterGuard', () => {
    it('sets rate limit headers and permits request within general limits', () => {
      const { context, headers } = createMockContext({ url: '/api/v1/tasks' });

      const allowed = guard.canActivate(context);

      expect(allowed).toBe(true);
      expect(headers['X-RateLimit-Limit']).toBe('5');
      expect(headers['X-RateLimit-Remaining']).toBe('4');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('enforces limit and returns 429 with Retry-After when general limit is exceeded', () => {
      const { context, headers } = createMockContext({ url: '/api/v1/tasks' });

      // Consume 5 tokens
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }

      // 6th request should fail
      try {
        guard.canActivate(context);
        expect.unreachable('Should have thrown 429');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(headers['Retry-After']).toBeDefined();
        expect(headers['X-RateLimit-Remaining']).toBe('0');
        expect(headers['X-RateLimit-Limit']).toBe('5');
      }
    });

    it('automatically identifies sensitive endpoints by path (auth, export, search)', () => {
      // Sensitive endpoint with limit = 2
      const authCtx = createMockContext({ url: '/api/v1/auth/login', ip: '192.168.1.10' });
      expect(guard.canActivate(authCtx.context)).toBe(true);
      expect(authCtx.headers['X-RateLimit-Limit']).toBe('2');
      expect(authCtx.headers['X-RateLimit-Remaining']).toBe('1');

      expect(guard.canActivate(authCtx.context)).toBe(true);
      expect(authCtx.headers['X-RateLimit-Remaining']).toBe('0');

      // 3rd auth request exceeds sensitive limit of 2
      expect(() => guard.canActivate(authCtx.context)).toThrow(HttpException);

      // Search endpoint for another client is also recognized as sensitive (limit = 2)
      const searchCtx = createMockContext({ url: '/api/v1/search?q=test', ip: '192.168.1.20' });
      expect(guard.canActivate(searchCtx.context)).toBe(true);
      expect(searchCtx.headers['X-RateLimit-Limit']).toBe('2');

      // Export endpoint for another client is also recognized as sensitive (limit = 2)
      const exportCtx = createMockContext({ url: '/api/v1/crm/export/leads', ip: '192.168.1.30' });
      expect(guard.canActivate(exportCtx.context)).toBe(true);
      expect(exportCtx.headers['X-RateLimit-Limit']).toBe('2');
    });

    it('maintains separate token buckets for general and sensitive endpoints for the same client', () => {
      const clientIp = '10.0.0.1';
      const authCtx = createMockContext({ url: '/api/v1/auth/session', ip: clientIp });
      const generalCtx = createMockContext({ url: '/api/v1/tasks', ip: clientIp });

      // Exhaust sensitive quota (2 requests)
      expect(guard.canActivate(authCtx.context)).toBe(true);
      expect(guard.canActivate(authCtx.context)).toBe(true);
      expect(() => guard.canActivate(authCtx.context)).toThrow(HttpException);

      // General endpoint for the same client is still allowed!
      expect(guard.canActivate(generalCtx.context)).toBe(true);
      expect(generalCtx.headers['X-RateLimit-Remaining']).toBe('4');
    });

    it('refills tokens over time in token-bucket fashion', () => {
      const { context } = createMockContext({ url: '/api/v1/tasks' });

      // Exhaust 5 tokens
      for (let i = 0; i < 5; i++) {
        guard.canActivate(context);
      }
      expect(() => guard.canActivate(context)).toThrow(HttpException);

      // Advance time by 30 seconds (half of 60s window = 2.5 tokens refilled)
      simulatedTime += 30 * 1000;

      // Now 2 requests should be allowed
      expect(guard.canActivate(context)).toBe(true);
      expect(guard.canActivate(context)).toBe(true);

      // 3rd should be blocked until further refill
      expect(() => guard.canActivate(context)).toThrow(HttpException);
    });

    it('respects @SkipRateLimit decorator', () => {
      class HealthController {
        @SkipRateLimit()
        getHealth() {}
      }

      const instance = new HealthController();
      const { context } = createMockContext({
        url: '/api/v1/health',
        handler: instance.getHealth,
        targetClass: HealthController,
      });

      // Even with 100 calls, none is blocked
      for (let i = 0; i < 100; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }
    });

    it('respects @RateLimit custom decorator options on route', () => {
      class CustomController {
        @RateLimit({ limit: 1, windowSec: 10 })
        customAction() {}
      }

      const instance = new CustomController();
      const { context, headers } = createMockContext({
        url: '/api/v1/custom',
        handler: instance.customAction,
        targetClass: CustomController,
      });

      expect(guard.canActivate(context)).toBe(true);
      expect(headers['X-RateLimit-Limit']).toBe('1');
      expect(headers['X-RateLimit-Remaining']).toBe('0');

      // Next call is blocked
      expect(() => guard.canActivate(context)).toThrow(HttpException);
    });

    it('respects @SensitiveEndpoint decorator', () => {
      class SpecialController {
        @SensitiveEndpoint()
        doSpecialAction() {}
      }

      const instance = new SpecialController();
      const { context, headers } = createMockContext({
        url: '/api/v1/special', // path does not contain auth/export/search
        handler: instance.doSpecialAction,
        targetClass: SpecialController,
      });

      expect(guard.canActivate(context)).toBe(true);
      expect(headers['X-RateLimit-Limit']).toBe('2'); // uses sensitiveLimit
    });
  });

  describe('SecurityHeadersMiddleware', () => {
    it('sets all 5 required strict security headers', () => {
      const middleware = new SecurityHeadersMiddleware();
      const headers: Record<string, string> = {};
      const mockRes: any = {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
      };
      let nextCalled = false;

      middleware.use({} as any, mockRes, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(headers['Content-Security-Policy']).toBe(
        "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
      );
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['Strict-Transport-Security']).toBe(
        'max-age=31536000; includeSubDomains',
      );
      expect(headers['Referrer-Policy']).toBe(
        'strict-origin-when-cross-origin',
      );
    });

    it('allows custom security headers override', () => {
      const middleware = new SecurityHeadersMiddleware({
        'X-Frame-Options': 'SAMEORIGIN',
      });
      const headers: Record<string, string> = {};
      const mockRes: any = {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
      };

      middleware.use({} as any, mockRes, () => {});
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });
  });
});
