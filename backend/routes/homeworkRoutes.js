import express from 'express';
import {
  getAllHomework,
  getHomeworkById,
  createHomework,
  submitHomework,
  gradeSubmission,
  deleteHomework
} from '../controllers/homeworkController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllHomework)
  .post(authorizeRoles('super_admin', 'principal', 'teacher'), createHomework);

router.route('/:id')
  .get(getHomeworkById)
  .delete(authorizeRoles('super_admin', 'principal', 'teacher'), deleteHomework);

router.post('/:id/submit', authorizeRoles('student'), submitHomework);
router.put('/:id/grade', authorizeRoles('super_admin', 'principal', 'teacher'), gradeSubmission);

export default router;
