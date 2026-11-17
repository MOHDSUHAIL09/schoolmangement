# 13 - Frontend Run, Build and Deployment Guide

This document contains exact instructions for installing, running, compiling, testing, and deploying the SchoolSphere frontend application.

---

## 1. Local Development

### Installation:
```bash
cd frontend
npm install
```

### Starting Vite Dev Server:
```bash
npm run dev
```
- **Port**: `5173` (e.g. `http://localhost:5173`)
- **Features**: Instant Hot Module Replacement (HMR), fast cold start, module-level compilation on demand.

---

## 2. Production Build

To compile and optimize the application for production deployment:

```bash
npm run build
```

### Build Pipeline:
1. **Tool**: Vite + Rollup + esbuild
2. **Transforms**: Transpiles JSX and modern ECMAScript to standard browser-compatible JavaScript.
3. **CSS Minification**: Purges unused Tailwind utility classes using PostCSS / Autoprefixer.
4. **Asset Output**: Writes production-ready static assets to `frontend/dist/`.

### Verified Build Artifacts:
```text
dist/
├── index.html                   # Minified HTML entrypoint (approx 1.1 KB)
└── assets/
    ├── index-[hash].css         # Minified bundled stylesheet (approx 72 KB gzip: 11 KB)
    └── index-[hash].js          # Minified application script bundle
```

---

## 3. Testing Production Build Locally

Before deploying to a remote server, preview the production build locally:

```bash
npm run preview
```
This spawns a lightweight local HTTP server serving directly from `frontend/dist/` (typically on port `4173`).

---

## 4. Production Deployment Methods

### Option A: Serving via Nginx Reverse Proxy (Recommended)

Sample Nginx server block:

```nginx
server {
    listen 80;
    server_name school.example.com;

    root /var/www/schoolsphere/frontend/dist;
    index index.html;

    # Handle client-side routing (React Router SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API requests to backend Node server
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket requests for Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Option B: Cloud Storage & CDN (Vercel / Netlify / Cloudflare Pages / AWS S3)
1. Build Command: `npm run build`
2. Output Directory: `dist`
3. Single Page Application (SPA) Rewrite: Route all non-file paths (`/*`) to `/index.html`.
