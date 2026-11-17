# SchoolSphere — Senior Developer Handover Document

## 1. Architectural Overview & Monorepo Layout

SchoolSphere is structured as a full-stack monorepo with clear separation of concerns between client and server:

```text
SchoolManagementSystem/
├── backend/                     # Node.js + Express 4.21.2 + MongoDB / Mongoose 8.10.1 (ESM)
├── frontend/                    # React 18.3.1 + Vite 6.0.7 + Tailwind CSS 3.4.17
├── uploads/                     # Uploaded documents and media attachments
├── package.json                 # Monorepo orchestration scripts
└── PROJECT-DOCUMENTATION/       # Complete technical documentation suite
```

---

## 2. Quick Setup & Initialization

### Monorepo One-Step Dependency Installation:
```bash
npm run install:all
```
*(Installs dependencies for both `backend/` and `frontend/`).*

### Launching Full Development Stack:
Open two terminal windows:
```bash
# Terminal 1: Backend API & WebSocket Server
npm run dev:backend      # Runs nodemon server.js on port 5000

# Terminal 2: Frontend Vite Development Server
npm run dev:frontend     # Runs vite on port 5173
```

### Initial Database Seeding:
```bash
npm run seed             # Executes backend/seed/seedDatabase.js
```

---

## 3. Important Monorepo Commands

| Command | Working Directory | Action |
| :--- | :--- | :--- |
| `npm run install:all` | Monorepo Root | Installs dependencies across both frontend and backend. |
| `npm run dev:backend` | Monorepo Root | Launches backend with auto-reload (nodemon) on port 5000. |
| `npm run dev:frontend`| Monorepo Root | Launches frontend with HMR (vite) on port 5173. |
| `npm run seed` | Monorepo Root | Clears and seeds database with comprehensive demo dataset. |
| `npm run test` | Monorepo Root | Executes Vitest automated test suite against backend. |
| `npm run build` | Monorepo Root | Compiles production assets into `frontend/dist/`. |
| `npm start` | Monorepo Root | Runs production backend `node backend/server.js`. |

---

## 4. Key Architectural Files You Must Understand

### Backend Critical Files:
1. `backend/server.js`: Central Express app, Helmet, CORS, body parsers, rate limiters, anti-injection middleware, and route mounting.
2. `backend/config/env.js`: Central environment variable parser and fallback defaults.
3. `backend/config/db.js`: Mongoose connection with strict query mode.
4. `backend/middleware/authMiddleware.js`: JWT token verification, user lookup, session invalidation via `tokenVersion`.
5. `backend/middleware/securityMiddleware.js`: NoSQL injection defense, XSS strip filter, ReDoS escaping, rate limiters.
6. `backend/models/User.js`: User schema with bcrypt password hashing pre-save hook, lockout tracking, and `tokenVersion`.
7. `backend/models/Fee.js`: Fee schema with pre-save automated total and remaining balance calculations.
8. `backend/services/aiExamService.js`: Google Gemini 1.5 Flash question generator with curriculum fallback.

### Frontend Critical Files:
1. `frontend/src/App.jsx`: Complete route tree, `RootRoute` logic, and `ProtectedRoute` role guards.
2. `frontend/src/context/AuthContext.jsx`: Persistent authentication state, `localStorage` synchronization, multi-child parent state.
3. `frontend/src/context/SchoolContext.jsx`: School branding settings and global toast notifications.
4. `frontend/src/services/api.js`: Axios instance, request token injection, 401 session expiration handling, domain API mapping.
5. `frontend/src/components/Sidebar.jsx`: RBAC navigation menu with role-based link filtering.
6. `frontend/src/utils/securityPatterns.js`: Client-side OWASP regex validation, `blockInjectionKeys`, and `sanitizeInputText`.

---

## 5. Development Recipes for Common Tasks

### How to Add a New Frontend Page:
1. Create `frontend/src/pages/YourPage.jsx`.
2. Add API methods in `frontend/src/services/api.js`.
3. Register the route in `frontend/src/App.jsx` wrapped in `<ProtectedRoute allowedRoles={[...]}>`.
4. Add the navigation item in `frontend/src/components/Sidebar.jsx` with allowed roles.
5. Run `npm run build` to verify there are no compilation errors.

### How to Add a New Backend REST Endpoint:
1. If adding a new entity, create the Mongoose model in `backend/models/YourModel.js`.
2. Create the controller in `backend/controllers/yourController.js`.
3. Create the route file in `backend/routes/yourRoutes.js` and wrap routes with `protect` and `authorizeRoles(...)`.
4. Mount the route file in `backend/server.js` (`app.use('/api/your-entity', yourRoutes)`).
5. Add an integration test in `backend/tests/`.

---

## 6. Where Developers Should NOT Make Changes Without Understanding Dependencies

> [!WARNING]
> Proceed with extreme caution before altering the following core systems:

1. **`User.tokenVersion` in `backend/models/User.js` & `backend/middleware/authMiddleware.js`**:
   - `tokenVersion` is the cryptographic counter that invalidates active JWTs when a user changes their password. Removing or bypassing this check will leave the system vulnerable to session hijacking.
2. **`Fee.pre('save')` in `backend/models/Fee.js`**:
   - Total amount and remaining balance are automatically calculated in the pre-save hook. Do not attempt to manually override `remainingAmount` or `status` in frontend payloads, as the hook recalculates them from raw ledger entries (`tuition`, `game`, `transport`, `exam`, `paidAmount`).
3. **Axios Response Interceptor in `frontend/src/services/api.js`**:
   - The interceptor automatically unwraps `response.data`. If you add `.data` in calling components, you will introduce `undefined` errors.
4. **`blockInjectionKeys` in `frontend/src/utils/securityPatterns.js`**:
   - This function intercepts keyboard events (`<`, `>`, `;`, `'`, `"`, `$`). Modifying it carelessly could break legitimate text input in rich description areas.
