import express from 'express';
import {
  addVendor,
  showAllVendors,
  getVendorById,
  editVendor,
  deleteVendor,
  getVendorsByCategory,
} from '../controllers/vendorController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add-vendor', verifyToken, addVendor);
router.get('/vendors', verifyToken, showAllVendors);
router.get('/vendors-by-category', verifyToken, getVendorsByCategory);
router.get('/', verifyToken, getVendorById);
router.put('/edit-vendor', verifyToken, editVendor);
router.delete('/delete-vendor', verifyToken, deleteVendor);
export default router;
