import dotenv from 'dotenv';
dotenv.config();
import path from 'path'; // add this at the top if not already

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
    app.set('trust proxy', 1);

    app.use(
      cors({
        origin: 'https://liquid-dms-admin-panel.vercel.app',
        credentials: true,
      })
    );
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cookieParser());
    const sessionMiddleware = await getSessionMiddleware(); // ✅ wait for the middleware
    app.use(sessionMiddleware); // ✅ apply it to Express
    app.use((req, res, next) => {
      console.log('🍪 Incoming cookies:', req.headers.cookie);
      next();
    });
    app.use(
      '/uploads',
      express.static(path.join(process.cwd(), 'src', 'uploads'))
    );
    // ✅ Middleware setup

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
