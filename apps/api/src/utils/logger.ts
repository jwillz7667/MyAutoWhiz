import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }

  if (stack) {
    log += `\n${stack}`;
  }

  return log;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  defaultMeta: { service: 'myautowhiz-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

export { logger };
export default logger;

// Helper for request logging
export function logRequest(req: {
  method: string;
  path: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}) {
  logger.info('API Request', {
    method: req.method,
    path: req.path,
    userId: req.userId || 'anonymous',
    ip: req.ip,
    userAgent: req.userAgent,
  });
}

// Helper for error logging
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
}

// Helper for audit logging
export function logAudit(action: string, userId: string, details?: Record<string, unknown>) {
  logger.info('Audit', {
    action,
    userId,
    ...details,
  });
}
