import React, { createContext, useState, useContext } from 'react';
import { ocrService } from '../services/ocrService';

// Export the context
export const OCRContext = createContext();

export const useOCR = () => {
  const context = useContext(OCRContext);
  if (!context) {
    throw new Error('useOCR must be used within OCRProvider');
  }
  return context;
};

export const OCRProvider = ({ children }) => {
  const [processingFiles, setProcessingFiles] = useState([]);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [selectedEngine, setSelectedEngine] = useState('tesseract');
  const [processingStatus, setProcessingStatus] = useState(null);

  const startProcessing = async (file, options = {}) => {
    try {
      const fileId = Date.now().toString();
      
      setProcessingFiles((prev) => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          status: 'processing',
          progress: 0,
          engine: options.engine || selectedEngine,
        },
      ]);

      const result = await ocrService.processDocument(file, {
        engine: options.engine || selectedEngine,
        ...options,
      });

      setProcessingFiles((prev) => prev.filter((f) => f.id !== fileId));
      setCompletedFiles((prev) => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          status: 'completed',
          result,
          timestamp: new Date(),
        },
      ]);

      return { success: true, result };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProgress = (fileId, progress) => {
    setProcessingFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, progress } : file
      )
    );
  };

  const cancelProcessing = (fileId) => {
    setProcessingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const clearCompleted = () => {
    setCompletedFiles([]);
  };

  const getProcessingStats = () => {
    return {
      processing: processingFiles.length,
      completed: completedFiles.length,
      total: processingFiles.length + completedFiles.length,
    };
  };

  const value = {
    processingFiles,
    completedFiles,
    selectedEngine,
    processingStatus,
    setSelectedEngine,
    startProcessing,
    updateProgress,
    cancelProcessing,
    clearCompleted,
    getProcessingStats,
  };

  return <OCRContext.Provider value={value}>{children}</OCRContext.Provider>;
};