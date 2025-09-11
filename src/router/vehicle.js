
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
import upload, { convertImages } from '../middleware/upload.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/add-vehicle',
  verifyToken,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 10 },
    { name: 'otherImages[]', maxCount: 10 }, // <-- Add this line!
    { name: 'billofsales', maxCount: 1 },
  ]),
  convertImages,
  addVehicle
);
router.put(
  '/edit',
  verifyToken,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 10 },
    { name: 'otherImages[]', maxCount: 10 }, // <-- Add this line!
    { name: 'billofsales', maxCount: 1 },
  ]),
  convertImages,
  editVehicle
);
router.put('/Cost', verifyToken, addVehicleCost);
router.put('/Sales', verifyToken, addVehicleSales);
router.put(
  '/previous-owner',
  verifyToken,
  upload.fields([
    { name: 'transferDocument', maxCount: 5 },
    { name: 'transferDocument[]', maxCount: 5 }, // Support multiple files and both field names
  ]),
  convertImages,
  addVehiclePreviousOwner
);
router.put(
  '/notes',
  verifyToken,
  upload.fields([
    { name: 'uploadedNotes', maxCount: 5 },
    { name: 'uploadedNotes[]', maxCount: 5 }, // Support multiple files and both field names
  ]),
  convertImages,
  addVehicleNotes
);
router.patch('/complete', verifyToken, markVehicleAsCompleted);
router.get('/vehicles', verifyToken, getAllVehicles);
router.get('/', verifyToken, getVehicleById);
router.delete('/deletebyId', verifyToken, deleteVehicleById);

export default router;
