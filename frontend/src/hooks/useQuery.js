import { useState } from 'react';
import { queryService } from '../services/queryService';

export const useQuery = () => {
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const executeQuery = async (query, documentIds = null, topK = 5) => {
    setQuerying(true);
    setError(null);

    try {
      const response = await queryService.queryDocuments(query, documentIds, topK);
      setResult(response);
      setQuerying(false);
      return { success: true, data: response };
    } catch (err) {
      setQuerying(false);
      setError(err.response?.data?.detail || 'Query failed');
      return { success: false, error: err.response?.data?.detail };
    }
  };

  const reset = () => {
    setQuerying(false);
    setResult(null);
    setError(null);
  };

  return {
    querying,
    result,
    error,
    executeQuery,
    reset
  };
};