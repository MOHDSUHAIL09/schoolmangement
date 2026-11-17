import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { logger } from './utils/logger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import {
  sanitizeNoSQL,
  sanitizeXSS,
  preventParameterPollution,
  sanitizeRegexSearch,
  enterpriseSecurityHeaders,
  securityAuditLogger
} from './middleware/securityMiddleware.js';
import { initWhatsApp } from './services/whatsappService.js';
import { seedDatabase } from './seed/seedDatabase.js';
import User from './models/User.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import examRoutes from './routes/examRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Prevent Technology Fingerprinting (Anti-Reconnaissance)
app.disable('x-powered-by');

// Initialize Socket.io via modular config
const io = initSocket(server);

// Security Headers (Helmet Hardening)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    xXssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
  })
);

// Enterprise Extra Security Headers & Live Security Audit Logger
app.use(enterpriseSecurityHeaders);
app.use(securityAuditLogger);

// Hardened CORS Protection against Cross-Origin Exploits
const allowedOrigins = [
  ENV.FRONTEND_URL,
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like mobile apps, curl, automated test suites
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin is not permitted.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', apiLimiter);

// Body Parsers & Security Sanitizers (Hardened 2MB limit to mitigate Parser Memory Exhaustion DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Enterprise Security In-depth Defense
app.use(sanitizeNoSQL);
app.use(sanitizeXSS);
app.use(preventParameterPollution);
app.use(sanitizeRegexSearch);

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SchoolSphere API is operating normally.',
    timestamp: new Date().toISOString()
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/communication', communicationRoutes);

// 404 & Centralized Error Handler
app.use(notFound);
app.use(errorHandler);

// Start Server helper
export const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed database if empty in development mode
    if (ENV.NODE_ENV !== 'production') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        logger.info('Empty database detected. Auto-seeding initial development dataset...');
        await seedDatabase();
      }
    }

    // Initialize WhatsApp client safely in background
    initWhatsApp().catch((err) => {
      logger.warn('WhatsApp service initialization handled safely:', err.message);
    });

    return new Promise((resolve) => {
      server.listen(ENV.PORT, () => {
        logger.info(`====================================================`);
        logger.info(` SchoolSphere — Premium School Management System`);
        logger.info(` Server active on port: ${ENV.PORT} [${ENV.NODE_ENV}]`);
        logger.info(` API base URL: http://localhost:${ENV.PORT}/api`);
        logger.info(`====================================================`);
        resolve(server);
      });
    });
  } catch (err) {
    logger.error('Server failed to start', err);
    process.exit(1);
  }
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export { app, server, io };
