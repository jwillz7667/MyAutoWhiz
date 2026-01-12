import type { Request, Response, NextFunction } from 'express';

import { ErrorCode } from '@myautowhiz/shared';

import { AppError, isAppError, normalizeError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const appError = isAppError(err) ? err : normalizeError(err);

  // Log error
  if (!appError.isOperational) {
    // Unexpected errors - log full details
    logger.error('Unexpected error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      requestId: res.locals.requestId,
    });
  } else {
    // Operational errors - log minimal details
    logger.warn('Operational error', {
      code: appError.code,
      message: appError.message,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });
  }

  // Don't expose internal error details in production
  const message =
    process.env.NODE_ENV === 'production' && !appError.isOperational
      ? 'An unexpected error occurred'
      : appError.message;

  sendError(res, appError.statusCode, appError.code, message, appError.details);
}

// Not found handler - must be registered after all routes
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, ErrorCode.NOT_FOUND, `Cannot ${req.method} ${req.path}`);
}

// Async wrapper to catch errors in async route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Wrapper for controller methods
export function catchAsync<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}
