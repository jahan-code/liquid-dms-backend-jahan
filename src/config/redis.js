import { createClient } from 'redis';

let redisClient;

export const connectRedis = async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
  });

  await redisClient.connect();
  console.log('✅ Connected to Redis');
};

export const getRedisClient = () => redisClient;
