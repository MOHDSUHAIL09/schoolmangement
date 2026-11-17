# 11 - Backend Environment Variables

This document lists all environment variables recognized by the SchoolSphere backend in `backend/config/env.js`.

---

## 1. Environment Variable Architecture

Environment variables are loaded via `dotenv` upon server bootstrap. Defaults and type coersions are encapsulated in `backend/config/env.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_school_management_jwt_key_2026_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ...
};
```

---

## 2. Complete Environment Catalog

| Variable Name | Required | Default Fallback | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | `5000` | HTTP port on which the Express server listens. |
| `NODE_ENV` | Optional | `'development'` | `'production'` | Operational mode (`'development'`, `'production'`, `'test'`). |
| `MONGO_URI` | **Required** | `mongodb://127.0.0.1:27017/school_management` | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | MongoDB connection URI string. |
| `JWT_SECRET` | **Required in Prod** | Internal fallback | `your-secure-256-bit-hex-secret` | Secret key used to sign and verify HMAC-SHA256 JWTs. |
| `JWT_EXPIRES_IN` | Optional | `'7d'` | `'7d'` | Session lifespan duration. |
| `CLIENT_URL` | Optional | `'http://localhost:5173'` | `'https://school.example.com'` | Permitted frontend origin for CORS policies. |
| `FRONTEND_URL` | Optional | `CLIENT_URL` | `'https://school.example.com'` | Alias for `CLIENT_URL`. |
| `GEMINI_API_KEY`| Optional | `''` | `AIzaSy...` | Google Gemini API key for AI Exam Studio & pedagogical generation. |
| `SMTP_HOST` | Optional | `'smtp.gmail.com'` | `'smtp.sendgrid.net'` | SMTP host for outbound notification emails. |
| `SMTP_PORT` | Optional | `587` | `587` | SMTP port (`587` for STARTTLS, `465` for SSL). |
| `SMTP_USER` | Optional | `''` | `admissions@school.edu` | SMTP username or email address. |
| `SMTP_PASS` | Optional | `''` | `app-specific-password` | SMTP password or app password. |
| `EMAIL_FROM_NAME`| Optional| `'SchoolSphere — Premium School Management System'` | `'St. Jude Academy'` | Display name appearing in email "From" header. |
| `ENABLE_WHATSAPP`| Optional| `false` | `false` or `true` | Boolean flag toggling Baileys WhatsApp client initialization. |
| `WHATSAPP_SESSION_PATH`| Optional| `'./whatsapp_auth'` | `'./data/whatsapp'` | Directory where Baileys stores multi-device session credentials. |

---

## 3. Safe Configuration Template (`.env.example`)

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/school_management
JWT_SECRET=super_secret_school_management_jwt_key_2026_production
JWT_EXPIRES_IN=7d

# Google Gemini AI API Configuration
GEMINI_API_KEY=

# Nodemailer / SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME="SchoolSphere — Premium School Management System"

# Client URL
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# WhatsApp Baileys Configuration
ENABLE_WHATSAPP=false
WHATSAPP_SESSION_PATH=./whatsapp_auth
```

> [!CAUTION]
> Never commit active `.env` files into source control repositories. Keep `.env` listed in `.gitignore`.
