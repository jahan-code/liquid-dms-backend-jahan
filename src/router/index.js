import vehicle from './vehicle.js';
import auth from './auth.js';
import vendor from './vendor.js';
import floorPlan from './floorPlan.js';
import { Router } from 'express';
import customer from './customer.js';

const router = Router();
router.use('/auth', auth);
router.use('/vendor', vendor);
router.use('/vehicle', vehicle);
router.use('/floorPlan', floorPlan);
router.use('/customer', customer);
export default router;
