# SchoolSphere Backend Technical Documentation

## Documentation Index & Architecture Map

Welcome to the comprehensive technical documentation for the **SchoolSphere Backend**. This documentation suite has been constructed by analyzing the actual Node.js runtime code, Express routes, Mongoose models, authentication middleware, security layers, Socket.io handlers, and external services.

---

### Structure of This Documentation Suite

| Document | Title | Description |
| :--- | :--- | :--- |
| [01-Backend-Overview.md](./01-Backend-Overview.md) | **Backend Architecture Overview** | Architectural design, core responsibilities, request lifecycle, and data flow. |
| [02-Backend-Setup.md](./02-Backend-Setup.md) | **Setup & Installation** | Node environment, MongoDB installation, dependency setup, and database seeding. |
| [03-Backend-Structure.md](./03-Backend-Structure.md) | **Codebase Architecture & Tree** | Comprehensive directory map detailing routes, controllers, models, middleware, and services. |
| [04-API-Documentation.md](./04-API-Documentation.md) | **Comprehensive REST API Directory** | Complete API specification for all 50+ endpoints (HTTP methods, params, request body, responses, and errors). |
| [05-Routes.md](./05-Routes.md) | **Routing & Dispatch Layer** | Express router registration, path prefixing, middleware composition, and controller binding. |
| [06-Controllers.md](./06-Controllers.md) | **Controller Processing Layer** | Method-by-method breakdown of all 13 controllers, query processing, and Mongoose operations. |
| [07-Models-and-Database.md](./07-Models-and-Database.md) | **Database Schemas & Models** | Complete schema reference for all 12 Mongoose models, data types, indexes, and virtual hooks. |
| [08-Authentication-and-Authorization.md](./08-Authentication-and-Authorization.md) | **Auth & Access Control** | JWT generation, password hashing (bcryptjs), brute-force lockout, session invalidation, and RBAC roles. |
| [09-Middleware.md](./09-Middleware.md) | **Middleware Stack** | Complete reference for JWT verification, role checks, NoSQL injection filtering, XSS sanitization, rate limiting, and uploads. |
| [10-Validation-and-Error-Handling.md](./10-Validation-and-Error-Handling.md) | **Validation & Error Handling** | Express-validator schemas, Mongoose CastError/duplicate key handling, and centralized error logging. |
| [11-Environment-Variables.md](./11-Environment-Variables.md) | **Environment Configuration** | Detailed catalog of all backend variables (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, SMTP, WhatsApp). |
| [12-Security.md](./12-Security.md) | **Security Hardening Audit** | Comprehensive breakdown of implemented defenses (OWASP, ReDoS, XSS, NoSQL injection, Helmet, CORS). |
| [13-Backend-Run-Build-Deploy.md](./13-Backend-Run-Build-Deploy.md) | **Run, Test & Production Deployment** | PM2 daemon process management, systemd service setup, reverse proxies, and MongoDB backup scripts. |
| [14-Backend-Troubleshooting.md](./14-Backend-Troubleshooting.md) | **Backend Troubleshooting Guide** | Diagnostic workflows for MongoDB connection failures, port conflicts, JWT invalidation, and SMTP errors. |
| [15-Backend-Future-Maintenance.md](./15-Backend-Future-Maintenance.md) | **Maintenance & Expansion Guide** | Developer guides for adding new models, extending controllers, registering endpoints, and writing tests. |

---

### Core Backend Facts at a Glance

- **Runtime & Module Type**: Node.js (ECMAScript Modules `"type": "module"`)
- **Web Framework**: Express 4.21.2
- **Database**: MongoDB 6.0+ via Mongoose 8.10.1 (Strict Query Mode, Timestamped Schemas)
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken` 9.0.2) + `bcryptjs` 2.4.3
- **Real-Time Layer**: Socket.io 4.8.1 with user-specific room namespaces
- **Generative AI**: Google Generative AI SDK (`@google/generative-ai` 0.21.0 - Gemini 1.5 Flash)
- **Multi-Channel Notifications**:
  - Email: `nodemailer` 6.10.0 (Custom SMTP / Gmail with HTML responsive templates)
  - WhatsApp: `@whiskeysockets/baileys` 6.7.18 (Headless WhatsApp Multi-Device protocol)
- **File Uploads**: `multer` 1.4.5-lts.1 with MIME-type and extension security filters
- **Testing Engine**: Vitest 3.0.0 + Supertest 7.0.0 + MongoDB Memory Server 10.1.4
