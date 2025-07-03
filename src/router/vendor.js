import express from 'express';
import vendor from '../controllers/vendorController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add-vendor', verifyToken, vendor.addVendor);
router.get('/vendors', vendor.showAllVendors);
router.get('/vendorbyId', verifyToken, vendor.getVendorById);
router.put('/edit-vendor', verifyToken, vendor.editVendor);
router.delete('/delete-vendor', verifyToken, vendor.deleteVendor);
export default router;
