import express from 'express';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../controllers/teacherController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllTeachers)
  .post(authorizeRoles('super_admin', 'admin', 'principal'), createTeacher);

router.route('/:id')
  .get(getTeacherById)
  .put(authorizeRoles('super_admin', 'admin', 'principal'), updateTeacher)
  .delete(authorizeRoles('super_admin', 'admin'), deleteTeacher);

export default router;
