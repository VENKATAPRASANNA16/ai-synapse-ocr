import api from './api';

export const analyticsService = {
  async getDashboardStats() {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get dashboard stats');
    }
  },

  async getProcessingMetrics(timeRange = '30d') {
    try {
      const response = await api.get('/analytics/processing-metrics', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get processing metrics');
    }
  },

  async getUserActivity(userId) {
    try {
      const response = await api.get(`/analytics/user-activity/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user activity');
    }
  },

  async getAccuracyTrends(timeRange = '30d') {
    try {
      const response = await api.get('/analytics/accuracy-trends', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get accuracy trends');
    }
  },

  async getDocumentTypeDistribution() {
    try {
      const response = await api.get('/analytics/document-types');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get document type distribution');
    }
  },

  async exportReport(reportType, format = 'pdf') {
    try {
      const response = await api.get('/analytics/export', {
        params: { reportType, format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to export report');
    }
  },
};