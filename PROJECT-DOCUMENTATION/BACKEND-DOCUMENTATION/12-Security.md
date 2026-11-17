# 12 - Backend Security Audit & Defense Architecture

This document provides a technical audit of the cybersecurity mechanisms found in the SchoolSphere backend, clearly separating what is implemented, what is not implemented, and recommended future enhancements.

---

## 1. IMPLEMENTED Security Controls

### A. Authentication & Credential Protection
- **Password Hashing**: Uses `bcryptjs` with 10 salt rounds. Plaintext passwords are never saved.
- **Hidden Password Field**: Mongoose `password` field has `select: false`. Standard queries do not expose hashes.
- **Account Lockout (Brute-Force Protection)**:
  - Account is locked for 15 minutes after 5 consecutive incorrect password submissions.
  - Rate limiting on `/api/auth/login` restricts requests to 15 per 15 minutes per IP (`authLimiter`).
- **Session Revocation via `tokenVersion`**:
  - Changing a password increments `tokenVersion` in MongoDB.
  - Any JWT with an outdated `tokenVersion` is immediately rejected by `authMiddleware.js`.
- **Password Changed Timestamp Verification**:
  - `user.changedPasswordAfter(decoded.iat)` rejects tokens issued prior to `passwordChangedAt`.

### B. Network & Request Filtering
- **HTTP Header Hardening (`helmet`)**:
  - `X-Frame-Options: DENY` (Anti-Clickjacking).
  - `X-Content-Type-Options: nosniff` (Anti-MIME sniffing).
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS).
  - `Cross-Origin-Opener-Policy: same-origin` (COOP).
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Device permission isolation).
- **Anti-Fingerprinting**: `app.disable('x-powered-by')` conceals Express technology signatures.
- **CORS Protection**: Origin-checked against `CLIENT_URL` / `FRONTEND_URL` whitelist with credentials support.
- **Rate Limiting**:
  - Global API rate limiter (`apiLimiter`): 1,000 requests per 15-minute window.
  - Auth rate limiter (`authLimiter`): 15 attempts per 15-minute window.
- **Request Body Size Clamping**: `express.json({ limit: '2mb' })` prevents memory exhaustion DoS attacks.

### C. Injection & Data Sanitization
- **NoSQL Injection Defense (`sanitizeNoSQL`)**:
  - Traverses `req.body`, `req.query`, and `req.params`.
  - Recursively strips any key that starts with `$` (MongoDB operator) or contains `.` (field traversal).
- **Stored & Reflected XSS Defense (`sanitizeXSS`)**:
  - Recursively purges `<script>`, `javascript:` protocols, `onload`, `onerror`, `onclick`, and `<iframe>` tags.
- **ReDoS (Regular Expression DoS) & Regex Injection Defense (`sanitizeRegexSearch`)**:
  - Search query strings in `req.query.search` are escaped using `escapeRegex` and truncated to a maximum of 100 characters.
- **Parameter Pollution Defense (`preventParameterPollution`)**:
  - Prevents query array poisoning by enforcing scalar strings on single-value parameters (`search`, `status`, `classGrade`, etc.).

### D. File Upload Verification (`uploadMiddleware.js`)
- **Blocklist**: Disallows dangerous executable/script extensions (`.exe`, `.bat`, `.sh`, `.js`, `.php`, `.py`, `.html`, `.svg`).
- **Allowlist**: Allows verified document and image extensions (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.docx`, `.xlsx`, `.csv`).
- **MIME-Type Matching**: Validates file MIME-type against allowed types.
- **File Size Limit**: Hard ceiling of 10MB per file.

### E. Sensitive Data Redaction
- `sanitizeResponseData` helper strips `password` and `__v` from API output before transmission.
- Central error handler (`errorMiddleware.js`) conceals internal server paths and stack traces in production.

---

## 2. NOT IMPLEMENTED (Found in Codebase)

1. **Two-Factor Authentication (2FA / MFA)**: Not implemented. System relies on single-factor password authentication.
2. **Refresh Token Rotation**: Not implemented. System uses a single 7-day JWT stored in browser `localStorage`.
3. **Database-At-Rest Encryption**: Not implemented at application level (relies on underlying MongoDB filesystem encryption).
4. **IP Geofencing**: Not implemented. Users may authenticate from any IP address.
5. **Virus / Antivirus Binary Scanning on File Uploads**: Not implemented. Multer relies on extension and MIME-type checks; files are not passed through an external ClamAV daemon.

---

## 3. RECOMMENDED FUTURE IMPROVEMENTS

1. **HttpOnly Cookies for JWT**: Migrate JWT storage from client-side `localStorage` to `HttpOnly`, `Secure`, `SameSite=Strict` browser cookies to eliminate XSS token theft vectors.
2. **Two-Factor Authentication (TOTP)**: Introduce RFC 6238 TOTP (Google Authenticator / Authy) for Super Admin and Principal roles.
3. **Automated Virus Scanning**: Integrate ClamAV daemon to scan file uploads before writing them to the permanent `uploads/` directory.
4. **Session Audit Dashboard**: Implement an active session table allowing administrators to inspect and revoke active login sessions by device.
