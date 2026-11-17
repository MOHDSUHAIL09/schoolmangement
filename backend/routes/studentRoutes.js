import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getMyChildren,
  getClassesMeta
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/my-children', authorizeRoles('parent', 'super_admin', 'principal'), getMyChildren);
router.get('/classes-meta', getClassesMeta);

router.route('/')
  .get(getAllStudents)
  .post(authorizeRoles('super_admin', 'principal'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(authorizeRoles('super_admin', 'principal', 'teacher'), updateStudent)
  .delete(authorizeRoles('super_admin'), deleteStudent);

export default router;
