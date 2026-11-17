# 14 - Backend Troubleshooting Guide

This guide details common backend runtime errors, diagnostic procedures, and verified solutions.

---

## 1. MongoDB Connection Failed (`MongooseServerSelectionError`)

### Symptom:
Server crashes upon startup with:
`MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

### Cause:
The local MongoDB service is stopped, not installed, or listening on a different port.

### Solution:
- **Windows**:
  ```powershell
  # Check MongoDB service status
  Get-Service MongoDB

  # Start MongoDB service if stopped
  Start-Service MongoDB
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo systemctl status mongod
  sudo systemctl start mongod
  ```
- **Atlas Cloud URI**: If using MongoDB Atlas, ensure your current IP address is whitelisted in MongoDB Atlas Network Access rules.

---

## 2. Port 5000 Already in Use (`EADDRINUSE`)

### Symptom:
`Error: listen EADDRINUSE: address already in use :::5000`

### Cause:
Another instance of `node server.js` or an unkilled background daemon is occupying port 5000.

### Solution:
- **Windows (PowerShell)**:
  ```powershell
  # Identify process ID
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

  # Kill process
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
  ```
- **Linux / macOS**:
  ```bash
  kill -9 $(lsof -t -i:5000)
  ```

---

## 3. Account Locked: "Account is temporarily locked. Try again in X minutes"

### Symptom:
Submitting valid login credentials returns HTTP status `423` with:
`Account is temporarily locked due to multiple failed login attempts.`

### Cause:
The account exceeded 5 consecutive failed login attempts, triggering the security lockout.

### Solution:
1. Wait for the 15-minute lockout timer to expire naturally.
2. Or reset the lockout manually via Node CLI / Mongo Shell:
   ```javascript
   // Inside mongo shell / Compass:
   db.users.updateOne(
     { email: "admin@schoolsphere.com" },
     { $set: { failedLoginAttempts: 0, lockUntil: null } }
   );
   ```

---

## 4. JWT Invalidation: "Password was recently changed. Please log in again"

### Symptom:
API requests return HTTP `401 Unauthorized` with:
`Security Alert: Password was recently changed. Please log in again with your new credentials.`

### Cause:
The user changed their password, which incremented `user.tokenVersion`. The old JWT token held by the browser contains an older `tokenVersion`.

### Solution:
Log out of the client application or navigate to `/login` to acquire a newly signed JWT reflecting the updated `tokenVersion`.

---

## 5. Google Gemini AI API Errors

### Symptom:
Exam questions generation returns standard fallback questions rather than Gemini-generated questions; server log states:
`Gemini API generation error: ... Falling back to curriculum generator.`

### Cause:
1. `GEMINI_API_KEY` is empty or invalid in `backend/.env`.
2. Machine has no internet access or is blocked by an outbound firewall.

### Solution:
Verify that a valid Gemini API key is entered in `backend/.env`:
```dotenv
GEMINI_API_KEY=AIzaSyYourValidKeyHere
```
The application will automatically switch from fallback mode to active Gemini generation without requiring any code modifications.

---

## 6. Email (SMTP) Dispatch Failing / Mock Mode Active

### Symptom:
Emails are not arriving in recipient inboxes; logs display:
`[MOCK EMAIL SENT] To: ... | Subject: ...`

### Cause:
`SMTP_USER` and `SMTP_PASS` are blank in `backend/.env`. The application runs in mock mode so that local development does not crash or spam real email addresses.

### Solution:
Configure production SMTP credentials (e.g. Gmail App Password or SendGrid API key) in `backend/.env`.
