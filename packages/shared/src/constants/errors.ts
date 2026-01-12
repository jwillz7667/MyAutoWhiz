export const ErrorCode = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_VIN: 'INVALID_VIN',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_OBD_CODE: 'INVALID_OBD_CODE',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  TIER_LIMIT: 'TIER_LIMIT',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND',
  CHAT_SESSION_NOT_FOUND: 'CHAT_SESSION_NOT_FOUND',
  SHOP_NOT_FOUND: 'SHOP_NOT_FOUND',

  // Conflict errors (409)
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  VEHICLE_ALREADY_EXISTS: 'VEHICLE_ALREADY_EXISTS',
  VEHICLE_LIMIT_REACHED: 'VEHICLE_LIMIT_REACHED',

  // Rate limiting errors (429)
  RATE_LIMITED: 'RATE_LIMITED',
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
  VIN_LOOKUP_LIMIT: 'VIN_LOOKUP_LIMIT',
  CHAT_MESSAGE_LIMIT: 'CHAT_MESSAGE_LIMIT',
  IMAGE_ANALYSIS_LIMIT: 'IMAGE_ANALYSIS_LIMIT',

  // External service errors (502/503)
  NHTSA_API_ERROR: 'NHTSA_API_ERROR',
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  GOOGLE_PLACES_ERROR: 'GOOGLE_PLACES_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',

  // Internal errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessages: Record<ErrorCodeType, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Invalid request data',
  [ErrorCode.INVALID_VIN]: 'Invalid VIN format. VIN must be exactly 17 alphanumeric characters.',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email address format',
  [ErrorCode.WEAK_PASSWORD]:
    'Password must be at least 8 characters with 1 number and 1 special character',
  [ErrorCode.INVALID_OBD_CODE]: 'Invalid OBD-II diagnostic code format',

  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',

  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCode.TIER_LIMIT]: 'This feature requires a higher subscription tier',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address to continue',
  [ErrorCode.ACCOUNT_SUSPENDED]: 'Your account has been suspended',
  [ErrorCode.SUBSCRIPTION_REQUIRED]: 'An active subscription is required',

  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.VEHICLE_NOT_FOUND]: 'Vehicle not found',
  [ErrorCode.CHAT_SESSION_NOT_FOUND]: 'Chat session not found',
  [ErrorCode.SHOP_NOT_FOUND]: 'Repair shop not found',

  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',
  [ErrorCode.VEHICLE_ALREADY_EXISTS]: 'This vehicle has already been added to your garage',
  [ErrorCode.VEHICLE_LIMIT_REACHED]:
    'You have reached the maximum number of vehicles for your subscription tier',

  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ErrorCode.USAGE_LIMIT_EXCEEDED]: 'You have exceeded your usage limit for this period',
  [ErrorCode.VIN_LOOKUP_LIMIT]: 'You have reached your VIN lookup limit for this month',
  [ErrorCode.CHAT_MESSAGE_LIMIT]: 'You have reached your chat message limit for today',
  [ErrorCode.IMAGE_ANALYSIS_LIMIT]: 'You have reached your image analysis limit for this month',

  [ErrorCode.NHTSA_API_ERROR]: 'Unable to connect to NHTSA services. Please try again.',
  [ErrorCode.OPENAI_API_ERROR]: 'AI service temporarily unavailable. Please try again.',
  [ErrorCode.GOOGLE_PLACES_ERROR]: 'Unable to search for repair shops. Please try again.',
  [ErrorCode.STRIPE_ERROR]: 'Payment service error. Please try again.',
  [ErrorCode.EMAIL_SERVICE_ERROR]: 'Unable to send email. Please try again.',

  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.DATABASE_ERROR]: 'Database error. Please try again.',
  [ErrorCode.REDIS_ERROR]: 'Cache service error. Please try again.',
};

export const HttpStatusByErrorCode: Record<ErrorCodeType, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_VIN]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.WEAK_PASSWORD]: 400,
  [ErrorCode.INVALID_OBD_CODE]: 400,

  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 401,

  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TIER_LIMIT]: 403,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.ACCOUNT_SUSPENDED]: 403,
  [ErrorCode.SUBSCRIPTION_REQUIRED]: 403,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.VEHICLE_NOT_FOUND]: 404,
  [ErrorCode.CHAT_SESSION_NOT_FOUND]: 404,
  [ErrorCode.SHOP_NOT_FOUND]: 404,

  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.VEHICLE_ALREADY_EXISTS]: 409,
  [ErrorCode.VEHICLE_LIMIT_REACHED]: 409,

  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.USAGE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.VIN_LOOKUP_LIMIT]: 429,
  [ErrorCode.CHAT_MESSAGE_LIMIT]: 429,
  [ErrorCode.IMAGE_ANALYSIS_LIMIT]: 429,

  [ErrorCode.NHTSA_API_ERROR]: 502,
  [ErrorCode.OPENAI_API_ERROR]: 502,
  [ErrorCode.GOOGLE_PLACES_ERROR]: 502,
  [ErrorCode.STRIPE_ERROR]: 502,
  [ErrorCode.EMAIL_SERVICE_ERROR]: 502,

  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.REDIS_ERROR]: 500,
};
