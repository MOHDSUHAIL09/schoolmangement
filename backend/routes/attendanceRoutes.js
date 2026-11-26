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

router.post('/bulk', authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), markBulkAttendance);
router.get('/class', authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), getAttendanceByClass);
router.get('/monthly', authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), getMonthlyAttendance);
router.get('/report', authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), getAttendanceReport);
router.get('/stats/overview', authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), getAttendanceOverview);
router.get('/student/:studentId', getStudentAttendanceSummary);

export default router;
