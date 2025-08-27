import { Router } from 'express';
import {
  createAccounting,
  getSalesByCustomerId,
  getAllAccountings,
  getAccountingById,
} from '../controllers/accountingController.js';

const router = Router();

// Directly store frontend payload
router.post('/add-accounting', createAccounting);
router.get('/by-customer', getSalesByCustomerId);
router.get('/accountings', getAllAccountings);
router.get('/accounting/accountingDetails', getAccountingById);

export default router;
