# 08 - Frontend API Integration Layer

This document details the HTTP client architecture implemented in `frontend/src/services/api.js`, including Axios instance defaults, request/response interceptors, and the complete service API mapping.

---

## 1. Axios Instance Configuration

The central HTTP client is instantiated with the following configuration:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30-second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 2. Interceptor Architecture

### A. Request Interceptor (JWT Token Injection)
Before every outgoing request, the interceptor checks `localStorage` for `school_token`. If present, it injects the authorization header:
```javascript
config.headers.Authorization = `Bearer ${token}`;
```

### B. Response Interceptor (Data Extraction & Session Expiration)
- **Direct Data Extraction**: Automatically extracts `response.data`, eliminating redundant `.data` drilling in calling components.
- **Session Expiration Guard**: If the backend returns `401 Unauthorized` (e.g., token expired or password changed remotely) and the user is not already on `/login`:
  1. Purges `school_token` and `school_user` from `localStorage`.
  2. Redirects the browser to `/login?expired=true`.
- **Error Normalization**: Normalizes error messages from `error.response?.data?.message` into standard JavaScript Error instances.

---

## 3. Comprehensive Frontend API Service Directory

All API calls in the application are organized into modular domain objects in `src/services/api.js`:

### Authentication (`authAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `login(data)` | `/auth/login` | `{ email, password }` | Authenticates user credentials |
| `POST` | `register(data)` | `/auth/register` | `{ name, email, password, role }` | Registers user (admin only) |
| `GET` | `getMe()` | `/auth/me` | None | Re-fetches current session profile |
| `PUT` | `updateProfile(data)` | `/auth/profile` | `{ name, phone, profileImage }` | Updates self user profile |
| `PUT` | `changePassword(data)`| `/auth/change-password` | `{ currentPassword, newPassword }` | Self password change |

### Students (`studentAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/students` | `{ search, classGrade, section, page, limit }` | Fetches filtered student list |
| `GET` | `getById(id)` | `/students/:id` | None | Fetches single student record |
| `POST` | `create(data)` | `/students` | Student details object | Enrolls a new student |
| `PUT` | `update(id, data)` | `/students/:id` | Updated student fields | Updates student record |
| `DELETE`| `delete(id)` | `/students/:id` | None | Removes student record |
| `GET` | `getMyChildren()` | `/students/my-children` | None | Returns children linked to logged-in parent |
| `GET` | `getClassesMeta()` | `/students/classes-meta` | None | Returns distinct list of grades and sections |

### Attendance (`attendanceAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `markBulk(data)` | `/attendance/bulk` | `{ classGrade, section, date, records: [{ studentId, status }] }` | Records daily attendance |
| `GET` | `getByClass(params)` | `/attendance/class` | `{ classGrade, section, date }` | Fetches daily class roll-call |
| `GET` | `getStudentSummary(id)`| `/attendance/student/:id`| `{ month, year }` | Retrieves student attendance stats |
| `GET` | `getMonthly(params)` | `/attendance/monthly` | `{ classGrade, section, month, year }` | Monthly attendance grid |
| `GET` | `getReport(params)` | `/attendance/report` | `{ startDate, endDate, classGrade }` | Exportable attendance report |
| `GET` | `getOverview()` | `/attendance/stats/overview` | None | Overall institutional percentage |

### Fees (`feeAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/fees` | `{ search, classGrade, status, month }` | Fetches fee collection invoices |
| `GET` | `getById(id)` | `/fees/:id` | None | Fetches single fee invoice |
| `POST` | `create(data)` | `/fees` | Fee creation object | Generates fee invoice |
| `PUT` | `pay(id, data)` | `/fees/:id/pay` | `{ amount, paymentMethod, transactionId }` | Records payment transaction |
| `GET` | `getStats()` | `/fees/stats/overview` | None | Total realized, pending, overdue |

