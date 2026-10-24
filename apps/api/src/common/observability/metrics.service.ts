import { Injectable } from '@nestjs/common';

export type MetricTag = Record<string, string | number>;

@Injectable()
export class MetricsService {
  private httpRequestsTotal: Map<string, number> = new Map();
  private httpDurationTotalMs: Map<string, number> = new Map();
  private gauges: Map<string, { value: number; help: string }> = new Map();

  recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const normalizedPath = this.normalizePath(path);
    const key = `method="${method}",path="${normalizedPath}",status="${statusCode}"`;

    const currentCount = this.httpRequestsTotal.get(key) ?? 0;
    this.httpRequestsTotal.set(key, currentCount + 1);

    const currentDuration = this.httpDurationTotalMs.get(key) ?? 0;
    this.httpDurationTotalMs.set(key, currentDuration + durationMs);
  }

  setGauge(name: string, value: number, help = ''): void {
    this.gauges.set(name, { value, help });
  }

  getGauge(name: string): number | undefined {
    return this.gauges.get(name)?.value;
  }

  toPrometheusFormat(): string {
    const lines: string[] = [];

    // HTTP Requests Total Counter
    lines.push('# HELP http_requests_total Total number of HTTP requests processed');
    lines.push('# TYPE http_requests_total counter');
    for (const [labels, count] of this.httpRequestsTotal.entries()) {
      lines.push(`http_requests_total{${labels}} ${count}`);
    }

    // HTTP Duration Total (in seconds)
    lines.push('# HELP http_request_duration_seconds_total Total duration of HTTP requests in seconds');
    lines.push('# TYPE http_request_duration_seconds_total counter');
    for (const [labels, durationMs] of this.httpDurationTotalMs.entries()) {
      lines.push(`http_request_duration_seconds_total{${labels}} ${(durationMs / 1000).toFixed(4)}`);
    }

    // Gauges
    for (const [name, data] of this.gauges.entries()) {
      if (data.help) {
        lines.push(`# HELP ${name} ${data.help}`);
      }
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${data.value}`);
    }

    // Process Metrics
    const memory = process.memoryUsage();
    lines.push('# HELP nodejs_heap_used_bytes Process heap memory used');
    lines.push('# TYPE nodejs_heap_used_bytes gauge');
    lines.push(`nodejs_heap_used_bytes ${memory.heapUsed}`);

    lines.push('# HELP nodejs_heap_total_bytes Process heap memory total');
    lines.push('# TYPE nodejs_heap_total_bytes gauge');
    lines.push(`nodejs_heap_total_bytes ${memory.heapTotal}`);

    return lines.join('\n') + '\n';
  }

  private normalizePath(path: string): string {
    return path
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/TSK-\d+/gi, '/:key')
      .replace(/\/TKT-\d+/gi, '/:ref');
  }
}
