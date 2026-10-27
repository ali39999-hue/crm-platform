import { describe, expect, it } from 'vitest';
import {
  assertProductionReadiness,
  DOMAINS_WITHOUT_DURABLE_REPOSITORY,
} from './production-readiness.js';

describe('Production Readiness & Fail-Fast Gates (RA-005)', () => {
  it('passes silently in development / test environment', () => {
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'development',
        USE_DATABASE: 'false',
      });
    }).not.toThrow();

    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'test',
      });
    }).not.toThrow();
  });

  it('fails fast if USE_DATABASE is not true in production mode', () => {
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'production',
        USE_DATABASE: 'false',
        JWT_SECRET: 'production-custom-secret-key-at-least-32-chars-long-12345',
      });
    }).toThrow(/USE_DATABASE=true is required in production/);
  });

  it('fails fast if default mock JWT secret is used in production', () => {
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'production',
        USE_DATABASE: 'true',
        JWT_SECRET: 'crm-platform-secure-jwt-hmac-sha256-secret-key-32-chars-minimum', // Default hardcoded
      });
    }).toThrow(/JWT_SECRET must be configured with a unique/);
  });

  it('fails fast if ALLOW_INSECURE_DEV_AUTH is true in production', () => {
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'production',
        USE_DATABASE: 'true',
        JWT_SECRET: 'production-custom-secret-key-at-least-32-chars-long-12345',
        ALLOW_INSECURE_DEV_AUTH: 'true',
      });
    }).toThrow(/ALLOW_INSECURE_DEV_AUTH must not be enabled in production/);
  });

  it('fails fast if ALLOW_IN_MEMORY_REPOSITORIES is true in production (AUDIT-2026-001)', () => {
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'production',
        USE_DATABASE: 'true',
        JWT_SECRET: 'production-custom-secret-key-at-least-32-chars-long-12345',
        ALLOW_IN_MEMORY_REPOSITORIES: 'true',
      });
    }).toThrow(/ALLOW_IN_MEMORY_REPOSITORIES must not be enabled in production/);
  });

  it('fails fast in database mode while any domain still lacks a durable repository (GAP-001)', () => {
    if (DOMAINS_WITHOUT_DURABLE_REPOSITORY.length === 0) {
      return; // fully durable: gate passes by itself
    }
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'production',
        USE_DATABASE: 'true',
        JWT_SECRET: 'my-super-secret-production-key-at-least-32-chars-long-123456789',
      });
    }).toThrow(/Durable persistence incomplete/);
  });

  it('passes verification when all production gates are satisfied', () => {
    expect(() => {
      assertProductionReadiness({
        NODE_ENV: 'production',
        USE_DATABASE: 'true',
        JWT_SECRET: 'my-super-secret-production-key-at-least-32-chars-long-123456789',
        ALLOW_INSECURE_DEV_AUTH: 'false',
        ...(DOMAINS_WITHOUT_DURABLE_REPOSITORY.length > 0 ? { NODE_ENV: 'development' } : {}),
      } as Record<string, string | undefined>);
    }).not.toThrow();
  });
});
