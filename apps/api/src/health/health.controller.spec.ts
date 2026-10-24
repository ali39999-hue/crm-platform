import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';
import { MetricsService } from '../common/observability/metrics.service.js';

describe('HealthController', () => {
  it('returns a health envelope', () => {
    const metricsService = new MetricsService();
    const controller = new HealthController(metricsService);
    const result = controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('crm-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it('returns liveness probe status', () => {
    const metricsService = new MetricsService();
    const controller = new HealthController(metricsService);
    const result = controller.getLiveness();
    expect(result.status).toBe('alive');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('returns readiness probe status', () => {
    const metricsService = new MetricsService();
    const controller = new HealthController(metricsService);
    const result = controller.getReadiness();
    expect(result.status).toBe('ready');
    expect(result.database).toBe('connected');
  });

  it('serves prometheus metrics', () => {
    const metricsService = new MetricsService();
    metricsService.recordHttpRequest('GET', '/api/v1/health', 200, 10);
    const controller = new HealthController(metricsService);

    let sentData = '';
    const resMock: any = {
      setHeader: () => {},
      send: (data: string) => {
        sentData = data;
      },
    };

    controller.getMetrics(resMock);
    expect(sentData).toContain('http_requests_total');
  });
});
