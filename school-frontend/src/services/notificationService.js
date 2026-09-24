import api from './api';

export const notificationService = {
  /** Admin: Send a new notification */
  sendNotification: async (data) => {
    // data: { date, audience, message }
    const response = await api.post('/api/notifications', data);
    return response.data;
  },

  /** Admin: Get all notification history */
  getHistory: async () => {
    const response = await api.get('/api/notifications/history');
    return response.data;
  },

  /** Student/Teacher: Get my applicable notifications */
  getMyNotifications: async () => {
    const response = await api.get('/api/notifications/my');
    return response.data;
  },
};
