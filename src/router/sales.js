import express from 'express';
import {
  createSales,
  addSalesDetails,
  editSales,
  getSalesById,
  showAllSales,
  deleteSales,
  updateNetTradeInInfo,
} from '../controllers/salesController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Step-based Sales routes (following vehicle pattern)
router.post('/add-sales', verifyToken, createSales);
router.put('/sales-details', verifyToken, addSalesDetails);
// dealer-costs route removed
// removed manual update-status route; vehicle status updates are automatic
router.put('/net-trade-in-info', verifyToken, updateNetTradeInInfo);

// Management routes
router.get('/get-sales', verifyToken, getSalesById);
router.put('/edit-sales', verifyToken, editSales);
router.delete('/delete-sales', verifyToken, deleteSales);
router.get('/sales', verifyToken, showAllSales);
// removed sales-by-type and sales-statistics

export default router;
