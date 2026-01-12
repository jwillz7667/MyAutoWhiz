import { Job, Worker } from 'bullmq';

import { QUEUE_NAMES } from '../queues';
import { createRedisConnection } from '../lib/redis';
import redis from '../lib/redis';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

// Cache key prefixes
const CACHE_KEYS = {
  POPULAR_MAKES: 'cache:popular_makes',
  POPULAR_MODELS: 'cache:popular_models',
  SUBSCRIPTION_STATS: 'cache:subscription_stats',
  SHOP_SEARCH: 'cache:shop_search',
};

// Cache TTLs in seconds
const CACHE_TTLS = {
  POPULAR_MAKES: 86400, // 24 hours
  POPULAR_MODELS: 86400, // 24 hours
  SUBSCRIPTION_STATS: 3600, // 1 hour
  SHOP_SEARCH: 7200, // 2 hours
};

interface CacheRefreshJobData {
  cacheType?: 'popular_makes' | 'popular_models' | 'subscription_stats' | 'all';
  forceRefresh?: boolean;
}

async function processRefreshCacheJob(job: Job<CacheRefreshJobData>): Promise<{ refreshed: string[] }> {
  const { data } = job;
  const refreshed: string[] = [];

  logger.info('Processing cache refresh job', { jobId: job.id, data });

  const refreshAll = data.cacheType === 'all' || !data.cacheType;

  // Refresh popular makes cache
  if (refreshAll || data.cacheType === 'popular_makes') {
    try {
      const popularMakes = await prisma.vehicle.groupBy({
        by: ['make'],
        _count: { make: true },
        orderBy: { _count: { make: 'desc' } },
        take: 50,
      });

      await redis.setex(
        CACHE_KEYS.POPULAR_MAKES,
        CACHE_TTLS.POPULAR_MAKES,
        JSON.stringify(popularMakes.map((m) => ({ make: m.make, count: m._count.make })))
      );

      refreshed.push('popular_makes');
      logger.debug('Refreshed popular makes cache', { count: popularMakes.length });
    } catch (error) {
      logger.error('Failed to refresh popular makes cache', { error });
    }
  }

  // Refresh popular models cache
  if (refreshAll || data.cacheType === 'popular_models') {
    try {
      const popularModels = await prisma.vehicle.groupBy({
        by: ['make', 'model'],
        _count: { model: true },
        orderBy: { _count: { model: 'desc' } },
        take: 100,
      });

      await redis.setex(
        CACHE_KEYS.POPULAR_MODELS,
        CACHE_TTLS.POPULAR_MODELS,
        JSON.stringify(popularModels.map((m) => ({ make: m.make, model: m.model, count: m._count.model })))
      );

      refreshed.push('popular_models');
      logger.debug('Refreshed popular models cache', { count: popularModels.length });
    } catch (error) {
      logger.error('Failed to refresh popular models cache', { error });
    }
  }

  // Refresh subscription stats cache
  if (refreshAll || data.cacheType === 'subscription_stats') {
    try {
      const subscriptionStats = await prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: { subscriptionTier: true },
      });

      const totalUsers = await prisma.user.count();
      const activeSubscriptions = await prisma.user.count({
        where: {
          subscriptionTier: { not: 'FREE' },
          subscriptionStatus: 'ACTIVE',
        },
      });

      const stats = {
        byTier: subscriptionStats.reduce((acc, s) => {
          acc[s.subscriptionTier] = s._count.subscriptionTier;
          return acc;
        }, {} as Record<string, number>),
        totalUsers,
        activeSubscriptions,
        freeUsers: totalUsers - activeSubscriptions,
        conversionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers * 100).toFixed(2) : '0',
        lastUpdated: new Date().toISOString(),
      };

      await redis.setex(
        CACHE_KEYS.SUBSCRIPTION_STATS,
        CACHE_TTLS.SUBSCRIPTION_STATS,
        JSON.stringify(stats)
      );

      refreshed.push('subscription_stats');
      logger.debug('Refreshed subscription stats cache', { stats });
    } catch (error) {
      logger.error('Failed to refresh subscription stats cache', { error });
    }
  }

  // Update job progress
  await job.updateProgress(100);

  logger.info('Cache refresh job completed', {
    jobId: job.id,
    refreshed,
  });

  return { refreshed };
}

export function createCacheRefreshWorker(): Worker<CacheRefreshJobData> {
  const worker = new Worker(QUEUE_NAMES.CACHE_REFRESH, processRefreshCacheJob, {
    connection: createRedisConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job, result) => {
    logger.info('Cache refresh job completed', { jobId: job.id, result });
  });

  worker.on('failed', (job, err) => {
    logger.error('Cache refresh job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
