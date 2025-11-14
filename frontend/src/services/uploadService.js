import api from './api';

export const uploadService = {
  async uploadDocument(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });

    return response.data;
  },

  async getMyDocuments(skip = 0, limit = 20) {
    const response = await api.get('/upload/my-documents', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getDocument(documentId) {
    const response = await api.get(`/upload/${documentId}`);
    return response.data;
  },

  async deleteDocument(documentId) {
    await api.delete(`/upload/${documentId}`);
  },

  async getGuestUploadInfo() {
    const response = await api.get('/upload/guest-upload');
    return response.data;
  }
};