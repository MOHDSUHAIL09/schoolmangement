# 07 - Database Schemas and Models

This document provides complete technical specifications for all 12 Mongoose models in `backend/models/`, including field types, validation constraints, relationships, indexes, and schema hooks.

---

## 1. Database Architecture & Technology

- **Database**: MongoDB (v6.0+)
- **Object Data Modeling (ODM)**: Mongoose (v8.10.1)
- **Design Philosophy**: Hybrid relational schema with embedded subdocuments for high-frequency sub-collections (e.g. questions inside exams, pickup points inside routes, submissions inside homework).

---

## 2. Complete Model Catalog

### A. `User.js` (`users` collection)
| Field | Type | Required | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Trimmed | User's full name. |
| `email` | String | Yes | Unique, lowercase, trimmed | Primary login identifier. |
| `password` | String | Yes | Min 6 chars, `select: false` | Hashed bcrypt password. |
| `role` | String | Yes | Enum: `super_admin`, `principal`, `teacher`, `parent`, `student`. Default: `student` | RBAC role. |
| `phone` | String | No | Default: `''` | Contact telephone number. |
| `profileImage` | String | No | Default: `''` | Synchronized with `avatar`. |
| `status` | String | Yes | Enum: `active`, `inactive`, `suspended`. Default: `active` | Account status. |
| `isActive` | Boolean | Yes | Default: `true` | Boolean status flag. |
| `failedLoginAttempts`| Number| No | Default: `0` | Consecutive failed login count. |
| `lockUntil` | Date | No | Default: `null` | Lockout expiration timestamp. |
| `passwordChangedAt` | Date | No | Default: `null` | Timestamp of last password change. |
| `tokenVersion` | Number | Yes | Default: `0` | Incremented on password change to invalidate old JWTs. |

- **Hooks**: Pre-save hook hashes password using `bcrypt.genSalt(10)` if modified, synchronizes `profileImage` with `avatar`, and increments `tokenVersion`.

---

### B. `Student.js` (`students` collection)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `userId` | ObjectId | No | Reference to `User` (for student login portal). |
| `studentId` | String | Yes | Unique school ID (e.g., `'SCH-1001'`). |
| `admissionNumber`| String | Yes | Unique admission identifier. |
| `rollNumber` | String | Yes | Class roll number. |
| `name` | String | No | Full display name (auto-synced from `firstName` + `lastName`). |
| `dateOfBirth` | Date | Yes | Birth date for age verification. |
| `gender` | String | Yes | Enum: `'Male'`, `'Female'`, `'Other'`. Default: `'Male'`. |
| `classGrade` | String | Yes | Academic grade (e.g., `'Grade 10'`). |
| `section` | String | Yes | Class section (e.g., `'A'`). |
| `parentIds` | Array<ObjectId>| No | References to `User` collection (parent/guardian accounts). |
| `routeId` | ObjectId | No | Reference to `Transport` collection (bus route). |
| `status` | String | Yes | Enum: `'Active'`, `'Inactive'`, `'Suspended'`, `'Graduated'`. |

- **Indexes**: Compound index on `{ classGrade: 1, section: 1, rollNumber: 1 }` and `{ parentIds: 1 }`.

---

### C. `Attendance.js` (`attendances` collection)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `studentId` | ObjectId | Yes | Reference to `Student`. |
| `classGrade` | String | Yes | Enrolled grade. |
| `section` | String | Yes | Enrolled section. |
| `date` | Date | Yes | Date of attendance roll-call. |
| `status` | String | Yes | Enum: `'Present'`, `'Absent'`, `'Late'`, `'Leave'`. Default: `'Present'`. |
| `markedBy` | ObjectId | Yes | Reference to `User` (teacher who marked attendance). |
| `remarks` | String | No | Note regarding tardiness or absence excuse. |

- **Indexes**: Compound unique index `{ studentId: 1, date: 1 }` prevents double marking on the same day.

---

