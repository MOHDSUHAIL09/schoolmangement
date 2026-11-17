# 10 - Backend Validation and Error Handling Architecture

This document describes how request validation is executed using `express-validator`, how Mongoose schema errors are trapped, and how errors are formatted into standard JSON responses.

---

## 1. Input Validation with `express-validator`

The application uses `express-validator` rules bundled in `backend/middleware/validationMiddleware.js`:

### Common Rule Suites:
- **`loginValidation`**:
  - `email`: Normalized and verified as standard email syntax.
  - `password`: Enforced non-empty.
- **`registerValidation`**:
  - `name`: Non-empty, trimmed.
  - `email`: Standard normalized email.
  - `password`: Minimum 6 characters.
  - `role`: Optional enum check (`super_admin`, `principal`, `teacher`, `parent`, `student`).
- **`studentValidation`**:
  - `classGrade`: Non-empty.
  - `section`: Non-empty.
- **`attendanceValidation`**:
  - `classGrade`, `section`: Mandatory.
  - `date`: Valid ISO8601 date string.
  - `records`: Array containing at least 1 record.
- **`feeValidation`**:
  - `studentId`: Mandatory ObjectId.
  - `dueDate`: Valid ISO8601 date string.
- **`examValidation`**:
  - `title`, `classGrade`, `subject`: Mandatory strings.
  - `questions`: Array containing at least 1 question.

---

## 2. Standardized Error Response Structure

Every failed API call returns a consistent JSON payload:

```json
{
  "success": false,
  "message": "Human-readable description of the error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 3. HTTP Status Code Conventions

| Status Code | Meaning in SchoolSphere Backend | When Emitted |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Successful GET, PUT, or payment recording. |
| `201 Created` | Resource created | Successful POST (enroll student, create exam, register user). |
| `400 Bad Request` | Client validation failure | Mongoose validation error, invalid ID format, disallowed file extension. |
| `401 Unauthorized` | Authentication failure | Missing token, invalid signature, expired session, password changed. |
| `403 Forbidden` | Authorization failure | User role lacks permission for the requested route; account deactivated. |
| `404 Not Found` | Route or resource missing | Endpoint does not exist; document ID not found in database. |
| `423 Locked` | Account locked | User entered 5 incorrect passwords; locked for 15 minutes. |
| `429 Too Many Requests`| Rate limit exceeded | IP exceeded 1,000 requests / 15 min or 15 login attempts / 15 min. |
| `500 Server Error` | Unhandled exception | Database connection drop, internal service crash. |

---

## 4. Centralized Error Middleware (`errorMiddleware.js`)

All errors passed to Express `next(err)` are trapped by `errorHandler`.

### Error Sanitization Logic:
1. **Mongoose CastError (Bad ObjectId)**:
   ```javascript
   if (err.name === 'CastError' && err.kind === 'ObjectId') {
     statusCode = 400;
     message = 'Resource not found or invalid identifier format.';
   }
   ```
2. **MongoDB Duplicate Key Error (Code 11000)**:
   ```javascript
   if (err.code === 11000) {
     statusCode = 400;
     const field = Object.keys(err.keyValue || {})[0] || 'field';
     message = `Duplicate value entered for ${field}. Please use another value.`;
   }
   ```
3. **Mongoose Validation Error**:
   ```javascript
   if (err.name === 'ValidationError') {
     statusCode = 400;
     message = Object.values(err.errors).map((val) => val.message).join(', ');
   }
   ```
4. **Information Disclosure Prevention**:
   Raw stack traces (`err.stack`) are logged internally to `backend/utils/logger.js`, but **never** sent to the client in production mode.
