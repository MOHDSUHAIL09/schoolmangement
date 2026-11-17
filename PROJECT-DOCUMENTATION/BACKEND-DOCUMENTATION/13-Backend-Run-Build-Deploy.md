# 13 - Backend Run, Test and Production Deployment Guide

This document contains exact operational procedures for running, testing, daemonizing, and deploying the SchoolSphere backend in production environments.

---

## 1. Local Development Execution

### Install Dependencies:
```bash
cd backend
npm install
```

### Start Server in Development Mode:
```bash
npm run dev
```
- Uses `nodemon` to watch for file changes in `controllers/`, `routes/`, `models/`, and `services/`.
- Auto-restarts server upon file save.

### Start Server in Standard Mode:
```bash
npm start
```
- Executes `node server.js` directly using native Node.js runtime.

---

## 2. Automated Test Execution

The backend contains integration and unit tests covering authentication, database seeding, RBAC guards, and security sanitizers:

```bash
npm test
```
- **Harness**: Vitest + Supertest + In-Memory MongoDB Server (`mongodb-memory-server`).
- Can run without requiring a live external MongoDB daemon.

---

## 3. Production Deployment with PM2 (Recommended)

In production Linux environments (Ubuntu 22.04 LTS / Debian 12), run the backend under **PM2 Process Manager** for high availability, auto-restart on memory leaks, and log rotation:

### Step 1: Install PM2 Globally
```bash
npm install -g pm2
```

### Step 2: Create PM2 Ecosystem Configuration (`ecosystem.config.cjs`)
Create this file in the `backend/` directory:
```javascript
module.exports = {
  apps: [
    {
      name: 'schoolsphere-api',
      script: 'server.js',
      instances: 'max',       // Cluster mode utilizing all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      time: true
    }
  ]
};
```

### Step 3: Launch PM2 Cluster
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 4. Production Deployment with Docker (Optional Alternative)

Sample `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

USER node

CMD ["node", "server.js"]
```

---

## 5. MongoDB Database Backup Routine

For institutional data integrity, execute automated daily database dumps using `mongodump`:

```bash
# Automated Daily MongoDB Backup
mongodump --uri="mongodb://127.0.0.1:27017/school_management" --archive="/backups/school_$(date +%Y%m%d).gz" --gzip
```

To restore from a backup:
```bash
mongorestore --uri="mongodb://127.0.0.1:27017/school_management" --archive="/backups/school_20261113.gz" --gzip --drop
```
