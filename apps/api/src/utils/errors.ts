import {
  ErrorCode,
  ErrorMessages,
  HttpStatusByErrorCode,
  type ErrorCodeType,
} from '@myautowhiz/shared';

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCodeType,
    message?: string,
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message || ErrorMessages[code]);
    this.code = code;
    this.statusCode = HttpStatusByErrorCode[code];
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// Convenience error creators
export const ValidationError = (message?: string, details?: Record<string, unknown>) =>
  new AppError(ErrorCode.VALIDATION_ERROR, message, details);

export const InvalidVinError = (vin?: string) =>
  new AppError(ErrorCode.INVALID_VIN, undefined, vin ? { vin } : undefined);

export const UnauthorizedError = (message?: string) =>
  new AppError(ErrorCode.UNAUTHORIZED, message);

export const InvalidCredentialsError = () => new AppError(ErrorCode.INVALID_CREDENTIALS);

export const TokenExpiredError = () => new AppError(ErrorCode.TOKEN_EXPIRED);

export const ForbiddenError = (message?: string) => new AppError(ErrorCode.FORBIDDEN, message);

export const TierLimitError = (requiredTier: string) =>
  new AppError(ErrorCode.TIER_LIMIT, `This feature requires ${requiredTier} subscription`, {
    requiredTier,
  });

export const EmailNotVerifiedError = () => new AppError(ErrorCode.EMAIL_NOT_VERIFIED);

export const NotFoundError = (resource: string) =>
  new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, { resource });

export const UserNotFoundError = () => new AppError(ErrorCode.USER_NOT_FOUND);

export const VehicleNotFoundError = () => new AppError(ErrorCode.VEHICLE_NOT_FOUND);

export const ChatSessionNotFoundError = () => new AppError(ErrorCode.CHAT_SESSION_NOT_FOUND);

export const EmailAlreadyExistsError = () => new AppError(ErrorCode.EMAIL_ALREADY_EXISTS);

export const VehicleLimitReachedError = (limit: number) =>
  new AppError(ErrorCode.VEHICLE_LIMIT_REACHED, undefined, { limit });

export const RateLimitedError = (retryAfter?: number) =>
  new AppError(ErrorCode.RATE_LIMITED, undefined, retryAfter ? { retryAfter } : undefined);

export const UsageLimitExceededError = (limitType: string, limit: number, used: number) =>
  new AppError(ErrorCode.USAGE_LIMIT_EXCEEDED, `You have exceeded your ${limitType} limit`, {
    limitType,
    limit,
    used,
  });

export const NhtsaApiError = (message?: string) =>
  new AppError(ErrorCode.NHTSA_API_ERROR, message, undefined, true);

export const OpenAiApiError = (message?: string) =>
  new AppError(ErrorCode.OPENAI_API_ERROR, message, undefined, true);

export const GooglePlacesError = (message?: string) =>
  new AppError(ErrorCode.GOOGLE_PLACES_ERROR, message, undefined, true);

export const StripeError = (message?: string) =>
  new AppError(ErrorCode.STRIPE_ERROR, message, undefined, true);

export const InternalError = (message?: string) =>
  new AppError(ErrorCode.INTERNAL_ERROR, message, undefined, false);

export const DatabaseError = (message?: string) =>
  new AppError(ErrorCode.DATABASE_ERROR, message, undefined, false);

// Type guard for AppError
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Convert unknown errors to AppError
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(ErrorCode.INTERNAL_ERROR, error.message, undefined, false);
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred', undefined, false);
}
