import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { getRedisClient } from '../config/redis.js';

export const getSessionMiddleware = () => {
  const redisClient = getRedisClient();

  // Add error listener for Redis client
  redisClient.on('error', (err) => {
    console.error('Redis session store error:', err);
  });

  return session({
    store: new RedisStore({
      client: redisClient,
      prefix: 'session:', // Explicit key prefix
      ttl: 86400, // 1 day in seconds (matches cookie maxAge)
    }),
    name: 'app.sid', // Custom cookie name
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Renew cookie on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined, // Set in production
    },
  });
};
