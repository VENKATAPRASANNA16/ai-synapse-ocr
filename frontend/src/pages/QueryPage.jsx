import React, { useState, useEffect } from 'react';
import { ChatBox } from '../components/Query/ChatBox';
import { ResultDisplay } from '../components/Query/ResultDisplay';
import { useQuery } from '../hooks/useQuery';
import { uploadService } from '../services/uploadService';
import { MessageSquare, FileText } from 'lucide-react';

export const QueryPage = () => {
  const { querying, result, error, executeQuery } = useQuery();
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [queryHistory, setQueryHistory] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await uploadService.getMyDocuments(0, 50);
      const completedDocs = docs.filter(doc => doc.status === 'completed');
      setDocuments(completedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleQuery = async (query) => {
    const docIds = selectedDocs.length > 0 ? selectedDocs : null;
    const result = await executeQuery(query, docIds);
    
    if (result.success) {
      setQueryHistory([result.data, ...queryHistory]);
    }
  };

  const toggleDocument = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Query Documents</h1>
            <p className="text-gray-600">Ask questions about your processed documents</p>
          </div>
        </div>

        {/* Document Filter */}
        {documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Filter by documents (optional):
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDocs([])}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedDocs.length === 0
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Documents ({documents.length})
              </button>
              {documents.map(doc => (
                <button
                  key={doc._id}
                  onClick={() => toggleDocument(doc._id)}
                  className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                    selectedDocs.includes(doc._id)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-xs">
                    {doc.metadata.original_filename}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <ChatBox onSubmit={handleQuery} loading={querying} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Current Result */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <ResultDisplay result={result} />
        </div>
      )}

      {/* Query History */}
      {queryHistory.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Queries</h2>
          <div className="space-y-4">
            {queryHistory.slice(1).map((item, index) => (
              <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                <p className="text-sm font-medium text-gray-900 mb-1">{item.query}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{item.answer}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.citations?.length || 0} sources • {(item.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Query Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">💡</span>
            <span>Ask specific questions about information in your documents</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">💡</span>
            <span>Reference table data, dates, numbers, and specific sections</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">💡</span>
            <span>Filter by specific documents for more focused results</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">💡</span>
            <span>Use natural language - no need for special syntax</span>
          </li>
        </ul>
      </div>
    </div>
  );
};