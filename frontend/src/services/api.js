import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept Request: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('school_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept Response: Handle Token Expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('school_token');
      localStorage.removeItem('school_user');
      window.location.href = '/login?expired=true';
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// API Service Endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getTeachers: () => api.get('/users/teachers'),
  getParents: () => api.get('/users/parents')
};

export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getMyChildren: () => api.get('/students/my-children'),
  getClassesMeta: () => api.get('/students/classes-meta')
};

export const attendanceAPI = {
  markBulk: (data) => api.post('/attendance/bulk', data),
  getByClass: (params) => api.get('/attendance/class', { params }),
  getStudentSummary: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  getMonthly: (params) => api.get('/attendance/monthly', { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  getOverview: () => api.get('/attendance/stats/overview')
};

export const feeAPI = {
  getAll: (params) => api.get('/fees', { params }),
  getById: (id) => api.get(`/fees/${id}`),
  create: (data) => api.post('/fees', data),
  pay: (id, data) => api.put(`/fees/${id}/pay`, data),
  getStats: () => api.get('/fees/stats/overview')
};

export const homeworkAPI = {
  getAll: (params) => api.get('/homework', { params }),
  getById: (id) => api.get(`/homework/${id}`),
  create: (data) => api.post('/homework', data),
  submit: (id, data) => api.post(`/homework/${id}/submit`, data),
  grade: (id, data) => api.put(`/homework/${id}/grade`, data),
  delete: (id) => api.delete(`/homework/${id}`)
};

export const examAPI = {
  getAll: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  aiGenerate: (data) => api.post('/exams/ai-generate', data),
  generatePaper: (data) => api.post('/exams/ai/generate-paper', data),
  analyzeDifficulty: (data) => api.post('/exams/ai/analyze-difficulty', data),
  getPerformanceAnalysis: (examId) => api.get(`/exams/ai/performance-analysis/${examId}`),
  getWeakSubjects: (params) => api.get('/exams/ai/weak-subjects', { params }),
  submit: (id, data) => api.post(`/exams/${id}/submit`, data),
  recordMarks: (id, data) => api.post(`/exams/${id}/marks`, data),
  getReportCard: (studentId) => api.get(`/exams/report-card/${studentId}`),
  delete: (id) => api.delete(`/exams/${id}`)
};

export const transportAPI = {
  getAll: (params) => api.get('/transport', { params }),
  getById: (id) => api.get(`/transport/${id}`),
  create: (data) => api.post('/transport', data),
  update: (id, data) => api.put(`/transport/${id}`, data),
  delete: (id) => api.delete(`/transport/${id}`)
};

export const payrollAPI = {
  getAll: (params) => api.get('/payroll', { params }),
  createOrUpdate: (data) => api.post('/payroll', data),
  pay: (id) => api.put(`/payroll/${id}/pay`),
  getStats: () => api.get('/payroll/stats/overview')
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (receiverId) => api.get(`/chat/messages/${receiverId}`),
  sendMessage: (data) => api.post('/chat/messages', data)
};

export const noticeAPI = {
  getAll: (params) => api.get('/notices', { params }),
  getById: (id) => api.get(`/notices/${id}`),
  create: (data) => api.post('/notices', data),
  update: (id, data) => api.put(`/notices/${id}`, data),
  delete: (id) => api.delete(`/notices/${id}`)
};

export const settingAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const communicationAPI = {
  sendEmail: (data) => api.post('/communication/email/send', data),
  sendWhatsApp: (data) => api.post('/communication/whatsapp/send', data),
  getAIReply: (data) => api.post('/communication/ai-reply', data),
  getLogs: (params) => api.get('/communication/logs', { params }),
  getStatus: () => api.get('/communication/status'),
  getStats: () => api.get('/communication/stats')
};

export default api;
