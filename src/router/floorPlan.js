import express from 'express';
import { addFloorPlan } from '../controllers/floorPlanController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add-floor', verifyToken, addFloorPlan);

export default router;
