import api from './api';

export const ocrService = {
  async processDocument(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('engine', options.engine || 'tesseract');
      
      if (options.language) {
        formData.append('language', options.language);
      }

      const response = await api.post('/ocr/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            options.onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'OCR processing failed');
    }
  },

  async getProcessingStatus(jobId) {
    try {
      const response = await api.get(`/ocr/status/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get processing status');
    }
  },

  async getResult(jobId) {
    try {
      const response = await api.get(`/ocr/result/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get OCR result');
    }
  },

  async cancelProcessing(jobId) {
    try {
      const response = await api.post(`/ocr/cancel/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel processing');
    }
  },

  async getEngines() {
    try {
      const response = await api.get('/ocr/engines');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get available engines');
    }
  },

  async validateDocument(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/ocr/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Validation failed');
    }
  },
};