import express from 'express';

import {
  addCustomer,
  deleteCustomerById,
  editCustomerById,
  getAllCustomers,
  getAllCustomersWithoutPagination,
  getCustomerById,
} from '../controllers/customerController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add-customer', verifyToken, addCustomer);
router.get('/', verifyToken, getCustomerById);
router.put('/edit-customer', verifyToken, editCustomerById);
router.get('/customers', verifyToken, getAllCustomers);
router.get('/customers/all', verifyToken, getAllCustomersWithoutPagination);
router.delete('/delete-customer', verifyToken, deleteCustomerById);
export default router;
