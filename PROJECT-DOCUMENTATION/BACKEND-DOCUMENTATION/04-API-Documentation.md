# 04 - Comprehensive REST API Directory

This document provides complete, production-grade technical documentation for every REST API endpoint implemented in the SchoolSphere backend.

---

## 1. System Health & Infrastructure

### `GET /api/health`
- **Purpose**: System health check endpoint for monitoring, load balancers, and container probes.
- **Authentication**: None (Public).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "SchoolSphere API is operating normally.",
    "timestamp": "2026-11-13T12:00:00.000Z"
  }
  ```

---

## 2. Authentication API (`/api/auth`)

### `POST /api/auth/login`
- **Purpose**: Authenticates credentials, checks account lock status, issues JWT, and resets failed attempt counters.
- **Authentication**: None (Rate limited: 15 req/15 min).
- **Request Body**:
  ```json
  {
    "email": "admin@schoolsphere.com",
    "password": "admin123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "6af6db802dbda59fb6187be3",
        "name": "Dr. Evelyn Sterling",
        "email": "admin@schoolsphere.com",
        "role": "super_admin",
        "phone": "+1 (555) 100-0001",
        "profileImage": "https://...",
        "lastLogin": "2026-11-13T12:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password.
  - `423 Locked`: Account locked due to exceeding 5 failed login attempts.
  - `403 Forbidden`: Account deactivated (`isActive: false`).

---

### `POST /api/auth/register`
- **Purpose**: Creates an administrative or faculty user account.
- **Authentication**: None (Strictly intended for initial setup or administrative enrollment).
- **Request Body**:
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah.connor@schoolsphere.com",
    "password": "Password123!",
    "role": "teacher",
    "phone": "+1 555-019-2834"
  }
  ```
- **Success Response (201 Created)**: Returns created user profile and JWT session token.

---

### `GET /api/auth/me`
- **Purpose**: Re-evaluates current JWT token and returns latest user profile.
- **Authentication**: `Bearer <token>` (Any authenticated user).
- **Success Response (200 OK)**: Current user document excluding password hash.

---

### `PUT /api/auth/profile`
- **Purpose**: Self-service user profile update.
- **Authentication**: `Bearer <token>`.
- **Request Body**:
  ```json
  {
    "name": "Dr. Evelyn Sterling",
    "phone": "+1 (555) 100-9999",
    "profileImage": "/uploads/avatar_123.jpg"
  }
  ```

---

### `PUT /api/auth/change-password`
- **Purpose**: Self-service password change. Increments `tokenVersion` to invalidate all previously issued tokens across all sessions.
- **Authentication**: `Bearer <token>`.
- **Request Body**:
  ```json
  {
    "currentPassword": "admin123",
    "newPassword": "NewAdminPassword2026!"
  }
  ```

---

## 3. Users Management API (`/api/users`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/teachers` | Authenticated | Returns list of faculty members. |
| `GET` | `/api/users/parents` | Authenticated | Returns list of registered parent accounts. |
| `GET` | `/api/users` | `super_admin`, `principal` | Paginated search of all users with role filtering. |
| `POST` | `/api/users` | `super_admin`, `principal` | Enrolls a new user account with assigned role. |
| `GET` | `/api/users/:id` | Authenticated | Returns profile of a specific user. |
| `PUT` | `/api/users/:id` | `super_admin`, `principal` | Updates user details, status, or role. |
| `DELETE`| `/api/users/:id` | `super_admin` | Deletes user account. |

---

## 4. Student Information API (`/api/students`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students/my-children` | `parent`, `super_admin`, `principal` | Returns children associated with parent user ID. |
| `GET` | `/api/students/classes-meta` | Authenticated | Returns unique array of all grades and sections. |
| `GET` | `/api/students` | Authenticated | Searchable directory with `classGrade`, `section`, `search`. |
| `POST` | `/api/students` | `super_admin`, `principal` | Enrolls student (admission number, roll number, DOB). |
| `GET` | `/api/students/:id` | Authenticated | Full student dossier with parent and route references. |
| `PUT` | `/api/students/:id` | `super_admin`, `principal`, `teacher` | Updates demographics, status (`Active`, `Graduated`). |
| `DELETE`| `/api/students/:id` | `super_admin` | Deletes student record. |

---

## 5. Attendance API (`/api/attendance`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/bulk` | `super_admin`, `principal`, `teacher` | Records daily roll-call for an entire classroom. |
| `GET` | `/api/attendance/class` | Authenticated | Fetches roll-call records for class, section, and date. |
| `GET` | `/api/attendance/monthly` | Authenticated | Monthly grid matrix of attendance across a calendar month. |
| `GET` | `/api/attendance/report` | Authenticated | Date-range attendance analytics for report cards. |
| `GET` | `/api/attendance/student/:studentId` | Authenticated | Individual student attendance summary and percentage. |
| `GET` | `/api/attendance/stats/overview` | Authenticated | Institutional summary attendance percentage. |

### Sample Payload for `POST /api/attendance/bulk`:
```json
{
  "classGrade": "Grade 10",
  "section": "A",
  "date": "2026-11-13",
  "records": [
    { "studentId": "65b...", "status": "Present", "remarks": "" },
    { "studentId": "65c...", "status": "Absent", "remarks": "Medical leave" }
  ]
}
```

---

