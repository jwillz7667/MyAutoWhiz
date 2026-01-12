import type { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../utils/logger';

// Add request ID to all requests
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  res.locals.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

// Morgan stream that writes to Winston
const stream = {
  write: (message: string): void => {
    // Remove newline at the end
    logger.info(message.trim());
  },
};

// Morgan token for request ID
morgan.token('request-id', (req: Request, res: Response) => res.locals.requestId || '-');

// Morgan token for user ID
morgan.token('user-id', (req: Request) => req.user?.id || 'anonymous');

// Morgan format for development
const devFormat =
  ':method :url :status :response-time ms - :res[content-length] [:request-id] [:user-id]';

// Morgan format for production (JSON)
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  contentLength: ':res[content-length]',
  requestId: ':request-id',
  userId: ':user-id',
  userAgent: ':user-agent',
  ip: ':remote-addr',
});

// HTTP request logging middleware
export const httpLogger =
  process.env.NODE_ENV === 'production'
    ? morgan(prodFormat, { stream })
    : morgan(devFormat, { stream });

// Alias for backwards compatibility
export const requestLogger = httpLogger;

// Response time tracking
export function responseTime(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    res.locals.responseTime = duration;

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        userId: req.user?.id,
        requestId: res.locals.requestId,
      });
    }
  });

  next();
}

// Request body logging (for debugging, disable in production)
export function logRequestBody(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production' && req.body && Object.keys(req.body).length > 0) {
    // Mask sensitive fields
    const maskedBody = maskSensitiveFields(req.body);
    logger.debug('Request body', {
      path: req.path,
      body: maskedBody,
      requestId: res.locals.requestId,
    });
  }
  next();
}

// Mask sensitive fields in logs
function maskSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'token', 'refreshToken', 'apiKey', 'secret', 'creditCard'];
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveFields(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
