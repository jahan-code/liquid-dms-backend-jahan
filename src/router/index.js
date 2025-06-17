import auth from './auth.js';
import vendor from './vendor.js';
import { Router } from 'express';

const router = Router();
router.use('/auth', auth);
router.use('/vendor', vendor);

export default router;
