import winston from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [worker] ${level}: ${message} ${metaStr}`;
});

const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'myautowhiz-worker' },
  transports: [
    process.env.NODE_ENV === 'production'
      ? new winston.transports.Console({ format: json() })
      : new winston.transports.Console({ format: combine(colorize(), consoleFormat) }),
  ],
});

export default logger;
