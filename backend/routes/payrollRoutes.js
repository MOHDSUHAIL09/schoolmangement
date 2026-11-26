import express from 'express';
import {
  getAllPayrolls,
  createOrUpdatePayroll,
  markPayrollAsPaid,
  getPayrollStats
} from '../controllers/payrollController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
// Strictly restricted to super_admin, admin and principal
router.use(authorizeRoles('super_admin', 'admin', 'principal'));

router.get('/stats/overview', getPayrollStats);

router.route('/')
  .get(getAllPayrolls)
  .post(createOrUpdatePayroll);

router.put('/:id/pay', markPayrollAsPaid);

export default router;
