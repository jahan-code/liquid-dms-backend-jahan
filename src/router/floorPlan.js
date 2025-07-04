import express from 'express';
import {
  addFloorPlan,
  editFloorPlan,
  getFloorPlanById,
  showAllFloorPlans,
} from '../controllers/floorPlanController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add-floor', verifyToken, addFloorPlan);
router.get('/', verifyToken, getFloorPlanById);
router.put('/edit-floor', verifyToken, editFloorPlan);
router.get('/floors', verifyToken, showAllFloorPlans); // Assuming this is to get all floors
export default router;
