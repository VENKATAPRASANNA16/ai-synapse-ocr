import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';

export const ChatBox = ({ documentId, onSubmit, loading, error }) => {
  const [query, setQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    
    if (trimmedQuery && !loading && !isComposing) {
      console.log('📤 Submitting question:', trimmedQuery);
      onSubmit(trimmedQuery);
      setQuery('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const exampleQuestions = [
    "What is this document about?",
    "Summarize the main points",
    "What are the key findings?",
  ];

  const handleExampleClick = (question) => {
    if (!loading) {
      setQuery(question);
      // Auto-focus textarea
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="space-y-4">
      {/* Example Questions */}
      {!loading && query.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Try asking:</span>
          {exampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(q)}
              className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Ask a question about your document... (Press Enter to send, Shift+Enter for new line)"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[60px] max-h-[200px]"
            disabled={loading}
            rows={1}
            style={{ 
              transition: 'height 0.1s ease'
            }}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 left-2 text-xs text-gray-400">
            {query.length}/2000
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!query.trim() || loading || isComposing}
          className={`
            px-5 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all
            ${query.trim() && !loading && !isComposing
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send</span>
            </>
          )}
        </button>
      </form>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center space-x-2 text-gray-600 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching through document and generating answer...</span>
        </div>
      )}

      {/* Helpful tips */}
      {!loading && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> Ask specific questions for better answers</p>
          <p>📄 The AI will search through your document to find relevant information</p>
        </div>
      )}
    </div>
  );
};