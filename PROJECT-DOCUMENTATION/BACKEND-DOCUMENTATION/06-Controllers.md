# 06 - Backend Controller Processing Layer

This document details the responsibilities, input parameters, processing logic, database interactions, and error handling for all 13 controllers in `backend/controllers/`.

---

## 1. Controller Catalog & Responsibilities

| Controller File | Primary Domain | Core Functions |
| :--- | :--- | :--- |
| `authController.js` | Authentication & Self-Service | `login`, `register`, `getMe`, `updateProfile`, `changePassword` |
| `userController.js` | User Directory Administration | `getAllUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `getTeachers`, `getParents` |
| `studentController.js` | Student Admissions & Records | `getAllStudents`, `getStudentById`, `createStudent`, `updateStudent`, `deleteStudent`, `getMyChildren`, `getClassesMeta` |
| `attendanceController.js` | Daily Roll-Call & Trends | `markBulkAttendance`, `getAttendanceByClass`, `getMonthlyAttendance`, `getAttendanceReport`, `getStudentAttendanceSummary`, `getAttendanceOverview` |
| `feeController.js` | Financial Accounting & Invoices | `getAllFees`, `getFeeById`, `createFee`, `recordPayment`, `getFeeStats` |
| `examController.js` | Exams, Marks & Gemini AI Studio| `getAllExams`, `getExamById`, `createExam`, `generateAIExam`, `submitExam`, `recordMarks`, `getStudentReportCard`, `deleteExam`, `generateAIPaper`, `analyzeExamDifficultyCtrl`, `getExamPerformanceAnalysis`, `getWeakSubjectsAnalysisCtrl` |
| `homeworkController.js` | Homework & Digital Submissions | `getAllHomework`, `getHomeworkById`, `createHomework`, `submitHomework`, `gradeSubmission`, `deleteHomework` |
| `chatController.js` | Direct Messaging History | `getConversations`, `getMessages`, `sendMessage` |
| `transportController.js` | Transit Fleet & Routes | `getAllRoutes`, `getRouteById`, `getMyRoute`, `createRoute`, `updateRoute`, `deleteRoute` |
| `payrollController.js` | Staff Salaries & Allowances | `getAllPayrolls`, `createOrUpdatePayroll`, `markPayrollAsPaid`, `getPayrollStats` |
| `noticeController.js` | Bulletins & Circulars | `getAllNotices`, `getNoticeById`, `createNotice`, `updateNotice`, `deleteNotice` |
| `communicationController.js` | Email & WhatsApp Dispatcher | `sendManualEmail`, `sendManualWhatsApp`, `getCommunicationLogs`, `getCommunicationStatus`, `getCommunicationStats`, `generateCommunicationAIReply` |
| `settingController.js` | Institutional Branding | `getSettings`, `updateSettings` |

---

## 2. Key Controller Implementation Walkthroughs

### A. `authController.js` (`login`)
1. **Input**: `email`, `password` from `req.body`.
2. **Lockout Check**: Queries `User.findOne({ email }).select('+password')`. Invokes `user.isLocked()`. If true, returns HTTP `423` with remaining lockout minutes.
3. **Password Verification**: Invokes `user.matchPassword(password)`. If mismatched:
   - Invokes `user.handleFailedLogin()`. If failures reach 5, locks account for 15 minutes.
   - Logs security audit warning and returns HTTP `401`.
4. **Success Handling**:
   - Calls `user.handleSuccessfulLogin()` (resets failures and updates `lastLogin`).
   - Generates JWT via `generateToken(user._id, user.role, user.email, user.name, user.tokenVersion)`.
   - Returns token and sanitized user profile.

---

### B. `attendanceController.js` (`markBulkAttendance`)
1. **Input**: `classGrade`, `section`, `date`, `records: [{ studentId, status, remarks }]`.
2. **Batch Processing**: Uses Mongoose `bulkWrite` with `updateOne` and `{ upsert: true }` keyed on `{ studentId, date }`.
3. **Automated Notification Dispatch**:
   - Asynchronously queries parent email/phone for any student marked `'Absent'`.
   - Dispatches background notification via `sendAttendanceNotification` (Email) and `sendWhatsAppAttendanceNotification` without blocking HTTP response.
4. **Response**: Returns HTTP `200` with total count of records processed.

---

### C. `feeController.js` (`recordPayment`)
1. **Input**: Fee record `:id`, `amount`, `paymentMethod`, `transactionId`, `remarks`.
2. **Balance Calculation**:
   - Reads fee record from database.
   - Increments `paidAmount` by incoming `amount`.
   - Pre-save Mongoose hook automatically re-calculates `remainingAmount = Math.max(0, totalAmount - paidAmount)` and updates status to `'Paid'` or `'Partial'`.
3. **Audit Trail**: Records timestamp and method (`Cash`, `Credit Card`, `UPI`, `Bank Transfer`).
4. **Response**: Returns updated fee document.

---

### D. `examController.js` (`generateAIExam`)
1. **Input**: `classGrade`, `subject`, `topic`, `difficulty`, `numberOfQuestions`.
2. **Delegation**: Calls `generateExamQuestions` in `services/aiExamService.js`.
3. **Gemini Execution**:
   - If `GEMINI_API_KEY` is present, prompts Gemini 1.5 Flash to synthesize multiple-choice questions with answer keys and explanations.
   - If API key is absent or network fails, falls back gracefully to standard curriculum generator.
4. **Response**: Returns JSON list of verified question objects.
