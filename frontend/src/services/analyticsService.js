import api from './api';

export const analyticsService = {
  async getDashboardStats() {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  async getOCRPerformance(days = 30) {
    const response = await api.get('/analytics/ocr-performance', {
      params: { days }
    });
    return response.data;
  },

  async getUserActivity(limit = 50) {
    const response = await api.get('/analytics/user-activity', {
      params: { limit }
    });
    return response.data;
  },

  async getDocumentTypes() {
    const response = await api.get('/analytics/document-types');
    return response.data;
  },

  async getErrorAnalysis(days = 7) {
    const response = await api.get('/analytics/error-analysis', {
      params: { days }
    });
    return response.data;
  },

  async getMyStats() {
    const response = await api.get('/analytics/my-stats');
    return response.data;
  }
};