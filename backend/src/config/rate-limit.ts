import { Redis } from "ioredis";
import { RedisStore } from "rate-limit-redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let redis: Redis | undefined;

export function createRateLimitStore() {
  if (!env.REDIS_URL) return undefined;
  redis ??= new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1
  });
  redis.on("error", (error: Error) => logger.error({ err: error }, "rate-limit redis error"));
  void redis.connect().catch((error: Error) => logger.error({ err: error }, "rate-limit redis connection failed"));
  const client = redis;
  return new RedisStore({
    prefix: "clinora:rate-limit:",
    sendCommand: (...args: string[]) =>
      (client.call as unknown as (...commandArgs: string[]) => Promise<number>)(...args)
  });
}
