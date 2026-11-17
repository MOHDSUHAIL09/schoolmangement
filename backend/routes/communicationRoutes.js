import express from 'express';
import {
  sendManualEmail,
  sendManualWhatsApp,
  getCommunicationLogs,
  getCommunicationStatus,
  getCommunicationStats,
  generateCommunicationAIReply
} from '../controllers/communicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/status', getCommunicationStatus);
router.get('/stats', getCommunicationStats);
router.get('/logs', getCommunicationLogs);

router.post('/ai-reply', generateCommunicationAIReply);
router.post('/email/send', authorizeRoles('super_admin', 'principal', 'teacher'), sendManualEmail);
router.post('/whatsapp/send', authorizeRoles('super_admin', 'principal', 'teacher'), sendManualWhatsApp);

export default router;
