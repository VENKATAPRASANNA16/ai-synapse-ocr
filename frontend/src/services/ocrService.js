import api from './api';

export const ocrService = {
  async startProcessing(documentId, engines = null) {
    const response = await api.post(`/ocr/${documentId}/process`, { engines });
    return response.data;
  },

  async getProcessingStatus(documentId) {
    const response = await api.get(`/ocr/${documentId}/status`);
    return response.data;
  },

  async getOCRResults(documentId) {
    const response = await api.get(`/ocr/${documentId}/results`);
    return response.data;
  },

  async pollStatus(documentId, onUpdate, interval = 2000) {
    const poll = async () => {
      try {
        const status = await this.getProcessingStatus(documentId);
        onUpdate(status);

        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
        return poll();
      } catch (error) {
        console.error('Polling error:', error);
        throw error;
      }
    };

    return poll();
  }
};