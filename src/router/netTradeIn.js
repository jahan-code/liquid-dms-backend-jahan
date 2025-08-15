import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  createNetTradeIn,
  listNetTradeIns,
  getNetTradeInById,
  deleteNetTradeIn,
  updateNetTradeIn,
} from '../controllers/netTradeInController.js';

const router = express.Router();

router.post(
  '/add-net-trade-in',
  verifyToken,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 10 },
    { name: 'otherImages[]', maxCount: 10 },
    { name: 'billofsales', maxCount: 1 },
  ]),
  createNetTradeIn
);

router.put(
  '/edit-net-trade-in',
  verifyToken,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 10 },
    { name: 'otherImages[]', maxCount: 10 },
    { name: 'billofsales', maxCount: 1 },
  ]),
  updateNetTradeIn
);

router.get('/net-trade-ins', verifyToken, listNetTradeIns);
router.get('/', verifyToken, getNetTradeInById);
router.delete('/delete-net-trade-in', verifyToken, deleteNetTradeIn);

export default router;
