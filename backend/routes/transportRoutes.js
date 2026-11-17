import express from 'express';
import {
  getAllRoutes,
  getRouteById,
  getMyRoute,
  createRoute,
  updateRoute,
  deleteRoute
} from '../controllers/transportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/my-route', getMyRoute);

router.route('/')
  .get(getAllRoutes)
  .post(authorizeRoles('super_admin', 'principal'), createRoute);

router.route('/:id')
  .get(getRouteById)
  .put(authorizeRoles('super_admin', 'principal'), updateRoute)
  .delete(authorizeRoles('super_admin'), deleteRoute);

export default router;
