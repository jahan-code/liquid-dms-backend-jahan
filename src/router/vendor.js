import express from 'express';
import vendor from '../controllers/vendorController.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import vendorController from '../controllers/vendorController.js';

const router = express.Router();

router.post('/add-vendor', verifyToken, vendor.addVendor);
router.get('/vendors', verifyToken, vendorController.showAllVendors);
export default router;
