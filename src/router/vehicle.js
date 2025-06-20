import express from 'express';
import { addVehicle } from '../controllers/vehicleController.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post(
  '/add-vehicle',
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 5 },
  ]),
  addVehicle
);

export default router;
