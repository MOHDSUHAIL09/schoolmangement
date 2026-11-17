# SchoolSphere — Premium School Management System

A complete, production-grade, full-stack **School Management System** built with **Node.js, Express.js, MongoDB, React, Vite, Tailwind CSS, Socket.io, Nodemailer, WhatsApp Baileys, and Google Gemini AI**.

Engineered with a **modern premium clean white SaaS design system**, modular microservices-oriented backend architecture, strict Role-Based Access Control (RBAC), multi-child parent management, anti-cheat AI assessments, and automated testing suites.

---

## 🌟 Architectural Highlights & Features

### 1. Role-Based Access Control (RBAC) & Authentication
- **5 Distinct System Roles**:
  - `super_admin`: Full administrative control over school settings, user registries, faculty payroll, and academic records.
  - `principal`: Comprehensive school oversight (students, faculty, attendance, fees, exams, transit, bulletins).
  - `teacher`: Class roster, attendance registers, homework creation & grading, exam publishing, and real-time chat.
  - `parent`: Multi-child portal; access scoped strictly to their own linked children.
  - `student`: Enrolled academic portal; personal attendance, assignments, exam taking, and grade review.
- **Security**:
  - Stateless JSON Web Tokens (JWT) with configurable expiration.
  - Salted `bcryptjs` password hashing (passwords never stored in plaintext).
  - Backend API route enforcement with `authMiddleware` and `roleMiddleware`.
  - Rate limiting, Helmet security headers, CORS origin whitelisting, and centralized error handling.

### 2. Multi-Child Parent Architecture
- A single parent account seamlessly manages multiple enrolled children across different grades and divisions.
- **Dynamic Child Selector**: Parents switch between children with one click. Scopes in real time:
  - Attendance rates and monthly calendars
  - Fee invoices, outstanding balances, and payment receipts
  - Homework assignments and submission statuses
  - Examination schedules and report cards
  - Assigned transport bus routes and pickup points
- **Zero Data Leakage**: Backend verification strictly prevents parents from accessing any student records outside their linked `parentIds`.

### 3. Attendance Management & Parent Absence Alerts
- Class-wise registers with quick **All Present** and **All Absent** toggles.
- Anti-duplicate attendance tracking preventing duplicate marks for the same student on the same date.
- **Multi-Channel Absence Notifications**: Marking a student `Absent` automatically triggers email alerts (via Nodemailer) and WhatsApp alerts (via WhatsApp Baileys).
- Real-time attendance percentage formula: `(Present Days + Late Days * 0.5) / Total Days * 100`.

### 4. Fee Management & Official Bursar Receipts
- Itemized fee breakdown:
  - `Tuition Fee`
  - `Game / Athletics Fee`
  - `Transport Fee`
  - `Exam Assessment Fee`
  - `Events & Activities Fee`
  - `Other Incidental Charges`
- Real-time status transitions (`Paid`, `Partial`, `Pending`, `Overdue`).
- Payment recording with reference numbers and payment methods (`Direct Deposit`, `Cash`, `Cheque`, `Card`).
- Clean printable bursar receipt modal formatted for browser printing (`window.print()`).

### 5. Homework Assignments, Student Submissions & Grading
- Teachers create tasks with title, description, class/division target, due date, and attachments.
- Students view homework filtered for their enrolled class, submit solutions, and track due dates.
- Teachers evaluate submissions, grade marks, and provide constructive pedagogical feedback.

### 6. Examinations & AI Exam Generator (Google Gemini)
- **Standardized Term Exams & Online MCQ Assessments**:
  - Live timed student exam-taking interface with active countdown timer.
  - **Anti-Cheat Answer Protection**: Correct answers and rationales are filtered on the backend prior to submission.
  - Real-time automated scoring, percentage calculation, pass/fail status determination, and post-submission answer review.
- **Google Gemini AI MCQ Generator**:
  - Integrated with `@google/generative-ai` (`gemini-1.5-flash`).
  - Instructors input subject, grade, topic, question count, and difficulty.
  - Returns structured questions with 4 options, verified correct answer, and explanation.
  - Live preview allows teachers to inspect, edit, delete, or publish questions directly to the exam system.
  - Built-in zero-downtime educational curriculum generator fallback when an external API key is unset.

### 7. Real-Time Chat & Communications (Socket.io)
- Real-time private messaging between teachers, parents, students, and administrators.
- Real-time features:
  - User online/offline presence indicators
  - Deterministic conversation room routing
  - Typing indicators (`User is typing...`)
  - Read receipts (`isRead`) and live unread badge counters
  - Auto-scrolling chat viewport with message timestamps