### D. `Fee.js` (`fees` collection)
| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `studentId` | ObjectId | Required | Reference to `Student`. |
| `classGrade` | String | Required | Student grade. |
| `academicYear` | String | `'2026-2027'`| Active session. |
| `month` | String | `'November 2026'` | Billing period. |
| `tuition` | Number | `0` | Base tuition fee. |
| `game` | Number | `0` | Sports & athletics fee. |
| `transport` | Number | `0` | Bus route transit fee. |
| `exam` | Number | `0` | Examination fee. |
| `events` | Number | `0` | Campus functions fee. |
| `other` | Number | `0` | Miscellaneous charges. |
| `totalAmount` | Number | Auto-calculated | Sum of fee breakdown components. |
| `paidAmount` | Number | `0` | Cumulative amount paid. |
| `remainingAmount`| Number| Auto-calculated | `Math.max(0, totalAmount - paidAmount)`. |
| `status` | String | Auto-calculated | Enum: `'Paid'`, `'Partial'`, `'Pending'`, `'Overdue'`. |
| `dueDate` | Date | Required | Invoice deadline. |
| `paymentMethod` | String | `'None'` | Enum: `'Cash'`, `'Credit Card'`, `'Bank Transfer'`, `'UPI'`, `'Cheque'`, `'Online'`, `'None'`. |
| `transactionId` | String | `''` | Payment reference or receipt number. |

---

### E. `Exam.js` (`exams` collection)
- **Top-Level Fields**: `title`, `examType` (Enum: `'Mid-Term'`, `'Final Exam'`, `'Unit Test'`, `'Practical Assessment'`, `'Quiz'`, `'Term Examination'`), `classGrade`, `section`, `subject`, `roomNo`, `timeSlot`, `durationMinutes`, `createdBy` (`User`), `createdByType` (`'manual'`, `'ai_generated'`), `startDate`, `endDate`, `totalMarks`, `passingMarks`, `status`.
- **Embedded `questions` Array**: Subdocument array of `{ question, options: [String], correctAnswer: Number, marks: Number, explanation: String }`.
- **Embedded `submissions` Array**: Subdocument array of student submissions `{ studentId, answers, score, totalMarks, percentage, grade, rank, teacherRemarks, isPassed, submittedAt }`.

---

### F. `Homework.js` (`homeworks` collection)
- **Top-Level Fields**: `teacherId` (`User`), `classGrade`, `section`, `subject`, `title`, `description`, `dueDate`, `attachments: [String]`.
- **Embedded `submissions` Array**: Subdocument array of `{ studentId, fileUrl, textSubmission, submittedAt, status: ['Pending', 'Submitted', 'Reviewed', 'Late'], teacherRemarks, marks }`.

---

### G. `Transport.js` (`transports` collection)
- **Fields**: `routeName`, `vehicleNumber` (Unique), `vehicleType` (Enum: `'Bus'`, `'Van'`, `'Mini-Bus'`), `driverName`, `driverPhone`, `capacity`, `status`, `assignedStudents: [Student]`.
- **Embedded `pickupPoints` Array**: `{ name, time, location, fee }`.

---

### H. `Payroll.js` (`payrolls` collection)
- **Fields**: `employeeId` (`User`), `salaryMonth` (e.g., `'November 2026'`), `baseSalary`, `allowances`, `deductions`, `netSalary` (Auto-calculated: `baseSalary + allowances - deductions`), `status` (Enum: `'Pending'`, `'Paid'`, `'Processing'`), `paymentDate`, `paymentMethod`, `remarks`.
- **Indexes**: Compound unique index `{ employeeId: 1, salaryMonth: 1 }`.

---

### I. `Notice.js` (`notices` collection)
- **Fields**: `type` (Enum: `'Notice'`, `'Event'`, `'Gallery'`), `title`, `description`, `imageUrl`, `eventDate`, `targetRole` (Enum: `'all'`, `'teacher'`, `'parent'`, `'student'`), `isPublished` (Boolean), `createdBy` (`User`).

---

### J. `Setting.js` (`settings` collection)
- **Fields**: `schoolName`, `schoolMotto`, `logoUrl`, `address`, `phone`, `email`, `website`, `academicYear`, `currency`.

---

### K. `Chat.js` (`chats` collection)
- **Fields**: `senderId` (`User`), `receiverId` (`User`), `message`, `senderRole`, `conversationId`, `isRead`.

---

### L. `CommunicationLog.js` (`communicationlogs` collection)
- **Fields**: `channel` (Enum: `'email'`, `'whatsapp'`), `senderId` (`User`), `recipientTarget`, `recipientEmail`, `recipientPhone`, `recipientName`, `subject`, `message`, `template`, `status` (Enum: `'Delivered'`, `'Sent'`, `'Failed'`, `'Queued'`), `messageId`, `aiReply`.
