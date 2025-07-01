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
    const allowedOrigins = [
      'http://localhost:3000',
      'https://liquid-dms-admin-panel.vercel.app',
    ];

    app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      })
    );

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
