import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import type { Response, Request } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const reqAny = req as any;

    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    reqAny.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped or primitive, handle gracefully
        if (data && typeof data === 'object' && !('data' in data) && !('statusCode' in data)) {
          return {
            data,
            meta: {
              requestId,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return data;
      }),
    );
  }
}
