import api from './api';

export const ocrService = {
  /**
   * Start OCR processing for a document
   */
  async startProcessing(documentId) {
    try {
      console.log(`🚀 Starting OCR processing for ${documentId}`);
      
      const response = await api.post(`/ocr/${documentId}/process`);
      
      console.log('✅ Processing started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to start processing:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to start OCR processing'
      );
    }
  },

  /**
   * Get OCR processing status
   */
  async getProcessingStatus(documentId) {
    try {
      const response = await api.get(`/ocr/${documentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to get processing status'
      );
    }
  },

  /**
   * Get OCR results (completed documents)
   */
  async getResult(documentId) {
    try {
      const response = await api.get(`/ocr/${documentId}/results`);
      return response.data;
    } catch (error) {
      console.error('Failed to get OCR results:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to get OCR results'
      );
    }
  },

  /**
   * Process a new document (upload + OCR)
   * This is for the upload flow
   */
  async processDocument(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.engine) {
        formData.append('engine', options.engine);
      }
      if (options.language) {
        formData.append('language', options.language);
      }

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            options.onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'OCR processing failed'
      );
    }
  },

  /**
   * Cancel processing (if supported)
   */
  async cancelProcessing(documentId) {
    try {
      const response = await api.post(`/ocr/${documentId}/cancel`);
      return response.data;
    } catch (error) {
      // This endpoint might not exist
      console.warn('Cancel processing not supported');
      throw new Error('Failed to cancel processing');
    }
  },

  /**
   * Get available OCR engines
   */
  async getEngines() {
    try {
      // This would need a backend endpoint
      return {
        engines: [
          { name: 'tesseract', label: 'Tesseract OCR', available: true },
          { name: 'paddleocr', label: 'PaddleOCR', available: true },
          { name: 'easyocr', label: 'EasyOCR', available: true },
        ]
      };
    } catch (error) {
      return { engines: [] };
    }
  },

  /**
   * Validate document before upload
   */
  async validateDocument(file) {
    // Client-side validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/bmp'
    ];

    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload PDF or image files.');
    }

    return { valid: true };
  },

  /**
   * Get document versions (if version history is supported)
   */
  async getVersions(documentId) {
    try {
      const response = await api.get(`/ocr/${documentId}/versions`);
      return response.data;
    } catch (error) {
      // Versions might not be supported
      return { versions: [] };
    }
  },

  /**
   * Poll for processing completion
   * Useful for showing progress
   */
  async pollProcessingStatus(documentId, callback, maxAttempts = 60) {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const status = await this.getProcessingStatus(documentId);
        
        callback(status);
        
        // Check if done
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }
        
        // Continue polling
        if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s
          return poll();
        } else {
          throw new Error('Processing timeout - taking longer than expected');
        }
      } catch (error) {
        throw error;
      }
    };
    
    return poll();
  }
};