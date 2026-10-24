import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const start = Date.now();
    const method = req.method;
    const url = req.baseUrl || req.url || '/';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const status = res.statusCode || 200;
          this.metricsService.recordHttpRequest(method, url, status, duration);
        },
        error: (err: any) => {
          const duration = Date.now() - start;
          const status = err.status || 500;
          this.metricsService.recordHttpRequest(method, url, status, duration);
        },
      }),
    );
  }
}
