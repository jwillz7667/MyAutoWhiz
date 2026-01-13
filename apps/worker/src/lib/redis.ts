import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse URL to check if TLS is needed (rediss://)
const isTLS = redisUrl.startsWith('rediss://');
const tlsOptions = isTLS ? { tls: { rejectUnauthorized: false } } : {};

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...tlsOptions,
});

export const createRedisConnection = () => new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...tlsOptions,
});

export default redis;
