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

    // ✅ Middleware setup
    const corsOptions = {
      origin: 'https://liquid-dms-admin-panel.vercel.app',
      credentials: true,
    };
    // 🚀 Force CORS headers for every response
    app.use((req, res, next) => {
      res.header(
        'Access-Control-Allow-Origin',
        'https://liquid-dms-admin-panel.vercel.app'
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );
      next();
    });

    // 🚨 MUST COME FIRST
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    app.use(cookieParser());
    app.use(getSessionMiddleware());
    app.use(
      '/uploads',
      express.static(path.join(process.cwd(), 'src', 'uploads'))
    );
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

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