### Examinations & AI (`examAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/exams` | `{ classGrade, subject, status }` | Examination schedule list |
| `GET` | `getById(id)` | `/exams/:id` | None | Exam details with question papers |
| `POST` | `create(data)` | `/exams` | Exam object with questions | Creates scheduled examination |
| `POST` | `aiGenerate(data)` | `/exams/ai-generate` | `{ classGrade, subject, topic, difficulty, numberOfQuestions }` | Generates MCQs via Gemini AI |
| `POST` | `generatePaper(data)` | `/exams/ai/generate-paper` | Full curriculum paper prompt | Deep AI examination synthesizer |
| `POST` | `analyzeDifficulty(data)`| `/exams/ai/analyze-difficulty`| Questions array | AI Bloom's Taxonomy analyzer |
| `GET` | `getPerformanceAnalysis(id)`| `/exams/ai/performance-analysis/:id` | None | AI score distribution analysis |
| `GET` | `getWeakSubjects(params)` | `/exams/ai/weak-subjects` | `{ classGrade, section }` | AI student weakness diagnostic |
| `POST` | `submit(id, data)` | `/exams/:id/submit` | Student answer selections | Student test submission |
| `POST` | `recordMarks(id, data)` | `/exams/:id/marks` | Marks and remarks | Faculty marks recording |
| `GET` | `getReportCard(studentId)` | `/exams/report-card/:studentId` | None | Aggregated student report card |
| `DELETE`| `delete(id)` | `/exams/:id` | None | Deletes exam record |

### Homework (`homeworkAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/homework` | `{ classGrade, section, subject }` | Fetches assignments |
| `GET` | `getById(id)` | `/homework/:id` | None | Assignment details + submissions |
| `POST` | `create(data)` | `/homework` | Homework creation object | Assigns new homework |
| `POST` | `submit(id, data)` | `/homework/:id/submit` | `{ textSubmission, fileUrl }` | Student homework submission |
| `PUT` | `grade(id, data)` | `/homework/:id/grade` | `{ studentId, marks, teacherRemarks }` | Records teacher grade |
| `DELETE`| `delete(id)` | `/homework/:id` | None | Deletes homework assignment |

### Real-Time Chat (`chatAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getConversations()` | `/chat/conversations` | None | Returns active user dialogs |
| `GET` | `getMessages(receiverId)` | `/chat/messages/:receiverId` | None | Message history with user |
| `POST` | `sendMessage(data)` | `/chat/messages` | `{ receiverId, message }` | Dispatches message |

### Transport (`transportAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/transport` | `{ search }` | Bus/van route directory |
| `GET` | `getById(id)` | `/transport/:id` | None | Route details and assigned students |
| `POST` | `create(data)` | `/transport` | Route data object | Registers new transit route |
| `PUT` | `update(id, data)` | `/transport/:id` | Updated route fields | Modifies vehicle/driver details |
| `DELETE`| `delete(id)` | `/transport/:id` | None | Deletes transit route |

### Payroll (`payrollAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/payroll` | `{ salaryMonth, status }` | Staff salary disbursement roster |
| `POST` | `createOrUpdate(data)`| `/payroll` | `{ employeeId, salaryMonth, baseSalary, allowances, deductions }` | Computes & records payroll |
| `PUT` | `pay(id)` | `/payroll/:id/pay` | None | Marks salary as Paid |
| `GET` | `getStats()` | `/payroll/stats/overview` | None | Total payroll liability summary |

### Bulletins & Notices (`noticeAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `getAll(params)` | `/notices` | `{ type, targetRole }` | Fetches notices, events, galleries |
| `GET` | `getById(id)` | `/notices/:id` | None | Fetches single circular |
| `POST` | `create(data)` | `/notices` | Notice object | Posts new circular/event |
| `PUT` | `update(id, data)` | `/notices/:id` | Updated fields | Edits notice |
| `DELETE`| `delete(id)` | `/notices/:id` | None | Removes notice |

### Communications & AI (`communicationAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `sendEmail(data)` | `/communication/email/send` | `{ to, subject, message }` | Dispatches manual email |
| `POST` | `sendWhatsApp(data)` | `/communication/whatsapp/send` | `{ phone, message }` | Dispatches WhatsApp text |
| `POST` | `getAIReply(data)` | `/communication/ai-reply` | `{ rawMessage, senderUser, historyContext }` | Generates AI assistant reply |
| `GET` | `getLogs(params)` | `/communication/logs` | `{ channel, page, limit }` | Audit logs of sent alerts |
| `GET` | `getStatus()` | `/communication/status` | None | Real-time Email & WhatsApp daemon status |
| `GET` | `getStats()` | `/communication/stats` | None | Message volume metrics |

### System Settings (`settingAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `get()` | `/settings` | None | Fetches institutional branding |
| `PUT` | `update(data)` | `/settings` | Branding fields | Updates school branding |

### File Uploads (`uploadAPI`)
| Method | Function | Endpoint | Payload / Query | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `uploadFile(file)` | `/upload` | `multipart/form-data` | Uploads avatar or document |
