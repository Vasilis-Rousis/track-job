import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis(env.REDIS_URL);
const PREFIX = 'bl:'; // blacklist prefix

/** Add a token's jti to the blacklist until it naturally expires. */
export async function blacklistToken(jti: string, expiresAt: number): Promise<void> {
  const ttl = expiresAt - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.set(`${PREFIX}${jti}`, '1', 'EX', ttl);
  }
}

/** Check if a token's jti has been blacklisted. */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await redis.get(`${PREFIX}${jti}`);
  return result !== null;
}