### 8. Campus Transit & Fleet Management
- Comprehensive bus and van fleet tracking with vehicle registration, driver contact numbers, and seating capacities.
- Waypoint route stops with scheduled arrival times and route fees.
- Scoped endpoint (`/api/transport/my-route`) allows parents and students to instantly view their assigned vehicle and driver details.

### 9. Staff & Faculty Remuneration Payroll
- Executive financial compensation module restricted strictly to Super Admin and Principal roles.
- Salary calculation formula: `Net Salary = Base Salary + Allowances - Deductions`.
- Single-click disbursement action and printable remuneration statement.

### 10. School Bulletins, Events Calendar & Campus Gallery
- Segmented announcements targeted by audience (`all`, `parents`, `students`, `teachers`).
- Academic events calendar.
- High-resolution campus activity photo gallery.

### 11. Reports & Excel Spreadsheets
- One-click XLSX workbook export using SheetJS (`xlsx`).
- Audit reports for Student Demographics, Attendance Performance, and Bursar Collections.

---

## 🎨 Premium Clean White Design System

The application strictly adheres to a **modern clean white SaaS aesthetic**:

| Design Token | Color Hex | Description |
| :--- | :--- | :--- |
| **Canvas Background** | `#F7F8FA` | Neutral ultra-soft slate off-white canvas |
| **Card / Surface** | `#FFFFFF` | Pure white elevated cards and panels |
| **Primary Typography** | `#171717` | High-contrast deep charcoal text |
| **Secondary Typography** | `#6B7280` | Elegant muted slate gray |
| **Borders & Dividers** | `#E5E7EB` | Subtle gray borders |
| **Primary Accent / CTA** | `#111827` | Deep slate/onyx primary buttons |
| **Success Indicator** | `#15803D` | Balanced forest green for pass/paid/present |
| **Warning Indicator** | `#B45309` | Amber for pending/partial payments |
| **Danger Indicator** | `#B91C1C` | Crimson for overdue/absent/failed |

---

## 🔑 Demo Evaluation Credentials

