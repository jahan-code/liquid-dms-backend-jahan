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
import helmet from 'helmet';
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false, // disables strict CSP in dev
    crossOriginEmbedderPolicy: false, // useful if using <iframe> or Canvas
  })
);

const startServer = async () => {
  try {
    await connectRedis(); // ✅ Redis connected

    // ✅ Middleware setup
    app.use(
      cors({
        origin: 'http://localhost:3000',
        credentials: true,
      })
    );
    app.use(cookieParser());
    app.use(getSessionMiddleware());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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
