# 08 - Backend Authentication and Authorization

This document provides a technical explanation of the backend authentication engine, password hashing, brute-force mitigation, JWT revocation, and role-based authorization.

---

## 1. Authentication Engine Overview

The backend uses a **Stateless Token-Based Authentication Architecture** coupled with **Stateful Invalidation Counters**:

```mermaid
flowchart TD
    LoginReq[POST /api/auth/login] --> AuthLimiter[authLimiter: max 15 attempts / 15 min]
    AuthLimiter --> UserLookup[User.findOne: email]
    UserLookup --> Exists{User Exists?}
    Exists -->|No| RejectAuth[401 Invalid Credentials]
    Exists -->|Yes| LockCheck{user.isLocked()?}
    LockCheck -->|Yes| LockErr[423 Account Locked for 15 min]
    LockCheck -->|No| CompareHash{bcrypt.compare: entered vs hash}
    CompareHash -->|Mismatch| IncFail[user.handleFailedLogin: failedLoginAttempts + 1]
    IncFail --> CheckAttempts{Attempts >= 5?}
    CheckAttempts -->|Yes| SetLock[lockUntil = Now + 15 min]
    CheckAttempts -->|No| RejectAuth
    CompareHash -->|Match| ResetFail[user.handleSuccessfulLogin: reset attempts, update lastLogin]
    ResetFail --> SignJWT[generateToken: Sign payload with HS256]
    SignJWT --> ReturnToken[200 OK: Send Token & User Profile]
```

---

## 2. Password Security & Hashing

- **Library**: `bcryptjs`
- **Salt Rounds**: 10 rounds (`bcrypt.genSalt(10)`)
- **Pre-Save Automation**: Hashing is handled inside `User.js` pre-save middleware. It automatically bypasses re-hashing if the password was not modified (`isModified('password') === false`).
- **Data Leakage Defense**: The `password` field in `User.js` is defined with `select: false`. Standard database queries will never return the hash unless explicitly requested with `.select('+password')`.

---

## 3. Anti-Brute-Force & Account Lockout

Implemented directly on the `User` schema:
1. **Threshold**: 5 consecutive failed login attempts (`MAX_FAILED_ATTEMPTS = 5`).
2. **Lockout Duration**: 15 minutes (`LOCK_TIME_MS = 15 * 60 * 1000`).
3. **Reset**: Any successful authentication resets `failedLoginAttempts = 0` and clears `lockUntil`.

---

## 4. Session Revocation & `tokenVersion`

Standard JWTs are stateless and cannot be cancelled before their expiration date (`JWT_EXPIRES_IN=7d`). To protect users if their password is changed or compromised:

1. Every user has a `tokenVersion` counter in MongoDB (default `0`).
2. When the user changes their password (`/api/auth/change-password`), the pre-save hook automatically increments `tokenVersion`:
   ```javascript
   this.tokenVersion = (this.tokenVersion || 0) + 1;
   ```
3. During request authentication in `authMiddleware.js`:
   ```javascript
   if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
     return res.status(401).json({
       success: false,
       message: 'Security Alert: Password was recently changed. Please log in again.'
     });
   }
   ```
   All previously issued tokens are instantly invalidated.

---

## 5. Role-Based Access Control (RBAC) Middleware

The `authorizeRoles` higher-order middleware (`backend/middleware/roleMiddleware.js`) validates that `req.user.role` matches the route's allowed roles:

```javascript
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};
```
