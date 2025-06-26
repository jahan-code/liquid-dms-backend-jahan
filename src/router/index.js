import vehicle from './vehicle.js';
import auth from './auth.js';
import vendor from './vendor.js';
import floorPlan from './floorPlan.js';
import { Router } from 'express';

const router = Router();
router.use('/auth', auth);
router.use('/vendor', vendor);
router.use('/vehicle', vehicle);
router.use('/floor-plan', floorPlan);
export default router;
