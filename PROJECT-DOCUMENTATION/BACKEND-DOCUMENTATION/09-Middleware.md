# 09 - Backend Middleware Stack

This document details every middleware component in `backend/middleware/`, explaining its purpose, where it is mounted, what conditions it evaluates, and failure behaviors.

---

## 1. Middleware Execution Hierarchy

```text
HTTP Request
 │
 ├── 1. helmet(...)                      [server.js - Global security headers]
 ├── 2. enterpriseSecurityHeaders        [server.js - Permissions-Policy, COOP, nosniff]
 ├── 3. securityAuditLogger              [server.js - Logs 401, 403, 429, 423 events]
 ├── 4. cors(...)                        [server.js - Allowed origins whitelist]
 ├── 5. apiLimiter / authLimiter         [server.js / authRoutes.js - Rate limiters]
 ├── 6. express.json({ limit: '2mb' })   [server.js - Body parsing with DoS limits]
 ├── 7. sanitizeNoSQL                    [server.js - Strips $ and . keys from body/params/query]
 ├── 8. sanitizeXSS                      [server.js - Strips script tags & malicious protocols]
 ├── 9. preventParameterPollution        [server.js - Flattens query array pollution]
 ├── 10. sanitizeRegexSearch             [server.js - Escapes ReDoS special characters in ?search=]
 │
 ├── [ ROUTE SPECIFIC PIPELINE ]
 ├── 11. protect                         [authMiddleware.js - JWT verification & user lookup]
 ├── 12. authorizeRoles(...)             [roleMiddleware.js - RBAC role checks]
 ├── 13. validate(...)                   [validationMiddleware.js - express-validator checks]
 ├── 14. upload.single(...)              [uploadMiddleware.js - Multer file validation]
 │
 └── [ ERROR PIPELINE ]
 ├── 15. notFound                        [errorMiddleware.js - 404 handler]
 └── 16. errorHandler                    [errorMiddleware.js - Centralized error catch]
```

---

## 2. Detailed Middleware Specifications

### A. `protect` (`authMiddleware.js`)
- **Purpose**: Verifies incoming Bearer JWT tokens and attaches authenticated `req.user`.
- **Checks**:
  1. Checks `Authorization` header format (`Bearer <token>`).
  2. Verifies JWT signature using `ENV.JWT_SECRET` and algorithm `HS256`.
  3. Queries database to confirm user exists.
  4. Confirms `user.isActive === true`.
  5. Compares `decoded.tokenVersion` against `user.tokenVersion`.
  6. Compares token issue timestamp (`iat`) against `user.passwordChangedAt`.
- **Failures**: Returns `401 Unauthorized` or `403 Forbidden` with descriptive messages.

---

### B. `authorizeRoles(...roles)` (`roleMiddleware.js`)
- **Purpose**: Restricts endpoint execution to specific roles (`'super_admin'`, `'principal'`, `'teacher'`, `'parent'`, `'student'`).
- **Checks**: Verifies that `req.user.role` is included in the allowed roles list.
- **Failures**: Returns `403 Forbidden`.

---

### C. `sanitizeNoSQL` (`securityMiddleware.js`)
- **Purpose**: Protects against NoSQL query selector injections (e.g., `{ "$gt": "" }`).
- **Checks**: Recursively traverses `req.body`, `req.query`, and `req.params`. Strips any key that starts with `$` or contains `.`.
- **Failures**: Silently purges malicious keys before reaching controllers.

---

### D. `sanitizeXSS` (`securityMiddleware.js`)
- **Purpose**: Eliminates stored and reflected Cross-Site Scripting (XSS) payloads.
- **Checks**: Recursively strips `<script>...</script>`, `javascript:...`, `onload=...`, `onerror=...`, `onclick=...`, and `<iframe>...</iframe>`.

---

### E. `upload` (`uploadMiddleware.js`)
- **Purpose**: Handles multipart file uploads (documents, photos, avatars) with strict type validation.
- **Storage**: Disk storage under `uploads/` with randomized timestamped filenames (`cleanBase-[timestamp]-[rand].ext`).
- **Size Limit**: 10 Megabytes (`10 * 1024 * 1024`).
- **Blocked Extensions**: `.exe`, `.bat`, `.sh`, `.js`, `.vbs`, `.msi`, `.cmd`, `.php`, `.py`, `.jsp`, `.html`, `.svg`, `.hta`.
- **Allowed Extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.doc`, `.docx`, `.txt`, `.xlsx`, `.csv`.
- **Failures**: Returns `400 Bad Request` with institutional security alert.

---

### F. `errorHandler` (`errorMiddleware.js`)
- **Purpose**: Centralized application exception handler.
- **Transformations**:
  - `CastError` (Invalid Mongo ObjectId) -> Converted to clean `400 Bad Request`.
  - Error code `11000` (Duplicate Key Error) -> Converted to `"Duplicate value entered for [field]"`.
  - Mongoose `ValidationError` -> Formatted into readable comma-delimited string of invalid fields.
  - Hides internal stack traces in production (`debugHint` only emitted in development).
