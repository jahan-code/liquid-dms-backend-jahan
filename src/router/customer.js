import express from 'express';

import { addCustomer } from '../controllers/customerController.js';

const router = express.Router();

router.post('/add-customer', addCustomer);
// Assuming this is to get all floors
export default router;
