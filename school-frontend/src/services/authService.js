import api from './api';

export const authService = {
  login: async (credentials) => {
    // credentials: { email, password }
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  parentLogin: async (credentials) => {
    // credentials: { phoneNumber, password }
    const response = await api.post('/api/auth/parent-login', credentials);
    return response.data;
  },

  validate: async () => {
    const response = await api.get('/api/auth/validate');
    return response.data;
  },

  getParents: async () => {
    const response = await api.get('/api/auth/parents');
    return response.data;
  },

  createParent: async (parentData) => {
    // parentData: { name, email, password, studentId }
    // Uses dedicated POST /api/auth/parents which enforces role=PARENT and requires studentId
    const response = await api.post('/api/auth/parents', parentData);
    return response.data;
  },

  getStaffAccounts: async () => {
    const response = await api.get('/api/auth/staff');
    return response.data;
  },

  createStaff: async (staffData) => {
    // staffData: { name, email, password, role: 'ADMIN'|'TEACHER', assignedClass, assignedSection }
    // Uses POST /api/auth/register — the backend allows an authenticated ADMIN to create any role.
    const response = await api.post('/api/auth/register', staffData);
    return response.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await api.put(`/api/auth/users/${userId}/password`, { newPassword });
    return response.data;
  },
};
