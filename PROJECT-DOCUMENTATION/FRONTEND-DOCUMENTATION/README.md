# SchoolSphere Frontend Technical Documentation

## Documentation Index & Architecture Map

Welcome to the comprehensive technical documentation for the **SchoolSphere Frontend**. This documentation suite has been constructed by inspecting the real source code, dependencies, build configurations, and component implementations of the application.

---

### Structure of This Documentation Suite

| Document | Title | Description |
| :--- | :--- | :--- |
| [01-Project-Overview.md](./01-Project-Overview.md) | **Project Overview** | Purpose, core modules, user personas (RBAC), and foundational user flows. |
| [02-Frontend-Setup.md](./02-Frontend-Setup.md) | **Setup & Installation** | Prerequisites, Node.js versions, dependencies installation, and local initialization. |
| [03-Frontend-Structure.md](./03-Frontend-Structure.md) | **Codebase Architecture & Tree** | Detailed directory breakdown explaining role, dependencies, and modification guidelines for each folder. |
| [04-Pages-and-Routing.md](./04-Pages-and-Routing.md) | **Pages & Routing Directory** | Complete map of all public and protected routes, access rules, guards, and page purposes. |
| [05-Components.md](./05-Components.md) | **Component Reference** | Detailed breakdown of core reusable UI components, props interfaces, and operational state. |
| [06-UI-and-Design-System.md](./06-UI-and-Design-System.md) | **UI & Design System** | Tailwind configuration, typography, color palette, responsive breakpoints, and glassmorphism styling. |
| [07-State-Management.md](./07-State-Management.md) | **State Management Architecture** | Context API architecture (`AuthContext`, `SchoolContext`), local state patterns, and bidirectional data flow. |
| [08-API-Integration.md](./08-API-Integration.md) | **API Integration Layer** | Axios client configuration, request/response interceptors, token injection, and endpoint map. |
| [09-Authentication-and-Authorization.md](./09-Authentication-and-Authorization.md) | **Authentication & RBAC** | Login lifecycle, JWT local storage, route guard interception, and role-based feature gating. |
| [10-Forms-and-Validation.md](./10-Forms-and-Validation.md) | **Forms & Input Sanitization** | OWASP regex patterns, real-time keystroke interception (`blockInjectionKeys`), and submit handling. |
| [11-Error-Handling.md](./11-Error-Handling.md) | **Error Handling & Feedback** | Axios rejection interceptors, global notification system (toasts), and 401 session expiration handling. |
| [12-Frontend-Environment-Variables.md](./12-Frontend-Environment-Variables.md) | **Environment Configuration** | Vite environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`), defaults, and safe configuration. |
| [13-Frontend-Run-Build-Deploy.md](./13-Frontend-Run-Build-Deploy.md) | **Execution, Build & Deployment** | Vite dev server, production bundling, rollup chunking, preview testing, and static web server hosting. |
| [14-Frontend-Troubleshooting.md](./14-Frontend-Troubleshooting.md) | **Frontend Troubleshooting** | Diagnostic workflows for port collisions, network disconnects, CORS errors, and build warnings. |
| [15-Frontend-Future-Maintenance.md](./15-Frontend-Future-Maintenance.md) | **Maintenance & Expansion Guide** | Step-by-step developer checklists for adding pages, expanding navigation, and upgrading dependencies. |

---

### Core Frontend Facts at a Glance

- **Library & Framework**: React 18.3.1 running on Vite 6.0.7 (ESM)
- **Routing Engine**: React Router DOM 6.28.0 (Declarative Routes with Role-Based Route Guards)
- **Styling Architecture**: Tailwind CSS 3.4.17 with custom Cyan/Teal institutional palette & PostCSS
- **State Layer**: React Context API (`AuthContext`, `SchoolContext`) with LocalStorage synchronization
- **HTTP Client**: Axios 1.7.9 with request/response interceptors
- **Real-Time Client**: Socket.io-client 4.8.1 with auto-reconnect and user-room pairing
- **Icons**: Lucide React 0.469.0
- **Analytics & Visualizations**: Recharts 2.15.0
- **Data Exporting**: SheetJS / XLSX 0.18.5
