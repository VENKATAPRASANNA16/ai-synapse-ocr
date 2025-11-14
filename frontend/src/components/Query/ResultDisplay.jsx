import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ResultDisplay = ({ result }) => {
  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Query */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Your Question:</p>
        <p className="text-blue-800">{result.query}</p>
      </div>

      {/* Answer */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Answer</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Confidence:</span>
            <span className="text-sm font-medium text-primary-600">
              {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="prose max-w-none">
          <ReactMarkdown>{result.answer}</ReactMarkdown>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Processing time: {result.processing_time.toFixed(2)}s
        </div>
      </div>

      {/* Citations */}
      {result.citations && result.citations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources</h3>
          
          <div className="space-y-3">
            {result.citations.map((citation, index) => (
              <div
                key={index}
                className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Page {citation.page_number}
                        {citation.table_id && ` - Table ${citation.table_id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {citation.text_snippet}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Confidence: {(citation.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};