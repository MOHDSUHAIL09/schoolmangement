# 02 - Backend Setup & Installation Guide

This document explains how to set up, configure, initialize, and seed the SchoolSphere backend application.

---

## 1. Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node.js `v20.x` and `v24.x`)
- **NPM**: `v9.0.0` or higher
- **MongoDB**: MongoDB Community Server 6.0+ running locally on port `27017` or a MongoDB Atlas cloud URI.

---

## 2. Directory Navigation & Installation

Navigate to the `backend/` directory:

```bash
cd SchoolManagementSystem/backend
```

Install dependencies:

```bash
npm install
```

---

## 3. Environment Configuration

Copy the template configuration file:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

### Environment Configuration Reference (`.env`)

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/school_management
JWT_SECRET=super_secret_school_management_jwt_key_2026_production
JWT_EXPIRES_IN=7d

# Google Gemini AI API Configuration (Optional: system uses fallback curriculum if omitted)
GEMINI_API_KEY=your_gemini_api_key_here

# Nodemailer / SMTP Configuration (Optional: mock mode active if omitted)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME="SchoolSphere — Premium School Management System"

# Client Frontend URLs for CORS
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# WhatsApp Baileys Configuration (Optional: mock mode active by default)
ENABLE_WHATSAPP=false
WHATSAPP_SESSION_PATH=./whatsapp_auth
```

---

## 4. Database Seeding

The backend includes a comprehensive database seeder (`seed/seedDatabase.js`) that populates the database with realistic demo data (super admin, principal, teachers, parents, students, classes, attendance records, fees, transport routes, payroll, and notices):

```bash
npm run seed
```

Upon completion, the seeder outputs:
```text
[INFO] Database seeded successfully with SchoolSphere dataset!
[INFO] Demo Accounts:
[INFO] Super Admin : admin@schoolsphere.com     / admin123
[INFO] Principal   : principal@schoolsphere.com / principal123
[INFO] Teacher     : teacher@schoolsphere.com   / teacher123
[INFO] Parent      : parent@schoolsphere.com    / parent123
[INFO] Student     : student@schoolsphere.com   / student123
```

---

## 5. Running the Backend Server

### Development Mode (with Nodemon Auto-Reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Verifying Server Health:
Verify via terminal or browser:
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{
  "success": true,
  "message": "SchoolSphere API is operating normally.",
  "timestamp": "2026-11-13T12:00:00.000Z"
}
```

---

## 6. Running Automated Tests

The backend includes an automated test suite executed with **Vitest**, **Supertest**, and **MongoDB Memory Server**:

```bash
npm test
```
Tests verify authentication endpoints, RBAC permission checks, token versioning, password hashing, and anti-injection sanitizers.
