import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logging';
import { globalRateLimiter } from './middleware/rateLimit';
import logger from './utils/logger';

export function createApp(): Express {
  const app = express();

  // Trust proxy for production deployments behind load balancers
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 86400, // 24 hours
  }));

  // Compression
  app.use(compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
  }));

  // Cookie parser
  app.use(cookieParser());

  // Request logging
  app.use(requestLogger);

  // Global rate limiting (before body parsing to prevent DoS)
  app.use(globalRateLimiter);

  // Body parsing - Note: Stripe webhook needs raw body, handled in subscription routes
  app.use(express.json({
    limit: '10mb',
    verify: (req: Request, res: Response, buf: Buffer) => {
      // Store raw body for Stripe webhook verification
      if (req.originalUrl === '/api/v1/subscriptions/webhook') {
        (req as any).rawBody = buf;
      }
    },
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routes
  app.use('/api/v1', routes);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'MyAutoWhiz API',
      version: process.env.npm_package_version || '1.0.0',
      documentation: '/api/v1/docs',
      health: '/api/v1/health',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
