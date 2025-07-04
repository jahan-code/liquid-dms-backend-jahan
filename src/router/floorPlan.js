import express from 'express';
import {
  addFloorPlan,
  editFloorPlan,
  getFloorPlanById,
} from '../controllers/floorPlanController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add-floor', verifyToken, addFloorPlan);
router.get('/', verifyToken, getFloorPlanById);
router.put('/edit-floor', editFloorPlan);
export default router;
