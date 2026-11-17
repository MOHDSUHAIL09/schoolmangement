# 15 - Frontend Future Maintenance and Development Guide

This guide provides actionable instructions for developers who need to add new features, pages, components, or update dependencies without breaking existing functionality.

---

## 1. How to Add a New Page to the Frontend

Follow this 5-step checklist to register a new module:

### Step 1: Create the Page Component
Create `frontend/src/pages/NewModule.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { DataTable } from '../components/DataTable.jsx';

export const NewModule = () => {
  const { showToast } = useSchool();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">New Module Title</h1>
          <p className="text-xs text-slate-500">Module functional description</p>
        </div>
      </div>
    </div>
  );
};
```

### Step 2: Register API Endpoints
In `frontend/src/services/api.js`, declare the service methods:
```javascript
export const newModuleAPI = {
  getAll: (params) => api.get('/new-module', { params }),
  create: (data) => api.post('/new-module', data)
};
```

### Step 3: Add the Route in `src/App.jsx`
Import your page and add a guarded route:
```jsx
import { NewModule } from './pages/NewModule.jsx';

// Inside <Routes> -> under <MainLayout>
<Route
  path="/new-module"
  element={
    <ProtectedRoute allowedRoles={['super_admin', 'principal']}>
      <NewModule />
    </ProtectedRoute>
  }
/>
```

### Step 4: Add Navigation Link in `src/components/Sidebar.jsx`
Choose an appropriate section in `navSections` and register the link:
```jsx
{
  to: '/new-module',
  label: 'New Module',
  icon: Briefcase,
  roles: ['super_admin', 'principal']
}
```

### Step 5: Test Build
Verify that imports and JSX compile cleanly:
```bash
npm run build
```

---

## 2. Code Splitting Large Libraries (Recommended Optimization)

Currently, `recharts` and `xlsx` are bundled into the primary chunk. To reduce the initial download size on slow cellular connections, use React `lazy` and `Suspense`:

```jsx
// In App.jsx
import React, { Suspense, lazy } from 'react';
const Reports = lazy(() => import('./pages/Reports.jsx'));
const AIExamGenerator = lazy(() => import('./pages/AIExamGenerator.jsx'));

// Wrap in Suspense:
<Suspense fallback={<Loader fullScreen message="Loading module..." />}>
  <Reports />
</Suspense>
```

---

## 3. Modifying Global Theme or Institutional Color

- **Base Colors**: Change primary colors in `frontend/tailwind.config.js` or replace `cyan`/`teal` Tailwind class references.
- **School Branding (Name, Logo, Phone, Address)**: Managed dynamically without code modifications via the `/settings` screen (`SchoolContext`).
- **Input Sanitization Rules**: Modify `frontend/src/utils/securityPatterns.js` if additional special characters should be permitted or restricted.
