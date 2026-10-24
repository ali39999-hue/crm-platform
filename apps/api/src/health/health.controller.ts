import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from '../common/observability/metrics.service.js';
import { Public } from '../common/auth/public.decorator.js';

@Controller('health')
export class HealthController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  getHealth(): { status: 'ok'; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'crm-api',
    };
  }

  @Get('live')
  @Public()
  getLiveness(): { status: 'alive'; uptime: number } {
    return {
      status: 'alive',
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  getReadiness(): { status: 'ready'; database: string; timestamp: string } {
    return {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(@Res() res: Response): void {
    const output = this.metricsService.toPrometheusFormat();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(output);
  }
}
