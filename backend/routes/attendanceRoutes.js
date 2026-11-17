import express from 'express';
import {
  markBulkAttendance,
  getAttendanceByClass,
  getMonthlyAttendance,
  getAttendanceReport,
  getStudentAttendanceSummary,
  getAttendanceOverview
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/bulk', authorizeRoles('super_admin', 'principal', 'teacher'), markBulkAttendance);
router.get('/class', getAttendanceByClass);
router.get('/monthly', getMonthlyAttendance);
router.get('/report', getAttendanceReport);
router.get('/student/:studentId', getStudentAttendanceSummary);
router.get('/stats/overview', getAttendanceOverview);

export default router;
