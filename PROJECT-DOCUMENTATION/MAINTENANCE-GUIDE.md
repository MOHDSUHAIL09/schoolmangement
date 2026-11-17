# SchoolSphere — Change & Maintenance Field Guide

This practical guide answers the question: **"If the client asks to change X, where should the developer go?"**

---

## 1. Quick Change Matrix

| If the Client Asks To... | Go to These Real Project Files & Locations | Action Required |
| :--- | :--- | :--- |
| **Change School Logo or Name** | 1. No code required: Navigate to `/settings` in browser.<br>2. Default fallback: `backend/models/Setting.js` (lines 6–16)<br>3. Navbar logo: `frontend/src/components/Navbar.jsx` (lines 30–45)<br>4. Public header: `frontend/src/pages/LandingPage.jsx` (lines 330–346) | Update `logoUrl` or `schoolName` in Settings, or replace the `GraduationCap` logo icon in Navbar/LandingPage. |
| **Change System Colors / Palette** | 1. `frontend/tailwind.config.js`<br>2. `frontend/src/index.css`<br>3. `frontend/src/pages/LandingPage.jsx`<br>4. `frontend/src/pages/Login.jsx` | Update primary cyan (`#06b6d4`), teal (`#14b8a6`), or background tint variables (`#e0f7fa`, `#f8fafc`). |
| **Add or Reorder Navigation Links** | 1. `frontend/src/components/Sidebar.jsx` (lines 31–155: `navSections`) | Add `{ to: '/route', label: '...', icon: IconName, roles: [...] }` to the appropriate section. |
| **Add a New Frontend Page** | 1. Create `frontend/src/pages/NewPage.jsx`<br>2. Add route in `frontend/src/App.jsx`<br>3. Add navigation link in `frontend/src/components/Sidebar.jsx` | Build the component, register its route with `ProtectedRoute`, and expose it in the sidebar. |
| **Edit an Existing Page Layout** | 1. `frontend/src/pages/[PageName].jsx` | Modify the corresponding page component (e.g. `Students.jsx`, `Fees.jsx`, `Dashboard.jsx`). |
| **Add a Form or Input Field** | 1. Page modal in `frontend/src/pages/[PageName].jsx`<br>2. Validation patterns in `frontend/src/utils/securityPatterns.js`<br>3. Backend schema in `backend/models/[Model].js` | Add the input in the page form, enforce validation patterns, and add the field to the Mongoose schema. |
| **Change a Backend API Endpoint** | 1. `backend/routes/[entity]Routes.js`<br>2. `backend/controllers/[entity]Controller.js`<br>3. `frontend/src/services/api.js` | Update the route path in Express router, adjust controller method, and update Axios method in `api.js`. |
| **Add a Brand New REST API** | 1. Create `backend/models/[NewModel].js`<br>2. Create `backend/controllers/[newController].js`<br>3. Create `backend/routes/[newRoutes].js`<br>4. Mount in `backend/server.js`<br>5. Add service in `frontend/src/services/api.js` | Standard full-stack endpoint addition pipeline. |
| **Modify Database Fields** | 1. `backend/models/[Model].js`<br>2. `backend/seed/seedDatabase.js` | Update schema field definition, type, and default; update database seeder if initial data is needed. |
| **Add a New User Role** | 1. `backend/models/User.js` (`role.enum` on line 31)<br>2. `backend/middleware/validationMiddleware.js` (`registerValidation` on line 39)<br>3. `frontend/src/components/Sidebar.jsx` (`roles` arrays)<br>4. `frontend/src/App.jsx` (`allowedRoles` in `ProtectedRoute`) | Register the new role string in User schema enum, validation rules, sidebar, and route guards. |
| **Change Authentication Rules** | 1. `backend/controllers/authController.js`<br>2. `backend/middleware/authMiddleware.js`<br>3. `backend/models/User.js`<br>4. `frontend/src/context/AuthContext.jsx` | Update token lifespan, lockout threshold, or verification logic. |
| **Change Outbound Email Settings** | 1. `backend/config/env.js`<br>2. `backend/services/emailService.js`<br>3. `backend/.env` | Update `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, or modify HTML email templates in `emailService.js`. |
| **Modify Dashboard Metrics & KPIs** | 1. `frontend/src/pages/Dashboard.jsx`<br>2. Backend stats endpoints: `/api/attendance/stats/overview`, `/api/fees/stats/overview`, `/api/payroll/stats/overview` | Update StatCard calculations or visual Recharts layout. |
| **Change Input Sanitization Rules** | 1. Client-side: `frontend/src/utils/securityPatterns.js`<br>2. Server-side: `backend/middleware/securityMiddleware.js` | Add or loosen regex constraints, update `blockInjectionKeys`, or adjust XSS/NoSQL stripping. |
| **Troubleshoot API Connection Error** | 1. `backend/server.js` (CORS whitelist and port)<br>2. `frontend/src/services/api.js` (`baseURL`)<br>3. `frontend/.env` (`VITE_API_URL`) | Confirm backend is running, check CORS origin matching, and verify `VITE_API_URL` port. |
