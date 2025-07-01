import express from 'express';
import {
  addVehicle,
  editVehicle,
  addVehicleCost,
  addVehicleSales,
  addVehiclePreviousOwner,
  addVehicleNotes,
  markVehicleAsCompleted,
  getAllVehicles,
  getVehicleById,
  deleteVehicleById,
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
router.put('/Sales', verifyToken, addVehicleSales);
router.put(
  '/previous-owner',
  verifyToken,
  upload.fields([{ name: 'transferDocument', maxCount: 1 }]),
  addVehiclePreviousOwner
);
router.put(
  '/notes',
  verifyToken,
  upload.fields([{ name: 'uploadedNotes', maxCount: 1 }]),
  addVehicleNotes
);
router.patch('/complete', verifyToken, markVehicleAsCompleted);
router.get('/vehicles', verifyToken, getAllVehicles);
router.get('/vehiclebyId', verifyToken, getVehicleById);
router.delete('/deletebyId', verifyToken, deleteVehicleById);

export default router;
