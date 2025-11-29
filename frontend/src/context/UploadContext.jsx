import React, { createContext, useState, useContext } from 'react';
import { uploadService } from '../services/uploadService';

// Export the context
export const UploadContext = createContext();

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
};

export const UploadProvider = ({ children }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const addToQueue = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'queued',
      progress: 0,
      error: null,
    }));

    setUploadQueue((prev) => [...prev, ...newFiles]);
    return newFiles;
  };

  const uploadFile = async (fileItem) => {
    setIsUploading(true);

    try {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === fileItem.id ? { ...item, status: 'uploading' } : item
        )
      );

      const result = await uploadService.uploadFile(fileItem.file, {
        onProgress: (progress) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === fileItem.id ? { ...item, progress } : item
            )
          );
        },
      });

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === fileItem.id
            ? { ...item, status: 'completed', result }
            : item
        )
      );

      setUploadHistory((prev) => [
        {
          ...fileItem,
          status: 'completed',
          result,
          completedAt: new Date(),
        },
        ...prev,
      ]);

      return { success: true, result };
    } catch (error) {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === fileItem.id
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );

      return { success: false, error: error.message };
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAll = async () => {
    const queuedFiles = uploadQueue.filter((f) => f.status === 'queued');
    
    for (const file of queuedFiles) {
      await uploadFile(file);
    }
  };

  const removeFromQueue = (fileId) => {
    setUploadQueue((prev) => prev.filter((f) => f.id !== fileId));
  };

  const clearQueue = () => {
    setUploadQueue([]);
  };

  const clearHistory = () => {
    setUploadHistory([]);
  };

  const value = {
    uploadQueue,
    uploadHistory,
    isUploading,
    addToQueue,
    uploadFile,
    uploadAll,
    removeFromQueue,
    clearQueue,
    clearHistory,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};