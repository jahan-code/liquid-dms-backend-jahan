import express from 'express';
import {
  addSales,
  editSales,
  getSalesById,
  showAllSales,
  deleteSales,
} from '../controllers/salesController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Sales routes
router.post('/add-sales', verifyToken, addSales);
router.get('/get-sales', verifyToken, getSalesById);
router.put('/edit-sales', verifyToken, editSales);
router.delete('/delete-sales', verifyToken, deleteSales);
router.get('/sales', verifyToken, showAllSales);

export default router;
