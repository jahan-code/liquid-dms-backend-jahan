import express from 'express';
import {
  addVehicle,
  editVehicle,
  addVehicleCost,
  updateVehiclePricing,
} from '../controllers/vehicleController.js';
import upload from '../middleware/upload.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/add-vehicle',
  verifyToken,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 5 },
    { name: 'billofsales', maxCount: 1 },
  ]),
  addVehicle
);
router.put(
  '/edit',
  verifyToken,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 5 },
    { name: 'billofsales', maxCount: 1 },
  ]),
  editVehicle
);
router.put('/Cost', verifyToken, addVehicleCost);
router.put('/pricing', verifyToken, updateVehiclePricing);
export default router;
