import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

export const DEFAULT_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly headers: Record<string, string>;

  constructor(customHeaders?: Record<string, string>) {
    this.headers = { ...DEFAULT_SECURITY_HEADERS, ...customHeaders };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    for (const [header, value] of Object.entries(this.headers)) {
      if (typeof res.setHeader === 'function') {
        res.setHeader(header, value);
      } else if (typeof (res as any).header === 'function') {
        (res as any).header(header, value);
      }
    }
    next();
  }
}
