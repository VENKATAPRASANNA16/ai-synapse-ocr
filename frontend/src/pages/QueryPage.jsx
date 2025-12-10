import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatBox } from '../components/Query/ChatBox';
import { ResultDisplay } from '../components/Query/ResultDisplay';
import { queryService } from '../services/queryService';
import { ArrowLeft, FileText, Loader2, Trash2, Download } from 'lucide-react';
import axios from 'axios';

export const QueryPage = () => {
  const { id } = useParams(); // document ID
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(true);

  // Load document info
  useEffect(() => {
    loadDocument();
  }, [id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDocument = async () => {
    try {
      setDocumentLoading(true);
      console.log('📥 Loading document:', id);
      
      const response = await axios.get(`/api/ocr/${id}/status`);
      setDocument(response.data);
      
      console.log('✅ Document loaded:', response.data);
      
      // Check if ready
      if (response.data.status !== 'completed') {
        setError(`Document is ${response.data.status}. Please wait for processing to complete.`);
      }
    } catch (err) {
      console.error('❌ Failed to load document:', err);
      setError(err.response?.data?.detail || 'Failed to load document');
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleSubmitQuestion = async (question) => {
    setError(null);
    setLoading(true);

    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('🔍 Asking question:', question);

      // Get conversation history (last 4 messages)
      const conversationHistory = messages.slice(-4).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call API
      const result = await queryService.askQuestion(
        id,
        question,
        conversationHistory
      );

      console.log('✅ Got answer:', result);

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        confidence: result.confidence,
        query: question,
        timestamp: new Date(),
        processing_time: 0 // Would come from API
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('❌ Query failed:', err);
      setError(err.message || 'Failed to get answer');
      
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation history?')) {
      setMessages([]);
    }
  };

  const handleExportChat = () => {
    const chatText = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}\n\n`
    ).join('');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${id}-${Date.now()}.txt`;
    a.click();
  };

  if (documentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/results/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to results"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <FileText className="w-6 h-6 text-blue-600" />
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  Chat with Document
                </h1>
                <p className="text-xs text-gray-500">
                  {document?.embeddings_generated 
                    ? `✅ Ready • ${messages.length} messages` 
                    : `⏳ Processing...`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <>
                  <button
                    onClick={handleExportChat}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export conversation"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            {messages.length > 0 ? (
              <div className="space-y-6 pb-4">
                {messages.map((message, index) => (
                  <div key={index}>
                    {message.role === 'user' ? (
                      // User message
                      <div className="flex justify-end">
                        <div className="max-w-3xl bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl px-5 py-3 shadow-lg">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-75 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Assistant message
                      <div className="flex justify-start">
                        <div className="max-w-4xl w-full">
                          <ResultDisplay result={message} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Start a Conversation
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Ask me anything about this document. I'll search through the content and provide accurate answers with sources.
                  </p>
                  {!document?.embeddings_generated && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Document is still processing. Please wait a moment...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input - Sticky at bottom */}
          <div className="border-t border-gray-200 bg-white px-4 sm:px-6 lg:px-8 py-4 shadow-lg">
            <ChatBox
              documentId={id}
              onSubmit={handleSubmitQuestion}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryPage;