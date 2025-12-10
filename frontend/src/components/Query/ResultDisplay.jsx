import React from 'react';
import { FileText, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ResultDisplay = ({ result }) => {
  const [copied, setCopied] = React.useState(false);

  if (!result) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.7) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.5) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Question */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Your Question:</p>
            <p className="text-blue-800">{result.query}</p>
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Answer</h3>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Confidence Badge */}
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border ${getConfidenceColor(result.confidence)}`}>
                {getConfidenceIcon(result.confidence)}
                <span className="text-sm font-medium">
                  {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy answer"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Answer Content */}
        <div className="px-6 py-5">
          <div className="prose max-w-none prose-sm">
            <ReactMarkdown
              components={{
                // Custom styling for markdown elements
                p: ({node, ...props}) => <p className="mb-3 text-gray-700 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="mb-3 ml-5 list-disc text-gray-700" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-3 ml-5 list-decimal text-gray-700" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? (
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props} />
                  ) : (
                    <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                  ),
              }}
            >
              {result.answer}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        {result.processing_time && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Processing time: {result.processing_time.toFixed(2)}s</span>
              <span>
                {result.sources?.length || 0} source{result.sources?.length !== 1 ? 's' : ''} referenced
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sources/Citations */}
      {result.sources && result.sources.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Sources ({result.sources.length})</span>
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {result.sources.map((source, index) => (
              <div
                key={index}
                className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-r-lg hover:from-purple-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Page {source.page_number}
                    </p>
                  </div>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(source.confidence)}`}>
                    {getConfidenceIcon(source.confidence)}
                    <span>{(source.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  "{source.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Sources Warning */}
      {(!result.sources || result.sources.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">No specific sources found</p>
              <p className="text-sm text-yellow-700 mt-1">
                The answer was generated using general document context.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};