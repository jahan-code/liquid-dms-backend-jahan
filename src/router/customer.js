import express from 'express';

import {
  addCustomer,
  deleteCustomerById,
  editCustomerById,
  getAllCustomers,
  getCustomerById,
} from '../controllers/customerController.js';

const router = express.Router();

router.post('/add-customer', addCustomer);
router.get('/', getCustomerById);
router.put('/edit-customer', editCustomerById);
router.get('/customers', getAllCustomers);
router.delete('/delete-customer', deleteCustomerById);
export default router;
