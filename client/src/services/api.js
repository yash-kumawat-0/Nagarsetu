import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Complaint APIs
export const complaintAPI = {
  create: (data) => api.post('/complaints', data),
  getAll: (params) => api.get('/complaints', { params }),
  getAllAdmin: (params) => api.get('/complaints/all', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  upvote: (id) => api.put(`/complaints/${id}/upvote`),
  addFeedback: (id, data) => api.put(`/complaints/${id}/feedback`, data),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  verify: (id, data) => api.put(`/admin/verify/${id}`, data),
  assign: (id, data) => api.put(`/admin/assign/${id}`, data),
  getOfficers: () => api.get('/admin/officers'),
  getDepartments: () => api.get('/admin/departments'),
};

// Officer APIs
export const officerAPI = {
  getComplaints: (params) => api.get('/officer/complaints', { params }),
  getStats: () => api.get('/officer/stats'),
  updateProgress: (id, data) => api.put(`/officer/progress/${id}`, data),
  resolve: (id, data) => api.put(`/officer/resolve/${id}`, data),
};

// Comment APIs
export const commentAPI = {
  add: (complaintId, data) => api.post(`/comments/${complaintId}`, data),
  getAll: (complaintId) => api.get(`/comments/${complaintId}`),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
