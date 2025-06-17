import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { connectRedis } from './config/redis.js';
import { getSessionMiddleware } from './utils/session.js';

import ApiErrorMiddleware from './middleware/ApiError.middleware.js';
import requestValidator from './middleware/requestValidator.middleware.js';
import router from './router/index.js';
import cookieParser from 'cookie-parser';
const app = express();

const startServer = async () => {
  try {
    await connectRedis(); // ✅ Redis connected

    // ✅ Middleware setup
    app.use(
      cors({
        origin: 'http://localhost:3000',
        credentials: true, // if you're using cookies or sessions
      })
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(getSessionMiddleware());

    app.use(requestValidator);

    app.get('/health', (req, res) => {
      res.json({
        message: 'OK',
      });
    });
    app.use('/', router);
    app.use(ApiErrorMiddleware);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
export default app;
