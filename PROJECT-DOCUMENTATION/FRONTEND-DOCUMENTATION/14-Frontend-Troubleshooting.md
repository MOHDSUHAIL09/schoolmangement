# 14 - Frontend Troubleshooting Guide

This guide addresses real-world frontend issues, runtime symptoms, and verified remediation steps.

---

## 1. Port 5173 Already in Use

### Symptom:
Running `npm run dev` assigns port `5174` or fails with `Error: listen EADDRINUSE: address already in use :::5173`.

### Cause:
Another instance of Vite or a zombie Node.js process is already occupying port 5173.

### Solution:
- **Windows (PowerShell)**:
  ```powershell
  # Find PID occupying port 5173
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess

  # Terminate the process
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
  ```
- **Linux / macOS**:
  ```bash
  kill -9 $(lsof -t -i:5173)
  ```

---

## 2. API Network Error / "Network Error" on Submit

### Symptom:
Forms show red error banner or toast: *"Network Error"* or *"AxiosError: Network Error"*.

### Cause:
1. Backend Node.js server is not running on port `5000`.
2. `VITE_API_URL` environment variable is pointing to an incorrect host or port.

### Solution:
1. Confirm backend server is running:
   ```bash
   curl -I http://localhost:5000/api/health
   ```
   Should respond with HTTP `200 OK` and `{ "success": true }`.
2. Check `frontend/.env` file:
   ```dotenv
   VITE_API_URL=http://localhost:5000/api
   ```
3. Restart Vite dev server (`npm run dev`) after modifying `.env`.

---

### Symptom:
Browser console displays:
`Access to XMLHttpRequest at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`.

### Cause:
The backend CORS whitelist in `backend/server.js` does not include the origin URL from which you are accessing the frontend (e.g., using IP `192.168.x.x` instead of `localhost`).

### Solution:
Verify that `CLIENT_URL` and `FRONTEND_URL` in `backend/.env` match the frontend URL:
```dotenv
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

---

## 4. Blank White Screen on Page Refresh

### Symptom:
Navigating directly to a deep route (e.g. `http://localhost:5173/dashboard` or `http://localhost:5173/students`) produces a blank screen or 404 in production.

### Cause:
Web server (Nginx/Apache/S3) is attempting to look up `/dashboard` as a physical file on disk rather than serving `index.html`.

### Solution:
Configure Single Page Application (SPA) URL rewriting so all requests fallback to `index.html`:
- **Nginx**: `try_files $uri $uri/ /index.html;`
- **Vite dev server**: Handled automatically.

---

## 5. Infinite Redirect Loop Between `/login` and `/dashboard`

### Symptom:
Browser URL rapidly flickers between `/login` and `/dashboard`.

### Cause:
Corrupted or partial `school_user` or `school_token` object in browser `localStorage`.

### Solution:
1. Open Chrome DevTools (`F12`) -> **Application** tab -> **Local Storage**.
2. Clear `school_token` and `school_user`.
3. Refresh the browser and log in with fresh credentials.

---

## 6. Build Warning: "Some chunks are larger than 500 kB"

### Symptom:
During `npm run build`, Rollup prints:
`(!) Some chunks are larger than 500 kB after minification.`

### Cause:
Large analytical and spreadsheet libraries (`recharts`, `xlsx`) bundled in the main chunk.

### Status:
This is a standard informational optimization notice, not a fatal build error. The build succeeds cleanly (`✓ built in ~15s`). Dynamic imports (`import()`) can be introduced in future maintenance to code-split these vendor libraries if sub-second first-paint optimizations are required.
