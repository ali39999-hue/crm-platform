import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns a health envelope', () => {
    const result = new HealthController().getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('crm-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
