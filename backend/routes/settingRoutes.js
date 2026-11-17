import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, authorizeRoles('super_admin', 'principal'), updateSettings);

export default router;
