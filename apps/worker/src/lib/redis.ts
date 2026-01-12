import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const createRedisConnection = () => new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export default redis;
