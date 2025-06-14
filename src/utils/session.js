import session from "express-session";
import { RedisStore } from "connect-redis";
import { getRedisClient } from "../config/redis.js";

export const getSessionMiddleware = () => {
  const redisClient = getRedisClient();

  return session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 2 * 60 * 1000,
    },
  });
};
