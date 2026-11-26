import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTeachers,
  getParents
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/teachers', getTeachers);
router.get('/parents', getParents);

router.route('/')
  .get(authorizeRoles('super_admin', 'principal'), getAllUsers)
  .post(authorizeRoles('super_admin', 'principal'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(authorizeRoles('super_admin', 'admin', 'principal'), updateUser)
  .delete(authorizeRoles('super_admin', 'admin', 'principal'), deleteUser);

export default router;
