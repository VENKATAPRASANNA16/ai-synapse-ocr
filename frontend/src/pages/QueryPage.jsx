import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '../context/QueryContext';

const QueryPage = () => {
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Research_Report_2024.pdf', pages: 42 },
    { id: 2, name: 'Project_Analysis.docx', pages: 23 },
    { id: 3, name: 'Data_Summary.xlsx', pages: 5 },
  ]);
  const { currentConversation, sendQuery, isProcessing, createConversation } = useQuery();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentConversation) {
      createConversation(documents);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;

    const query = message;
    setMessage('');
    await sendQuery(query);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Document Analysis Chat</h1>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about your connected documents
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Connected Documents */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Documents</h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.pages} pages</p>
                  </div>
                  <button className="text-green-600 hover:text-green-700">
                    <span className="text-xl">✓</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full py-2 px-4 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium">
            + Add Document
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Welcome Message */}
            {(!currentConversation?.messages || currentConversation.messages.length === 0) && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Ask questions about your documents and get intelligent answers with citations
                  and references
                </p>
              </div>
            )}

            {/* Messages */}
            {currentConversation?.messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200'
                  } rounded-lg p-4`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Citations:</p>
                      <div className="space-y-1">
                        {msg.citations.map((citation, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-start">
                            <span className="mr-1">📌</span>
                            <span>
                              {citation.document} - Page {citation.page}, Section {citation.section}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs mt-2 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>3 documents connected</span>
              <div className="flex items-center space-x-4">
                <button className="hover:text-indigo-600">Export Chat</button>
                <button className="hover:text-indigo-600">Start Result</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <button
                type="button"
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
              >
                <span className="text-xl">📎</span>
              </button>
              <button
                type="button"
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
              >
                <span className="text-xl">🎤</span>
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question about your documents... (Login required)"
                disabled={isProcessing}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!message.trim() || isProcessing}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                Send
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send. Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryPage;