import api from './api';

export const queryService = {
  /**
   * Ask a question about a specific document
   */
  async askQuestion(documentId, question, conversationHistory = []) {
    try {
      console.log(`🔍 Asking question about document ${documentId}`);
      
      const response = await api.post(`/query/${documentId}/ask`, {
        question: question,
        conversation_history: conversationHistory
      });

      console.log('✅ Got answer:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Query error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to get answer'
      );
    }
  },

  /**
   * Get query history for a document
   */
  async getQueryHistory(documentId, limit = 20) {
    try {
      const response = await api.get(`/query/${documentId}/history`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get query history:', error);
      throw new Error('Failed to get query history');
    }
  },

  /**
   * Get all conversations (if you have a conversations feature)
   */
  async getConversations() {
    try {
      const response = await api.get('/query/conversations');
      return response.data;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      // Return empty array if endpoint doesn't exist
      return { conversations: [] };
    }
  },

  /**
   * Get a specific conversation
   */
  async getConversation(id) {
    try {
      const response = await api.get(`/query/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      throw new Error('Failed to get conversation');
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(id) {
    try {
      const response = await api.delete(`/query/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  },

  /**
   * Save a conversation
   */
  async saveConversation(conversation) {
    try {
      const response = await api.post('/query/conversations/save', conversation);
      return response.data;
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw new Error('Failed to save conversation');
    }
  },

  /**
   * Export conversation to PDF/TXT
   */
  async exportConversation(id, format = 'pdf') {
    try {
      const response = await api.get(`/query/conversations/${id}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conversation_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response.data;
    } catch (error) {
      console.error('Failed to export conversation:', error);
      throw new Error('Failed to export conversation');
    }
  },
};