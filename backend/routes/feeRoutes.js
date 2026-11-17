import express from 'express';
import {
  getAllFees,
  getFeeById,
  createFee,
  recordPayment,
  getFeeStats
} from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats/overview', getFeeStats);

router.route('/')
  .get(getAllFees)
  .post(authorizeRoles('super_admin', 'principal'), createFee);

router.route('/:id')
  .get(getFeeById);

router.put('/:id/pay', authorizeRoles('super_admin', 'principal'), recordPayment);

export default router;
