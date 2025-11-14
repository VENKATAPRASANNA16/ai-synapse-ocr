import { useState } from 'react';
import { uploadService } from '../services/uploadService';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadDocument = async (file) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadService.uploadDocument(file, (percent) => {
        setProgress(percent);
      });

      setUploading(false);
      setProgress(100);
      return { success: true, data: result };
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.detail || 'Upload failed');
      return { success: false, error: err.response?.data?.detail };
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploading,
    progress,
    error,
    uploadDocument,
    reset
  };
};