# SchoolSphere — Master Documentation System

## Welcome to the SchoolSphere Technical & Operational Documentation Suite

This comprehensive documentation suite provides complete technical, operational, and architectural documentation for the **SchoolSphere Management System**.

Every document in this collection has been created from deep inspection of the actual source code, active dependencies, database models, security layers, and API endpoints implemented in the repository.

---

## 📚 Master Documentation Index

### 1. Executive & Handover Documentation
- **[Client & Executive Guide](./CLIENT-GUIDE.md)**: Simple, professional, non-technical overview designed for school owners, deans, and non-programming stakeholders. Explains system capabilities, workflows, permissions, and institutional benefits.
- **[Senior Developer Handover](./DEVELOPER-HANDOVER.md)**: In-depth technical handover document for new software engineers joining the project. Covers architecture, critical dependencies, commands, and core design principles.
- **[Change & Maintenance Field Guide](./MAINTENANCE-GUIDE.md)**: Practical reference answering *"If the client asks to change X, where should the developer go?"* with exact file paths and line references.

---

### 2. Frontend Documentation Suite (`FRONTEND-DOCUMENTATION/`)
Comprehensive documentation of the React 18 / Vite 6 / Tailwind CSS single-page application:

| Document | Focus Area |
| :--- | :--- |
| **[01. Project Overview](./FRONTEND-DOCUMENTATION/01-Project-Overview.md)** | Purpose, personas (RBAC), and foundational user flows. |
| **[02. Setup & Installation](./FRONTEND-DOCUMENTATION/02-Frontend-Setup.md)** | Prerequisites, dependencies installation, and local initialization. |
| **[03. Codebase Structure](./FRONTEND-DOCUMENTATION/03-Frontend-Structure.md)** | Detailed directory breakdown explaining role and dependencies for each folder. |
| **[04. Pages & Routing Directory](./FRONTEND-DOCUMENTATION/04-Pages-and-Routing.md)** | Map of all public and protected routes, route guards, and views. |
| **[05. Component Reference](./FRONTEND-DOCUMENTATION/05-Components.md)** | Breakdown of core reusable UI widgets, props interfaces, and operational state. |
| **[06. UI & Design System](./FRONTEND-DOCUMENTATION/06-UI-and-Design-System.md)** | Tailwind theme, typography, color palette, and glassmorphism styling. |
| **[07. State Management](./FRONTEND-DOCUMENTATION/07-State-Management.md)** | Context API architecture (`AuthContext`, `SchoolContext`) and unidirectional data flow. |
| **[08. API Integration Layer](./FRONTEND-DOCUMENTATION/08-API-Integration.md)** | Axios client configuration, request/response interceptors, and complete API map. |
| **[09. Authentication & RBAC](./FRONTEND-DOCUMENTATION/09-Authentication-and-Authorization.md)** | Login lifecycle, JWT local storage, route guard interception, and role gating. |
| **[10. Forms & Input Sanitization](./FRONTEND-DOCUMENTATION/10-Forms-and-Validation.md)** | OWASP regex patterns, keystroke blocking (`blockInjectionKeys`), and submission flows. |
| **[11. Error Handling & Feedback](./FRONTEND-DOCUMENTATION/11-Error-Handling.md)** | Axios rejection interceptors, global notification toasts, and session expiration. |
| **[12. Environment Variables](./FRONTEND-DOCUMENTATION/12-Frontend-Environment-Variables.md)** | Vite environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`) and defaults. |
| **[13. Execution, Build & Deployment](./FRONTEND-DOCUMENTATION/13-Frontend-Run-Build-Deploy.md)** | Vite dev server, production bundling, rollup chunking, and Nginx deployment. |
| **[14. Frontend Troubleshooting](./FRONTEND-DOCUMENTATION/14-Frontend-Troubleshooting.md)** | Diagnostic workflows for port collisions, network disconnects, and CORS errors. |
| **[15. Maintenance & Expansion Guide](./FRONTEND-DOCUMENTATION/15-Frontend-Future-Maintenance.md)** | Step-by-step developer checklists for adding pages, forms, and code-splitting. |

---

### 3. Backend Documentation Suite (`BACKEND-DOCUMENTATION/`)
Comprehensive documentation of the Node.js / Express / MongoDB / Socket.io server:

| Document | Focus Area |
| :--- | :--- |
| **[01. Backend Architecture Overview](./BACKEND-DOCUMENTATION/01-Backend-Overview.md)** | Architecture, core responsibilities, request lifecycle, and data flow. |
| **[02. Setup & Installation](./BACKEND-DOCUMENTATION/02-Backend-Setup.md)** | Node environment, MongoDB installation, setup, and database seeding. |
| **[03. Codebase Structure](./BACKEND-DOCUMENTATION/03-Backend-Structure.md)** | Directory map detailing routes, controllers, models, middleware, and services. |
| **[04. Comprehensive REST API Directory](./BACKEND-DOCUMENTATION/04-API-Documentation.md)** | Complete API specification for all 50+ endpoints (HTTP methods, params, bodies, responses). |
| **[05. Routing & Dispatch Layer](./BACKEND-DOCUMENTATION/05-Routes.md)** | Express router registration, path prefixing, middleware composition, and controllers. |
| **[06. Controller Processing Layer](./BACKEND-DOCUMENTATION/06-Controllers.md)** | Method-by-method breakdown of all 13 controllers and Mongoose operations. |
| **[07. Database Schemas & Models](./BACKEND-DOCUMENTATION/07-Models-and-Database.md)** | Schema reference for all 12 Mongoose models, data types, indexes, and virtual hooks. |
| **[08. Auth & Access Control](./BACKEND-DOCUMENTATION/08-Authentication-and-Authorization.md)** | JWT generation, password hashing (bcryptjs), brute-force lockout, and `tokenVersion`. |
| **[09. Middleware Stack](./BACKEND-DOCUMENTATION/09-Middleware.md)** | JWT verification, role checks, NoSQL injection filtering, XSS sanitization, rate limiting. |
| **[10. Validation & Error Handling](./BACKEND-DOCUMENTATION/10-Validation-and-Error-Handling.md)** | Express-validator schemas, Mongoose CastError handling, and error logging. |
| **[11. Environment Configuration](./BACKEND-DOCUMENTATION/11-Environment-Variables.md)** | Catalog of all backend variables (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, SMTP). |
| **[12. Security Hardening Audit](./BACKEND-DOCUMENTATION/12-Security.md)** | Breakdown of implemented defenses (OWASP, ReDoS, XSS, NoSQL injection, Helmet, CORS). |
| **[13. Run, Test & Production Deployment](./BACKEND-DOCUMENTATION/13-Backend-Run-Build-Deploy.md)** | PM2 daemon process management, reverse proxies, and MongoDB backup scripts. |
| **[14. Backend Troubleshooting Guide](./BACKEND-DOCUMENTATION/14-Backend-Troubleshooting.md)** | Diagnostic workflows for MongoDB connection failures, port conflicts, and JWT invalidation. |
| **[15. Maintenance & Expansion Guide](./BACKEND-DOCUMENTATION/15-Backend-Future-Maintenance.md)** | Developer guides for adding new models, extending controllers, and writing tests. |

---

## 4. Verification & Consistency Summary

- **Source Code Integrity**: All existing source code has been preserved without modification or file deletion.
- **Strict Accuracy**: Zero simulated or unverified endpoints/models were created. Every documented route, parameter, field, and dependency directly reflects the actual code found in the repository.
- **Zero Exposed Secrets**: All configuration examples use safe placeholders without leaking actual passwords, tokens, or credentials.
