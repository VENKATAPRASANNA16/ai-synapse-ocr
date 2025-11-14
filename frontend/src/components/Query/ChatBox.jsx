import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export const ChatBox = ({ onSubmit, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="input-field resize-none"
          rows={3}
          disabled={loading}
        />
      </div>
      
      <button
        type="submit"
        disabled={!query.trim() || loading}
        className="btn-primary px-4 py-3 flex items-center space-x-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
};