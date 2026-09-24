import api from './api';

export const feeService = {
  // Class-wise Billing Summary
  getClassBillingSummary: async () => {
    const response = await api.get('/api/fees/class-summary');
    return response.data;
  },

  // Student Billing for a Class
  getStudentBillingByClass: async (className) => {
    const response = await api.get(`/api/fees/class/${encodeURIComponent(className)}`);
    return response.data;
  },

  // Download Class-specific Excel Template
  downloadTemplate: async (className) => {
    const response = await api.get(`/api/fees/template/${encodeURIComponent(className)}`, {
      responseType: 'blob',
    });
    return response;
  },

  // Atomic Bulk Billing Upload for a Class
  bulkUpload: async (className, formData) => {
    const response = await api.post(`/api/fees/bulk-upload?className=${encodeURIComponent(className)}`, formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  // Individual Student Billing create/update
  createFee: async (feeData) => {
    const response = await api.post('/api/fees', feeData);
    return response.data;
  },

  updateFee: async (id, feeData) => {
    const response = await api.put(`/api/fees/${id}`, feeData);
    return response.data;
  },

  getFeesByStudent: async (studentId) => {
    const response = await api.get(`/api/fees/student/${studentId}`);
    return response.data;
  },

  recordPayment: async (feeId, paymentData) => {
    const response = await api.post(`/api/fees/${feeId}/payments`, paymentData);
    return response.data;
  },

  getPaymentsByFee: async (feeId) => {
    const response = await api.get(`/api/fees/${feeId}/payments`);
    return response.data;
  },

  getPaymentsByStudent: async (studentId) => {
    const response = await api.get(`/api/fees/student/${studentId}/payments`);
    return response.data;
  }
};
