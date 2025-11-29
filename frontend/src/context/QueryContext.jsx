import React, { createContext, useState, useContext } from 'react';
import { queryService } from '../services/queryService';

// Export the context
export const QueryContext = createContext();

export const useQuery = () => {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQuery must be used within QueryProvider');
  }
  return context;
};

export const QueryProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [connectedDocuments, setConnectedDocuments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const createConversation = (documents = []) => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      documents,
      createdAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setConnectedDocuments(documents);
    
    return newConversation;
  };

  const sendQuery = async (query) => {
    if (!currentConversation) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setCurrentConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setIsProcessing(true);

    try {
      const response = await queryService.askQuestion({
        query,
        documents: connectedDocuments,
        conversationId: currentConversation.id,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        timestamp: new Date(),
      };

      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      return { success: true, response };
    } catch (error) {
      console.error('Query failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const loadConversation = (conversationId) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      setConnectedDocuments(conversation.documents);
    }
  };

  const deleteConversation = (conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  };

  const connectDocument = (document) => {
    setConnectedDocuments((prev) => [...prev, document]);
    if (currentConversation) {
      setCurrentConversation((prev) => ({
        ...prev,
        documents: [...prev.documents, document],
      }));
    }
  };

  const value = {
    conversations,
    currentConversation,
    connectedDocuments,
    isProcessing,
    createConversation,
    sendQuery,
    loadConversation,
    deleteConversation,
    connectDocument,
  };

  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
};