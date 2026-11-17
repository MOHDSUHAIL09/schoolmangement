# 03 - Backend Codebase Structure

This document provides a complete directory map of the backend application, explaining the architectural purpose of each directory, file responsibilities, and modification guidelines.

---

## 1. Directory Tree Map

```text
backend/
├── server.js                      # Application entrypoint (Express app, HTTP server, Socket.io)
├── package.json                   # Backend dependencies, scripts, and module metadata
├── package-lock.json              # Version lockfile
├── .env.example                   # Environment configuration template
│
├── config/                        # Infrastructure & system configuration
│   ├── db.js                      # MongoDB connection manager (Mongoose strict query)
│   ├── env.js                     # Environment variable loader & default fallback registry
│   └── socket.js                  # Socket.io server initializer & user room manager
│
├── controllers/                   # Request processing & database query controllers
│   ├── attendanceController.js    # Bulk attendance roll-call, monthly reports, statistics
│   ├── authController.js          # Login, registration, profile update, password change
│   ├── chatController.js          # Direct messaging conversations and history
│   ├── communicationController.js # Multi-channel broadcast dispatch (Email & WhatsApp)
│   ├── examController.js          # Exam scheduling, AI questions, submissions, report cards
│   ├── feeController.js           # Fee creation, payment recording, collection statistics
│   ├── homeworkController.js      # Homework assignment, student submission, grading
│   ├── noticeController.js        # Institutional circulars, events, and campus notices
│   ├── payrollController.js       # Employee salary records, allowance/deduction math
│   ├── settingController.js       # Global institution branding and currency configuration
│   ├── studentController.js       # Student admissions, multi-child search, class metadata
│   ├── transportController.js     # Transit bus/van routes, stops, and driver contacts
│   └── userController.js          # User account administration (staff, faculty, parents)
│
├── middleware/                    # HTTP interceptors and security filters
│   ├── authMiddleware.js          # JWT verification, active user checks, token versioning
│   ├── errorMiddleware.js         # Central 404 handler & Mongoose CastError sanitizer
│   ├── roleMiddleware.js          # Role-Based Access Control (RBAC) guard
│   ├── securityMiddleware.js      # NoSQL injection, XSS sanitizer, ReDoS defense, rate limiters
│   ├── uploadMiddleware.js        # Multer disk storage, file extension & MIME-type filters
│   └── validationMiddleware.js    # Express-validator schemas and input sanitizers
│
├── models/                        # Mongoose schemas and data persistence models
│   ├── Attendance.js              # Daily student roll-call records
│   ├── Chat.js                    # Direct messaging chat records
│   ├── CommunicationLog.js        # Outbound notification audit log (Email & WhatsApp)
│   ├── Exam.js                    # Exam schedules, question papers, and student marks
│   ├── Fee.js                     # Student tuition ledger, fee breakdown, and receipts
│   ├── Homework.js                # Homework assignments and student file submissions
│   ├── Notice.js                  # Campus bulletins, announcements, and events
│   ├── Payroll.js                 # Monthly staff salary vouchers and payment tracking
│   ├── Setting.js                 # Institutional branding (name, motto, logo, currency)
│   ├── Student.js                 # Complete student registry (demographics, parent links)
│   ├── Transport.js               # Fleet routes, driver details, and passenger stops
│   └── User.js                    # User accounts, hashed passwords, roles, and lockout
│
├── routes/                        # Express API route declarations
│   ├── attendanceRoutes.js        # /api/attendance
│   ├── authRoutes.js              # /api/auth
│   ├── chatRoutes.js              # /api/chat
│   ├── communicationRoutes.js     # /api/communication
│   ├── examRoutes.js              # /api/exams
│   ├── feeRoutes.js               # /api/fees
│   ├── homeworkRoutes.js          # /api/homework
│   ├── noticeRoutes.js            # /api/notices
│   ├── payrollRoutes.js           # /api/payroll
│   ├── settingRoutes.js           # /api/settings
│   ├── studentRoutes.js           # /api/students
│   ├── transportRoutes.js         # /api/transport
│   ├── uploadRoutes.js            # /api/upload
│   └── userRoutes.js              # /api/users
│
├── seed/                          # Database seeding scripts
│   └── seedDatabase.js            # Full academic database seeder
│
├── services/                      # External integrations and computational services
│   ├── aiChatService.js           # Multilingual NLP assistant (Urdu, Hindi, Hinglish, English)
│   ├── aiExamService.js           # Google Gemini 1.5 Flash MCQ & exam synthesizer
│   ├── emailService.js            # Nodemailer SMTP transporter & responsive HTML templates
│   └── whatsappService.js         # Baileys WhatsApp Web multi-device automation daemon
│
├── tests/                         # Vitest automated test suite
│   ├── attendance.test.js         # Attendance unit and integration tests
│   ├── auth.test.js               # Login, JWT, lockout tests
│   ├── chat.test.js               # Messaging endpoint tests
│   ├── exam.test.js               # Examination and grading tests
│   ├── fee.test.js                # Financial collection and receipt tests
│   ├── security.test.js           # Injection and security header tests
│   ├── setup.js                   # In-memory MongoDB testing harness
│   └── student.test.js            # Student enrollment and parent linkage tests
│
├── uploads/                       # Storage directory for uploaded attachments & avatars
│   └── .gitkeep                   # Keeps directory tracked in version control
│
└── utils/                         # Logging and utility functions
    ├── apiResponse.js             # Formatter for standardized API responses
    ├── generateToken.js           # JWT token generation helper
    ├── logger.js                  # Winston/Console logger wrapper
    └── validators.js              # Custom validation helper functions
```

---

## 2. Directory Modification Guidelines

### `backend/routes/`
- **When to Modify**: When adding new API endpoints or changing HTTP verbs. Every route file should map directly to a corresponding controller method.

### `backend/controllers/`
- **When to Modify**: When adding or altering business logic, database queries, calculations, or external service calls. Keep controllers focused on request handling and delegate heavy computation to `services/`.

### `backend/models/`
- **When to Modify**: When changing database collections, adding new fields, modifying enums, or adding pre-save hooks (e.g. password hashing, fee totals calculation).

### `backend/middleware/`
- **When to Modify**: When adjusting authentication verification, updating role permissions, or fine-tuning security sanitization rules.
