import 'dotenv/config';
import http from 'http';

import { createApp } from './app';
import { prisma, checkDatabaseConnection } from './lib/prisma';
import { redis, checkRedisConnection } from './lib/redis';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer(): Promise<void> {
  try {
    logger.info('Starting MyAutoWhiz API server...');

    // Check database connection (non-blocking - server starts anyway)
    logger.info('Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      logger.info('Database connected successfully');
    } else {
      logger.warn('Database connection failed - server will start but may not be fully ready');
    }

    // Check Redis connection (non-blocking - server starts anyway)
    logger.info('Checking Redis connection...');
    const redisConnected = await checkRedisConnection();
    if (redisConnected) {
      logger.info('Redis connected successfully');
    } else {
      logger.warn('Redis connection failed - server will start but may not be fully ready');
    }

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          await prisma.$disconnect();
          logger.info('Database connection closed');

          // Close Redis connection
          await redis.quit();
          logger.info('Redis connection closed');

          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Graceful shutdown timeout. Forcing exit.');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled promise rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });

    // Start server
    server.listen(PORT, HOST, () => {
      logger.info(`MyAutoWhiz API server listening on ${HOST}:${PORT}`, {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
