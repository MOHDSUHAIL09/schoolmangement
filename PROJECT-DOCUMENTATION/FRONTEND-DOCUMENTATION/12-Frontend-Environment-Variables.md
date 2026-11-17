# 12 - Frontend Environment Variables

This document catalogs all environment variables used by the SchoolSphere frontend application.

---

## 1. Environment Variable Architecture

The frontend is bundled using **Vite**. In Vite:
- Only environment variables prefixed with **`VITE_`** are exposed to client-side code via `import.meta.env`.
- Any variable without the `VITE_` prefix is strictly stripped at build time for security.
- Environment variables are baked into static JavaScript files during the `npm run build` process.

---

## 2. Variable Catalog

| Variable Name | Required | Default Fallback | Example Value | Where Used | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | `/api` | `http://localhost:5000/api` | `frontend/src/services/api.js` | Base URL for all REST API endpoints. In development, defaults to backend port 5000. In production, can use relative `/api` behind a reverse proxy (e.g. Nginx). |
| `VITE_SOCKET_URL` | Optional | `window.location.origin` | `http://localhost:5000` | `frontend/src/services/socket.js` | Target server URL for the Socket.io WebSocket connection. |

---

## 3. Configuration Template (`.env.example`)

```dotenv
# Backend REST API Base Endpoint
VITE_API_URL=http://localhost:5000/api

# Realtime WebSocket Socket.io Endpoint
VITE_SOCKET_URL=http://localhost:5000
```

---

## 4. Production vs Development Values

### Local Development Setup:
```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Production Setup (Single Domain / Reverse Proxy):
When hosting frontend and backend under the same domain (e.g., `https://school.example.com`):
```dotenv
VITE_API_URL=/api
VITE_SOCKET_URL=https://school.example.com
```

> [!CAUTION]
> Never place database credentials, JWT secrets, SMTP passwords, or API secret keys in frontend environment files. Frontend files are fully visible in the client browser's network and source tabs.
