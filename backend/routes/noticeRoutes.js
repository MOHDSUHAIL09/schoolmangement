import express from 'express';
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
} from '../controllers/noticeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllNotices)
  .post(authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), createNotice);

router.route('/:id')
  .get(getNoticeById)
  .put(authorizeRoles('super_admin', 'admin', 'principal', 'teacher'), updateNotice)
  .delete(authorizeRoles('super_admin', 'admin', 'principal'), deleteNotice);

export default router;
