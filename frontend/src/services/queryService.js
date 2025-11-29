import api from './api';

export const queryService = {
  async askQuestion(data) {
    try {
      const response = await api.post('/query/ask', {
        query: data.query,
        documentIds: data.documents.map((d) => d.id),
        conversationId: data.conversationId,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Query failed');
    }
  },

  async getConversations() {
    try {
      const response = await api.get('/query/conversations');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get conversations');
    }
  },

  async getConversation(id) {
    try {
      const response = await api.get(`/query/conversations/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get conversation');
    }
  },

  async deleteConversation(id) {
    try {
      const response = await api.delete(`/query/conversations/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete conversation');
    }
  },

  async saveConversation(conversation) {
    try {
      const response = await api.post('/query/conversations/save', conversation);
      return response.data;
    } catch (error) {
      throw new Error('Failed to save conversation');
    }
  },

  async exportConversation(id, format = 'pdf') {
    try {
      const response = await api.get(`/query/conversations/${id}/export`, {
        params: { format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to export conversation');
    }
  },
};