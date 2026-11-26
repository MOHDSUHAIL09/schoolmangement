
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
import {
  notFound,
  errorHandler
} from './middleware/errorMiddleware.js';

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
import { syncExistingFaculty } from './controllers/teacherController.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js';
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

// File and Directory Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
const server = http.createServer(app);

// Disable Technology Fingerprinting
app.disable('x-powered-by');

// ==========================================
// CORS CONFIGURATION - FIXED
// ==========================================

const allowedOrigins = [
  'https://schoolmanagement07.netlify.app',
  ENV.FRONTEND_URL,
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]
  .filter(Boolean)
  .map(url => url.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {

    // Allow direct API requests, curl and Postman
    if (!origin) {
      return callback(null, true);
    }

    // Allow registered frontend origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log blocked origins
    logger.warn(`CORS blocked origin: ${origin}`);

    const error = new Error('Origin not allowed by CORS');
    error.status = 403;
    error.statusCode = 403;

    return callback(error);
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],

  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS before other middleware and routes.
// This also handles OPTIONS preflight requests.
app.use(cors(corsOptions));

// ==========================================
// SOCKET.IO INITIALIZATION
// ==========================================

const io = initSocket(server);

// ==========================================
// SECURITY HEADERS
// ==========================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },

    xContentTypeOptions: true,

    xFrameOptions: {
      action: 'deny'
    },

    xXssFilter: true,

    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },

    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

// Enterprise Security Middleware
app.use(enterpriseSecurityHeaders);
app.use(securityAuditLogger);

// ==========================================
// API RATE LIMITER
// ==========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 1000,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes.'
  }
});

app.use('/api', apiLimiter);

// ==========================================
// BODY PARSERS
// ==========================================

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);

// ==========================================
// SECURITY SANITIZERS
// ==========================================

app.use(sanitizeNoSQL);
app.use(sanitizeXSS);
app.use(preventParameterPollution);
app.use(sanitizeRegexSearch);

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ==========================================
// ROOT API ENDPOINT
// ==========================================

app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    success: true,

    name: 'SchoolSphere Backend API',

    status: 'Running',

    frontendUrl: ENV.FRONTEND_URL,

    healthCheck: '/api/health',

    timestamp: new Date().toISOString()
  });
});

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,

    message: 'SchoolSphere API is operating normally.',

    timestamp: new Date().toISOString()
  });
});

// ==========================================
// APPLICATION ROUTES
// ==========================================

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/students', studentRoutes);

app.use('/api/teachers', teacherRoutes);

app.use('/api/attendance', attendanceRoutes);

app.use(
  '/api/teacher-attendance',
  teacherAttendanceRoutes
);

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

// ==========================================
// ERROR HANDLING
// ==========================================

app.use(notFound);
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

export const startServer = async () => {
  try {

    // Connect MongoDB
    await connectDB();

    // Synchronize Existing Faculty
    await syncExistingFaculty();

    // Auto Seed Only in Development
    if (ENV.NODE_ENV !== 'production') {

      const userCount = await User.countDocuments();

      if (userCount === 0) {

        logger.info(
          'Empty database detected. Auto-seeding initial development dataset...'
        );

        await seedDatabase();
      }
    }

    // Initialize WhatsApp
    initWhatsApp().catch(err => {
      logger.warn(
        'WhatsApp service initialization handled safely:',
        err.message
      );
    });

    // Start HTTP Server
    return new Promise((resolve, reject) => {

      server.once('error', reject);

      server.listen(
        ENV.PORT,
        '0.0.0.0',
        () => {

          server.removeListener('error', reject);

          logger.info(
            '===================================================='
          );

          logger.info(
            ' SchoolSphere — Premium School Management System'
          );

          logger.info(
            ` Server active on port: ${ENV.PORT}`
          );

          logger.info(
            ` Environment: ${ENV.NODE_ENV}`
          );

          logger.info(
            ` Frontend URL: ${ENV.FRONTEND_URL}`
          );

          logger.info(
            ` Allowed Origins: ${allowedOrigins.join(', ')}`
          );

          logger.info(
            '===================================================='
          );

          resolve(server);
        }
      );
    });

  } catch (err) {

    logger.error('Server failed to start', err);

    process.exit(1);
  }
};

// Run Server Directly
if (
  process.argv[1] &&
  process.argv[1].endsWith('server.js')
) {
  startServer();
}

// Export Application
export { app, server, io };
