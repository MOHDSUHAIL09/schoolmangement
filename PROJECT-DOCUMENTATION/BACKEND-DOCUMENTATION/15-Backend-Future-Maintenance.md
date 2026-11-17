# 15 - Backend Future Maintenance and Development Guide

This guide provides technical instructions for engineers who need to add new data models, endpoints, controllers, or scheduled background tasks to the SchoolSphere backend.

---

## 1. How to Add a New Model & REST API Endpoint

Follow this 5-step checklist to implement a new entity cleanly:

### Step 1: Create the Mongoose Model
Create `backend/models/Certificate.js`:
```javascript
import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    certificateType: {
      type: String,
      enum: ['Merit', 'Completion', 'Sports', 'Conduct'],
      default: 'Merit'
    }
  },
  { timestamps: true }
);

certificateSchema.index({ studentId: 1 });

export default mongoose.model('Certificate', certificateSchema);
```

### Step 2: Implement the Controller
Create `backend/controllers/certificateController.js`:
```javascript
import Certificate from '../models/Certificate.js';
import { sanitizeResponseData } from '../middleware/securityMiddleware.js';

export const getCertificates = async (req, res, next) => {
  try {
    const filter = req.query.studentId ? { studentId: req.query.studentId } : {};
    const certificates = await Certificate.find(filter).populate('studentId', 'name rollNumber');
    res.status(200).json({ success: true, data: sanitizeResponseData(certificates) });
  } catch (err) {
    next(err);
  }
};

export const issueCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.create(req.body);
    res.status(201).json({ success: true, data: sanitizeResponseData(certificate) });
  } catch (err) {
    next(err);
  }
};
```

### Step 3: Define Routes & Attach Guards
Create `backend/routes/certificateRoutes.js`:
```javascript
import express from 'express';
import { getCertificates, issueCertificate } from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCertificates)
  .post(authorizeRoles('super_admin', 'principal', 'teacher'), issueCertificate);

export default router;
```

### Step 4: Mount in `backend/server.js`
Import and register the router:
```javascript
import certificateRoutes from './routes/certificateRoutes.js';
// ...
app.use('/api/certificates', certificateRoutes);
```

### Step 5: Write an Automated Integration Test
Create `backend/tests/certificate.test.js` to verify authentication, authorization, and database persistence using Vitest.

---

## 2. Maintaining Security & Code Quality

When making modifications to the backend:
1. **Always Use `next(err)`**: Wrap asynchronous controller code in `try...catch` and pass errors to `next(err)` so `errorMiddleware.js` handles them consistently.
2. **Never Return Raw Passwords**: Always use `sanitizeResponseData(data)` or verify the schema has `select: false`.
3. **Keep Routes Guarded**: Apply `protect` and `authorizeRoles` to all non-public endpoints.
4. **Sanitize Search Queries**: When accepting user search queries for regular expressions, always pass them through `escapeRegex` from `securityMiddleware.js` to prevent ReDoS attacks.
