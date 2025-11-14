import api from './api';

export const queryService = {
  async queryDocuments(query, documentIds = null, topK = 5) {
    const response = await api.post('/query/', {
      query,
      document_ids: documentIds,
      top_k: topK
    });
    return response.data;
  },

  async getQueryHistory(skip = 0, limit = 20) {
    const response = await api.get('/query/history', {
      params: { skip, limit }
    });
    return response.data;
  },

  async deleteQuery(queryId) {
    await api.delete(`/query/history/${queryId}`);
  }
};