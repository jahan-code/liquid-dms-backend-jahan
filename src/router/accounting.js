import { Router } from 'express';
import {
  createAccounting,
  getSalesByCustomerId,
  getAllAccountings,
  getAccountingByVehicleId,
} from '../controllers/accountingController.js';

const router = Router();

// Directly store frontend payload
router.post('/add-accounting', createAccounting);
router.get('/by-customer', getSalesByCustomerId);
router.get('/accountings', getAllAccountings);
router.get('/by-vehicle', getAccountingByVehicleId);

export default router;
