import express from 'express';
import {
  createSales,
  addSalesDetails,
  addDealerCosts,
  updateSalesStatus,
  editSales,
  getSalesById,
  showAllSales,
  deleteSales,
  getSalesByType,
  getSalesStatistics,
} from '../controllers/salesController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Step-based Sales routes (following vehicle pattern)
router.post('/add-sales', verifyToken, createSales);
router.put('/sales-details', verifyToken, addSalesDetails);
router.put('/dealer-costs', verifyToken, addDealerCosts);
router.put('/update-status', verifyToken, updateSalesStatus);

// Management routes
router.get('/get-sales', verifyToken, getSalesById);
router.put('/edit-sales', verifyToken, editSales);
router.delete('/delete-sales', verifyToken, deleteSales);
router.get('/sales', verifyToken, showAllSales);
router.get('/sales-by-type', verifyToken, getSalesByType);
router.get('/sales-statistics', verifyToken, getSalesStatistics);

export default router;
