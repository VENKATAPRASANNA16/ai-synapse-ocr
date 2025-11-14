import { useState, useCallback } from 'react';
import { ocrService } from '../services/ocrService';

export const useOCR = () => {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const startProcessing = async (documentId, engines = null) => {
    setProcessing(true);
    setError(null);

    try {
      await ocrService.startProcessing(documentId, engines);
      
      // Start polling for status
      await ocrService.pollStatus(documentId, (statusUpdate) => {
        setStatus(statusUpdate);
        
        if (statusUpdate.status === 'completed' || statusUpdate.status === 'failed') {
          setProcessing(false);
        }
      });

      return { success: true };
    } catch (err) {
      setProcessing(false);
      setError(err.response?.data?.detail || 'Processing failed');
      return { success: false, error: err.response?.data?.detail };
    }
  };

  const getResults = async (documentId) => {
    try {
      const results = await ocrService.getOCRResults(documentId);
      return { success: true, data: results };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail };
    }
  };

  const reset = useCallback(() => {
    setProcessing(false);
    setStatus(null);
    setError(null);
  }, []);

  return {
    processing,
    status,
    error,
    startProcessing,
    getResults,
    reset
  };
};