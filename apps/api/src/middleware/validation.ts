import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';

import { ValidationError } from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidationOptions {
  stripUnknown?: boolean;
}

// Generic validation middleware factory
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw ValidationError('Validation failed', { errors });
      }

      // Replace with validated and transformed data
      req[target] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Validate request body
export function validateBody(schema: ZodSchema, options?: ValidationOptions) {
  return validate(schema, 'body', options);
}

// Validate query parameters
export function validateQuery(schema: ZodSchema, options?: ValidationOptions) {
  return validate(schema, 'query', options);
}

// Validate route parameters
export function validateParams(schema: ZodSchema, options?: ValidationOptions) {
  return validate(schema, 'params', options);
}

// Format Zod errors into a readable structure
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

// Combine multiple schemas for different parts of the request
export function validateRequest(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  const middlewares: ((req: Request, res: Response, next: NextFunction) => void)[] = [];

  if (schemas.params) {
    middlewares.push(validateParams(schemas.params));
  }
  if (schemas.query) {
    middlewares.push(validateQuery(schemas.query));
  }
  if (schemas.body) {
    middlewares.push(validateBody(schemas.body));
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;

    const runNext: NextFunction = (err?: unknown): void => {
      if (err) {
        next(err);
        return;
      }

      if (index >= middlewares.length) {
        next();
        return;
      }

      const middleware = middlewares[index++];
      middleware(req, res, runNext);
    };

    runNext();
  };
}
