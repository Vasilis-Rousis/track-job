import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { env } from '../config/env';

const redisClient = new Redis(env.REDIS_URL);

const sendCommand = (...args: string[]) =>
  redisClient.call(args[0], ...args.slice(1)) as any;

/** Strict limiter for auth endpoints (login/register) */
export const authLimiter = rateLimit({
  store: new RedisStore({ sendCommand, prefix: 'rl:auth:' }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

/** Global limiter for all API routes */
export const globalLimiter = rateLimit({
  store: new RedisStore({ sendCommand, prefix: 'rl:global:' }),
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
