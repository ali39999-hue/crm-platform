import { describe, expect, it, beforeEach } from 'vitest';
import { MetricsService } from './metrics.service.js';

describe('MetricsService (F9-02)', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
  });

  it('records HTTP request metrics and renders prometheus format', () => {
    metricsService.recordHttpRequest('GET', '/api/v1/tasks', 200, 150);
    metricsService.recordHttpRequest('GET', '/api/v1/tasks', 200, 50);
    metricsService.recordHttpRequest('POST', '/api/v1/tasks', 201, 100);

    const prometheus = metricsService.toPrometheusFormat();

    expect(prometheus).toContain('http_requests_total{method="GET",path="/api/v1/tasks",status="200"} 2');
    expect(prometheus).toContain('http_requests_total{method="POST",path="/api/v1/tasks",status="201"} 1');
    expect(prometheus).toContain('http_request_duration_seconds_total');
    expect(prometheus).toContain('nodejs_heap_used_bytes');
  });

  it('sets and gets gauge metrics', () => {
    metricsService.setGauge('crm_active_tasks_count', 42, 'Number of currently active tasks');
    expect(metricsService.getGauge('crm_active_tasks_count')).toBe(42);

    const prometheus = metricsService.toPrometheusFormat();
    expect(prometheus).toContain('crm_active_tasks_count 42');
    expect(prometheus).toContain('# HELP crm_active_tasks_count Number of currently active tasks');
  });

  it('normalizes UUIDs in request paths', () => {
    metricsService.recordHttpRequest(
      'GET',
      '/api/v1/tasks/10000000-0000-0000-0000-000000000001',
      200,
      12,
    );
    const prometheus = metricsService.toPrometheusFormat();
    expect(prometheus).toContain('path="/api/v1/tasks/:id"');
  });
});
