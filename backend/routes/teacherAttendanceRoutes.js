import express from 'express';
import {
  getDailyAttendance,
  saveDailyAttendance,
  getTeacherAttendanceHistory,
  getMonthlyRegister
} from '../controllers/teacherAttendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
// Strictly restricted to super_admin as requested
router.use(authorizeRoles('super_admin'));

router.get('/daily', getDailyAttendance);
router.post('/daily', saveDailyAttendance);
router.get('/teacher/:teacherId', getTeacherAttendanceHistory);
router.get('/monthly', getMonthlyRegister);

export default router;