The database seeder pre-populates realistic data for all 5 roles. Quick-login pills on the login screen allow one-click access:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@schoolsphere.com` | `admin123` | Full administrative authority across all modules |
| **Principal** | `principal@schoolsphere.com` | `principal123` | Executive oversight of faculty, students, and finances |
| **Teacher** | `teacher@schoolsphere.com` | `teacher123` | Faculty member assigned to Class 10-A, 8-A, and 5-B |
| **Parent** | `parent@schoolsphere.com` | `parent123` | **Multi-Child Parent** linked to 3 children (Aarav, Ananya, Kabir) |
| **Student** | `student@schoolsphere.com` | `student123` | Enrolled Class 8-A student (Aarav Sharma) |

*Note: Legacy aliases (`admin@school.com`, `teacher@school.com`, etc.) remain fully functional.*

---

## 📁 Exact Directory Structure

```text
school-management-system/
│
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection with in-memory fallback
│   │   ├── env.js                # Environment variable schema & validation
│   │   └── socket.js             # Socket.io server, presence, rooms, notifications
│   │
│   ├── models/
│   │   ├── User.js               # Multi-role user accounts & password hashing
│   │   ├── Student.js            # Student registry with parentIds & routeId
│   │   ├── Attendance.js         # Daily attendance with anti-duplicate logic
│   │   ├── Fee.js                # Itemized fees, payments & remaining calculations
│   │   ├── Homework.js           # Assignment tasks, student submissions & grading
│   │   ├── Chat.js               # Message logs, conversation threads & read receipts
│   │   ├── Exam.js               # Term exams, MCQs, scores & rationales
│   │   ├── Transport.js          # Transit routes, drivers & pickup points
│   │   ├── Payroll.js            # Confidential staff salaries & disbursements
│   │   └── Notice.js             # Bulletins, events & campus gallery
│   │
│   ├── controllers/
│   │   ├── authController.js     # Login, registration, profile, password change
│   │   ├── userController.js     # User lookups, faculty and parent lists
│   │   ├── studentController.js  # CRUD, class filters, multi-child parent query
│   │   ├── attendanceController.js # Attendance registers, stats, email/WA alert
│   │   ├── feeController.js      # Fee generation, payment recording, receipts
│   │   ├── homeworkController.js # Assignment creation, submission, evaluation
│   │   ├── chatController.js     # Conversation history, direct messaging
│   │   ├── examController.js     # Exam publication, taking, auto-grading
│   │   ├── transportController.js# Fleet management & child route lookup
│   │   ├── payrollController.js  # Compensation statements & disbursements
│   │   └── noticeController.js   # Notices, events & gallery uploads
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── feeRoutes.js
│   │   ├── homeworkRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── examRoutes.js
│   │   ├── transportRoutes.js
│   │   ├── payrollRoutes.js
│   │   └── noticeRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token verification
│   │   ├── roleMiddleware.js     # Multi-role permission authorization
│   │   ├── errorMiddleware.js    # Centralized global error handling
│   │   ├── validationMiddleware.js # Express-validator request checks
│   │   └── uploadMiddleware.js   # Multer file storage
│   │
│   ├── services/
│   │   ├── emailService.js       # Nodemailer templates (absence, fee, homework)
│   │   ├── whatsappService.js    # Baileys WhatsApp client & absence alerts
│   │   └── aiExamService.js      # Google Gemini AI question generation
│   │
│   ├── utils/
│   │   ├── generateToken.js      # Signed JWT utility
│   │   ├── apiResponse.js        # Standardized API response wrappers
│   │   └── validators.js         # Input sanitization
│   │
│   ├── tests/
│   │   ├── setup.js              # Vitest in-memory MongoDB runner
│   │   ├── auth.test.js          # Authentication & RBAC test suite
│   │   ├── student.test.js       # Student directory & multi-child tests
│   │   ├── attendance.test.js    # Attendance & absence alerts tests
│   │   ├── fee.test.js           # Fee breakdown & payment calculation tests
│   │   ├── exam.test.js          # Exam taking, anti-cheat & Gemini AI tests
│   │   └── chat.test.js          # Real-time chat & read receipt tests
│   │
│   ├── seed/
│   │   └── seedDatabase.js       # Realistic seed data for all 5 roles
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChildSelector.jsx # Multi-child parent pupil switcher
│   │   │   ├── ConfirmDialog.jsx # Confirmation dialog modal
│   │   │   ├── DataTable.jsx     # Searchable, sortable, paginated table
│   │   │   ├── EmptyState.jsx    # Clean empty state placeholder
│   │   │   ├── Loader.jsx        # Spinners and skeleton cards
│   │   │   ├── Modal.jsx         # Accessible backdrop modal
│   │   │   ├── Navbar.jsx        # Topbar with breadcrumb & notifications
│   │   │   ├── PrintableReceipt.jsx # Official printable bursar receipt
│   │   │   ├── Sidebar.jsx       # Collapsible role-based navigation
│   │   │   ├── StatCard.jsx      # KPI metric card with trends
│   │   │   └── StatusBadge.jsx   # Clean semantic status pills
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx    # Clean white SaaS dashboard layout
│   │   ├── pages/
│   │   │   ├── AIExamGenerator.jsx # Gemini AI MCQ generation UI
│   │   │   ├── Attendance.jsx    # Daily roster & bulk attendance register
│   │   │   ├── Chat.jsx          # Real-time Socket.io chat interface
│   │   │   ├── Dashboard.jsx     # Role-customized analytical dashboards
│   │   │   ├── Exams.jsx         # Live exam taking & results inspector
│   │   │   ├── Fees.jsx          # Invoices, payments & receipt generation
│   │   │   ├── Homework.jsx      # Assignments, submissions & grading
│   │   │   ├── Login.jsx         # Login screen with 1-click evaluation pills
│   │   │   ├── Notices.jsx       # School bulletins, events & gallery
│   │   │   ├── Parents.jsx       # Parent directory & linked children
│   │   │   ├── Payroll.jsx       # Faculty payroll & salary slips
│   │   │   ├── Profile.jsx       # User profile & password management
│   │   │   ├── Reports.jsx       # Audit reports & Excel exports
│   │   │   ├── Settings.jsx      # School profile & campus configuration
│   │   │   ├── Students.jsx      # Student registry & admissions
│   │   │   ├── Teachers.jsx      # Faculty directory
│   │   │   └── Transport.jsx     # Fleet management & route stops
│   │   ├── services/
│   │   │   └── api.js            # Axios client with interceptors
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication & session persistence
│   │   │   └── SchoolContext.jsx # Toast notifications & school profile
│   │   ├── utils/
│   │   │   ├── exportExcel.js    # SheetJS workbook exporter
│   │   │   └── formatters.js     # Currency & date formatting
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── README.md
├── .gitignore
└── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (optional: an automatic in-memory MongoDB instance spins up if a local MongoDB URI is not detected)

