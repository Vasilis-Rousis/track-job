import { env } from './env';

// Parse the Redis URL into plain options for BullMQ (avoids ioredis version conflicts)
export function getRedisConnection() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    maxRetriesPerRequest: null as null,
  };
}
