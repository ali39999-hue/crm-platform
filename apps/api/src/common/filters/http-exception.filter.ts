import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiError } from '@crm/contracts';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const reqAny = request as any;
    const requestId = (reqAny.requestId as string) || (request.headers['x-request-id'] as string) || 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Array<{ field?: string; reason: string }> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as Record<string, any>;
        message = anyRes.message || message;
        code = anyRes.error || exception.name;
        if (Array.isArray(anyRes.message)) {
          details = anyRes.message.map((msg: string) => ({ reason: msg }));
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name || 'APPLICATION_ERROR';
    }

    const payload: ApiError = {
      statusCode,
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    };

    response.status(statusCode).json(payload);
  }
}
