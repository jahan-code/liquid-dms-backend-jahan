import dotenv from 'dotenv';
dotenv.config();
import path from 'path'; // add this at the top if not already
import fs from 'fs';

import express from 'express';
import cors from 'cors';

import { connectRedis } from './config/redis.js';

import ApiErrorMiddleware from './middleware/ApiError.middleware.js';
import requestValidator from './middleware/requestValidator.middleware.js';
import router from './router/index.js';

const app = express();

const startServer = async () => {
  try {
    await connectRedis(); // ✅ Redis connected
    app.set('trust proxy', 1);

    app.use(
      cors({
        origin: [
          'https://liquid-dms-admin-panel.vercel.app',
          'http://localhost:3000',
          'https://liquid-dms-frontend.vercel.app',
        ],
        credentials: true,
      })
    );
    // Cookie parser removed; cookies no longer used
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    // Session middleware removed as sessions are not used
    // Cookie logging removed
    // Ensure uploads dir and default profile image exist
    const uploadsDir = path.join(process.cwd(), 'src', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Copy default profile image from assets if it exists
    const assetsDir = path.join(process.cwd(), 'src', 'assets');
    const sourceProfilePath = path.join(assetsDir, 'default-profile.png');
    const targetProfilePath = path.join(uploadsDir, 'default-profile.png');

    if (fs.existsSync(sourceProfilePath)) {
      fs.copyFileSync(sourceProfilePath, targetProfilePath);
      console.log('🖼️  Copied default profile image from assets to uploads');
    } else if (!fs.existsSync(targetProfilePath)) {
      // Fallback: create a simple default if no asset exists
      const base64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YfQ2xYAAAAASUVORK5CYII=';
      fs.writeFileSync(targetProfilePath, Buffer.from(base64, 'base64'));
      console.log('🖼️  Created fallback default profile image');
    }
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