## 6. Fees & Invoicing API (`/api/fees`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fees/stats/overview` | Authenticated | Realized collections, pending balances, overdue dues. |
| `GET` | `/api/fees` | Authenticated | Invoices filtered by `classGrade`, `status`, `month`. |
| `POST` | `/api/fees` | `super_admin`, `principal` | Generates a fee invoice with tuition/transport breakdown. |
| `GET` | `/api/fees/:id` | Authenticated | In-depth invoice details with receipt metadata. |
| `PUT` | `/api/fees/:id/pay` | `super_admin`, `principal` | Records payment transaction (Cash, Card, Bank, UPI). |

---

## 7. Examination & AI Studio API (`/api/exams`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/exams/ai-generate` | `super_admin`, `principal`, `teacher` | **Gemini AI**: Generates 1–30 MCQs with answers & explanations. |
| `POST` | `/api/exams/ai/generate-paper` | `super_admin`, `principal`, `teacher` | Deep pedagogical test paper generator. |
| `POST` | `/api/exams/ai/analyze-difficulty`| `super_admin`, `principal`, `teacher` | Bloom's Taxonomy question difficulty analyzer. |
| `GET` | `/api/exams/ai/performance-analysis/:examId` | Authenticated | Statistical grade and score distribution curves. |
| `GET` | `/api/exams/ai/weak-subjects` | Authenticated | AI diagnosis of curricular subjects requiring remedial attention. |
| `GET` | `/api/exams/report-card/:studentId`| Authenticated | Generates full consolidated report card for scholar. |
| `GET` | `/api/exams` | Authenticated | Examination schedules and assessment list. |
| `POST` | `/api/exams` | `super_admin`, `principal`, `teacher` | Creates scheduled exam with question paper. |
| `GET` | `/api/exams/:id` | Authenticated | Examination questions, room numbers, and timings. |
| `DELETE`| `/api/exams/:id` | `super_admin`, `principal`, `teacher` | Removes exam record. |
| `POST` | `/api/exams/:id/submit` | `student` | Submits answers for digital examination. |
| `POST` | `/api/exams/:id/marks` | `super_admin`, `principal`, `teacher` | Enters student scores and teacher remarks. |

---

## 8. Homework & Assignments API (`/api/homework`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/homework` | Authenticated | List assignments with subject/grade filters. |
| `POST` | `/api/homework` | `super_admin`, `principal`, `teacher` | Posts assignment with due date and attachments. |
| `GET` | `/api/homework/:id` | Authenticated | Assignment details with submitted works. |
| `DELETE`| `/api/homework/:id` | `super_admin`, `principal`, `teacher` | Deletes homework assignment. |
| `POST` | `/api/homework/:id/submit` | `student` | Submits student homework (text and/or file URL). |
| `PUT` | `/api/homework/:id/grade` | `super_admin`, `principal`, `teacher` | Grades student submission with remarks. |

---

## 9. Communications & Multi-Channel Dispatch API (`/api/communication`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/communication/status` | Authenticated | Status of Nodemailer SMTP daemon and Baileys WhatsApp client. |
| `GET` | `/api/communication/stats` | Authenticated | Dispatched message volume metrics. |
| `GET` | `/api/communication/logs` | Authenticated | Historical audit trail of all outbound notices. |
| `POST` | `/api/communication/ai-reply` | Authenticated | NLP reply generator for inbound parent queries. |
| `POST` | `/api/communication/email/send`| `super_admin`, `principal`, `teacher` | Dispatches custom or template HTML email. |
| `POST` | `/api/communication/whatsapp/send`| `super_admin`, `principal`, `teacher`| Dispatches WhatsApp message to parent phone. |

---

## 10. Operations, Fleet, Payroll & Settings API

### Transit Fleet (`/api/transport`)
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transport/my-route` | Authenticated | Returns bus route linked to active student. |
| `GET` | `/api/transport` | Authenticated | All fleet routes and pickup schedules. |
| `POST` | `/api/transport` | `super_admin`, `principal` | Registers vehicle, driver, and pickup points. |
| `GET` | `/api/transport/:id` | Authenticated | Specific route details with student roster. |
| `PUT` | `/api/transport/:id` | `super_admin`, `principal` | Updates route, timing, or driver phone. |
| `DELETE`| `/api/transport/:id` | `super_admin` | Deletes transport route. |

### Payroll (`/api/payroll`)
Strictly restricted to `super_admin` and `principal`.
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/payroll/stats/overview` | Total payroll liability, paid sum, pending disbursement. |
| `GET` | `/api/payroll` | Staff salary list filtered by `salaryMonth` and `status`. |
| `POST` | `/api/payroll` | Creates/updates monthly salary with allowances & deductions. |
| `PUT` | `/api/payroll/:id/pay` | Marks salary voucher as Paid. |

### Institutional Settings (`/api/settings`)
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | Public | Returns school branding, motto, contact info, currency. |
| `PUT` | `/api/settings` | `super_admin`, `principal` | Updates school branding. |

### File Uploads (`/api/upload`)
- **Method**: `POST /api/upload`
- **Authentication**: `Bearer <token>`
- **Content-Type**: `multipart/form-data` (Field name: `file`)
- **Constraints**: 10MB limit; verified MIME types and extensions only.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "data": {
      "fileName": "assignment_report-1794560000000-123456789.pdf",
      "originalName": "assignment_report.pdf",
      "mimeType": "application/pdf",
      "size": 1048576,
      "url": "/uploads/assignment_report-1794560000000-123456789.pdf"
    }
  }
  ```