### 1. Clone & Install Dependencies

From the project root:

```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or install separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/school_management
JWT_SECRET=SchoolSphere_SuperSecureJwtSecret_2026_Key!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Google Gemini API Key for AI Exam Generation
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: SMTP Credentials for Parent Absence & Fee Reminders
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password

# Optional: WhatsApp Integration
ENABLE_WHATSAPP=false
WHATSAPP_SESSION_PATH=./whatsapp-auth
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed Database with Realistic Data

```bash
# Seed users, students, multi-child relations, fees, homework, exams, transit, and payroll
npm run seed
```

### 4. Run Development Servers

Run backend and frontend simultaneously from root:

```bash
npm run dev
```

- **Frontend Portal**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🧪 Automated Testing Suite

The backend contains **6 complete test suites** covering all critical operational pathways:

| Test Suite | File | Coverage |
| :--- | :--- | :--- |
| **Authentication & RBAC** | `backend/tests/auth.test.js` | Login, password hashing, invalid credentials, token verification, route protection |
| **Student & Multi-Child** | `backend/tests/student.test.js` | Student admissions, duplicate admission rejection, multi-child parent query scoping |
| **Attendance & Alerts** | `backend/tests/attendance.test.js` | Register marking, anti-duplicate logic, absence alerts, percentage stats |
| **Fees & Receipts** | `backend/tests/fee.test.js` | Itemized breakdown sum, partial payment transitions, receipt authorization |
| **Exams & Gemini AI** | `backend/tests/exam.test.js` | Exam publishing, anti-cheat answer masking, auto-scoring, Gemini fallback |
| **Realtime Chat** | `backend/tests/chat.test.js` | Room determinism, message dispatch, unread counters, read receipts |

Execute all tests:

```bash
cd backend
npm test
```

*Results: 6 test suites passed, 25 tests passed (100% pass rate).*

---

## 📦 Production Build

Build the optimized production frontend bundle:

```bash
cd frontend
npm run build
```

Generates static assets in `frontend/dist/`.

---

## 📡 Core API Reference

| Endpoint | Method | Role Restriction | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | User authentication & token issuance |
| `/api/auth/me` | GET | Authenticated | Retrieve current user profile |
| `/api/auth/profile` | PUT | Authenticated | Update name or phone number |
| `/api/auth/change-password` | PUT | Authenticated | Secure password modification |
| `/api/students` | GET | Authenticated | List students (filtered by class/section/parent) |
| `/api/students` | POST | `super_admin`, `principal` | Admit new student profile |
| `/api/attendance` | GET | Authenticated | Fetch class or student attendance roster |
| `/api/attendance` | POST | `super_admin`, `principal`, `teacher` | Mark daily attendance & fire absence alerts |
| `/api/fees` | GET | Authenticated | List fees (scoped to student or parent child) |
| `/api/fees` | POST | `super_admin`, `principal` | Generate itemized fee statement |
| `/api/fees/:id/pay` | POST | `super_admin`, `principal` | Record fee collection payment |
| `/api/homework` | GET | Authenticated | List assignments by class grade |
| `/api/homework` | POST | `super_admin`, `principal`, `teacher` | Create homework task |
| `/api/homework/:id/submit` | POST | `student` | Submit student assignment |
| `/api/homework/:id/grade/:subId` | PUT | `teacher`, `principal` | Grade student submission |
| `/api/exams` | GET | Authenticated | List published examinations |
| `/api/exams` | POST | `super_admin`, `principal`, `teacher` | Publish exam / MCQ test |
| `/api/exams/:id/submit` | POST | `student` | Submit answers & trigger auto-grading |
| `/api/exams/generate-ai` | POST | `teacher`, `principal`, `super_admin` | Generate MCQs using Google Gemini AI |
| `/api/chat/conversations` | GET | Authenticated | Retrieve active user conversations |
| `/api/chat/messages` | POST | Authenticated | Send message via REST & Socket.io |
| `/api/transport` | GET | Authenticated | Transit route & fleet directory |
| `/api/transport/my-route` | GET | Authenticated | Retrieve assigned vehicle for student/child |
| `/api/payroll` | GET | `super_admin`, `principal` | List confidential faculty salaries |
| `/api/payroll/:id/pay` | POST | `super_admin`, `principal` | Disburse employee monthly salary |
| `/api/notices` | GET | Authenticated | Fetch school bulletins and announcements |

---

## 📄 License
This project is licensed under the MIT License. Built with ❤️ for educational excellence.
#   s c h o o l m a n a g e m e n t  
 