import express from 'express';
import {
  getUserProfile,
  updateProfileAndPassword,
} from '../controllers/profileController.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Profile routes (all require authentication)
router.get('/profile', verifyToken, getUserProfile);
router.put(
  '/profile',
  verifyToken,
  upload.single('profileImage'),
  updateProfileAndPassword
); // Single endpoint for all updates including image

export default router;
