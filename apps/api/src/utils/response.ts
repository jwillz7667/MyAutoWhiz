import type { Response } from 'express';

import type { ApiResponse, PaginatedResponse } from '@myautowhiz/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    requestId: res.locals.requestId,
  };

  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number
): void {
  const paginatedData: PaginatedResponse<T> = {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };

  sendSuccess(res, paginatedData);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: code as ApiResponse['error'] extends { code: infer C } ? C : never,
      message,
      details,
    },
    requestId: res.locals.requestId,
  };

  res.status(statusCode).json(response);
}

// Set rate limit headers
export function setRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetTime: Date
): void {
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
  res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000));
}

// Set pagination headers
export function setPaginationHeaders(
  res: Response,
  total: number,
  page: number,
  pageSize: number
): void {
  res.setHeader('X-Total-Count', total);
  res.setHeader('X-Page', page);
  res.setHeader('X-Page-Size', pageSize);
  res.setHeader('X-Total-Pages', Math.ceil(total / pageSize));
}
