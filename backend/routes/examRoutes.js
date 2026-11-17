import express from 'express';
import {
  getAllExams,
  getExamById,
  createExam,
  generateAIExam,
  submitExam,
  recordMarks,
  getStudentReportCard,
  deleteExam,
  generateAIPaper,
  analyzeExamDifficultyCtrl,
  getExamPerformanceAnalysis,
  getWeakSubjectsAnalysisCtrl
} from '../controllers/examController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// AI & Analytics Routes
router.post('/ai-generate', authorizeRoles('super_admin', 'principal', 'teacher'), generateAIExam);
router.post('/ai/generate-paper', authorizeRoles('super_admin', 'principal', 'teacher'), generateAIPaper);
router.post('/ai/analyze-difficulty', authorizeRoles('super_admin', 'principal', 'teacher'), analyzeExamDifficultyCtrl);
router.get('/ai/performance-analysis/:examId', getExamPerformanceAnalysis);
router.get('/ai/weak-subjects', getWeakSubjectsAnalysisCtrl);

// Report card route
router.get('/report-card/:studentId', getStudentReportCard);

router.route('/')
  .get(getAllExams)
  .post(authorizeRoles('super_admin', 'principal', 'teacher'), createExam);

router.route('/:id')
  .get(getExamById)
  .delete(authorizeRoles('super_admin', 'principal', 'teacher'), deleteExam);

router.post('/:id/submit', authorizeRoles('student'), submitExam);
router.post('/:id/marks', authorizeRoles('super_admin', 'principal', 'teacher'), recordMarks);

export default router;
