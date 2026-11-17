# 03 - Frontend Codebase Structure

This document provides a complete directory map of the frontend application, explaining the architectural purpose of each directory and file, what depends on it, and what developers should modify within it.

---

## 1. Directory Tree Map

```text
frontend/
├── index.html                   # HTML entry template (mounts root React element)
├── package.json                 # Frontend dependencies, scripts, and project metadata
├── package-lock.json            # Exact version lockfile for deterministic builds
├── postcss.config.js            # PostCSS plugin registration (Tailwind + Autoprefixer)
├── tailwind.config.js           # Tailwind CSS theme configuration (custom palette & fonts)
├── vite.config.js               # Vite bundler configuration & React plugin registration
├── .env.example                 # Template for frontend environment variables
│
├── public/                      # Static assets served directly at root path
│   ├── classroom-hero.jpg       # Academic classroom visual asset
│   ├── graduate-student.jpg     # High-resolution honors graduate background photo
│   ├── landing-hero-bg.jpg      # Secondary hero background asset
│   ├── modern-campus.jpg        # Campus infrastructure photograph
│   ├── premium-school-hero.jpg  # Institutional showcase photograph
│   ├── school-campus-bg.avif    # Soft campus watermark backdrop
│   └── features/                # 12 WebP / PNG feature showcase graphics
│       ├── feat-sis.png         # Student Information System preview asset
│       ├── feat-attendance.png  # Attendance tracking visual
│       ├── feat-fees.png        # Fee ledger visual
│       └── ...                  # Additional module preview assets
│
└── src/                         # Application source code
    ├── main.jsx                 # React root bootstrap file (creates DOM root)
    ├── App.jsx                  # Main routing definition, route guards & providers
    ├── index.css                # Global CSS rules, Tailwind directives, font imports
    │
    ├── components/              # Reusable UI component library
    │   ├── ChildSelector.jsx    # Multi-child dropdown selector for parent users
    │   ├── ConfirmDialog.jsx    # Destructive action confirmation modal
    │   ├── DataTable.jsx        # Data grid with search, pagination, and sorting
    │   ├── EmptyState.jsx       # Placeholder UI for empty collections
    │   ├── Loader.jsx           # Animated loading spinner & full-screen overlay
    │   ├── Modal.jsx            # Reusable popup dialog overlay with close handling
    │   ├── Navbar.jsx           # Top administrative navigation header with user info
    │   ├── PrintableReceipt.jsx # Clean invoice receipt layout for physical printing
    │   ├── Sidebar.jsx          # Collapsible navigation drawer with RBAC filtering
    │   ├── StatCard.jsx         # Summary KPI card with trend indicators
    │   └── StatusBadge.jsx      # Colored pill badge for attendance, fee, exam statuses
    │
    ├── context/                 # Global React Context providers
    │   ├── AuthContext.jsx      # Authentication, user state, JWT tokens, child selector
    │   └── SchoolContext.jsx    # Dynamic school branding, global toast notifications
    │
    ├── hooks/                   # Custom reusable React hooks
    │   └── useDebounce.js       # Input debouncing hook for search throttling
    │
    ├── layouts/                 # Application view shell layouts
    │   └── MainLayout.jsx       # Authenticated layout wrapping Sidebar, Navbar, and Outlet
    │
    ├── pages/                   # Application route views
    │   ├── AIExamGenerator.jsx  # Gemini AI question generator & exam creator
    │   ├── Attendance.jsx       # Bulk daily attendance roll-call and summary stats
    │   ├── Chat.jsx             # Real-time WebSocket chat between users
    │   ├── Communications.jsx   # Multi-channel notification center (Email & WhatsApp)
    │   ├── Dashboard.jsx        # Role-specific executive metric dashboard
    │   ├── Exams.jsx            # Exam schedule, results, and grade submission
    │   ├── Fees.jsx             # Fee management, payment processing & receipt generator
    │   ├── Homework.jsx         # Homework assignments, file uploads & grading
    │   ├── LandingPage.jsx      # Public institutional showcase and promotional website
    │   ├── Login.jsx            # Secure institutional login portal with OWASP validation
    │   ├── Notices.jsx          # Public and role-restricted announcements & events
    │   ├── Parents.jsx          # Parent directory with linked student profiles
    │   ├── Payroll.jsx          # Staff salary ledger, allowances, and payment status
    │   ├── Profile.jsx          # User self-service profile & password update
    │   ├── Reports.jsx          # Institutional analytics, charts, and Excel exports
    │   ├── Settings.jsx         # Global school branding, contact details & currency
    │   ├── Students.jsx         # Student directory, enrollment, and grade filtering
    │   ├── Teachers.jsx         # Faculty directory, subject assignments & profiles
    │   └── Transport.jsx        # Bus and van route manager with pickup points
    │
    ├── services/                # Backend communication & WebSocket services
    │   ├── api.js               # Centralized Axios client with request/response interceptors
    │   └── socket.js            # Socket.io connection manager and event listener
    │
    └── utils/                   # Shared utility functions and formatting helpers
        ├── exportExcel.js       # Client-side XLSX export generator
        ├── formatters.js        # Currency, date, time, and initials formatting helpers
        └── securityPatterns.js  # OWASP regex patterns, sanitizers, and keystroke blockers
```

---

## 2. Directory Breakdown & Modification Guidelines

### `src/components/`
- **Purpose**: Houses reusable, presentation-driven UI widgets that are shared across multiple pages.
- **Dependencies**: React, Lucide React icons, utility formatters.
- **When to Modify**: When tweaking generic UI appearance, updating table pagination logic (`DataTable.jsx`), modifying modal behavior (`Modal.jsx`), or updating print formatting (`PrintableReceipt.jsx`).

### `src/context/`
- **Purpose**: Provides global, persistent state accessible by any component in the application.
- **Dependencies**: Axios API service, Socket.io service, `localStorage`.
- **When to Modify**: When adding new user profile attributes, altering token persistence, adding new global school configuration fields, or changing toast notification timing.

### `src/pages/`
- **Purpose**: Contains the page-level views mapped directly to browser URL routes.
- **Dependencies**: `components/`, `context/`, `services/api.js`, React Router DOM.
- **When to Modify**: When updating page layouts, adding new module-specific forms, or changing data presentation.

### `src/services/`
- **Purpose**: Encapsulates all external network communication (HTTP REST APIs and WebSockets).
- **Dependencies**: Axios, Socket.io-client.
- **When to Modify**: When backend endpoints change, new API routes are created, or additional WebSocket events are introduced.

### `src/utils/`
- **Purpose**: Pure helper functions with zero UI dependencies.
- **Dependencies**: SheetJS (XLSX).
- **When to Modify**: When adding new date/currency formatting options, modifying cybersecurity input validation rules, or altering export columns.
