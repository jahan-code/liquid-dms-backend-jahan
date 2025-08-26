import { Router } from 'express';
import {
  createAccounting,
  getSalesByCustomerId,
} from '../controllers/accountingController.js';

const router = Router();

// Directly store frontend payload
router.post('/add-accounting', createAccounting);
router.get('/by-customer', getSalesByCustomerId);

export default router;
