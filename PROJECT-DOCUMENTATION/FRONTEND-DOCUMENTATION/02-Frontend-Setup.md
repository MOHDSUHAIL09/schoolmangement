# 02 - Frontend Setup & Installation Guide

This document explains how to set up, configure, and initialize the SchoolSphere frontend application from a clean clone.

---

## 1. System Requirements

- **Node.js**: `v18.0.0` or higher (verified on Node.js `v20.x` and `v24.x`)
- **NPM**: `v9.0.0` or higher
- **Web Browser**: Modern evergreen browser (Chrome 110+, Edge 110+, Firefox 115+, Safari 16+)
- **Operating System**: Windows 10/11, macOS Monterey+, or Linux (Ubuntu 20.04+)

---

## 2. Directory Navigation

The frontend source is housed in the `frontend/` directory of the monorepo:

```bash
cd SchoolManagementSystem/frontend
```

---

## 3. Dependency Installation

Execute NPM installation to pull all production and developer dependencies declared in `frontend/package.json`:

```bash
# Inside frontend/ directory
npm install
```

Alternatively, from the repository root, you can install both frontend and backend dependencies simultaneously:

```bash
# From project root
npm run install:all
```

---

## 4. Environment File Configuration

Copy the template environment configuration file to create your active `.env`:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS Bash
cp .env.example .env
```

### Environment Variables Breakdown

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000/api` | The base URL for the backend REST API endpoints. |
| `VITE_SOCKET_URL` | `http://localhost:5000` | The host URL for the Socket.io WebSocket server. |

> [!NOTE]
> If you are running both frontend and backend on the same machine during development, the default values (`http://localhost:5000/api` and `http://localhost:5000`) work out-of-the-box.

---

## 5. Starting the Development Server

Launch the Vite local development server:

```bash
npm run dev
```

Upon launch, Vite will bind to port `5173` (or the next available port) and output:

```text
  VITE v6.0.7  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open `http://localhost:5173` in your web browser.

---

## 6. Available Scripts in package.json

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | `vite build` | Compiles and minifies JavaScript and CSS into static assets inside `frontend/dist/`. |
| `npm run preview` | `vite preview` | Locally serves the production build from `dist/` to verify bundling behavior. |
