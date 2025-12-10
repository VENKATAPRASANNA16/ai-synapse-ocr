import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF or image files (PNG, JPG, TIFF).');
      return;
    }

    if (selectedFile.size > maxSize) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setDocumentId(data._id);
      setUploadProgress(100);
      
      await startProcessing(data._id);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const startProcessing = async (docId) => {
    try {
      setProcessing(true);
      setProcessingStatus('Starting OCR processing...');

      const response = await fetch(`http://localhost:8000/api/ocr/${docId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      pollProcessingStatus(docId);

    } catch (err) {
      console.error('Processing error:', err);
      setError('Processing failed. Please try again.');
      setProcessing(false);
      setUploading(false);
    }
  };

  const pollProcessingStatus = async (docId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/ocr/${docId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Status check failed');
        }

        const data = await response.json();
        
        const statusMessages = {
          'preprocessing': 'Preprocessing document...',
          'ocr_processing': 'Extracting text with multi-engine OCR...',
          'table_extraction': 'Detecting and extracting tables...',
          'embedding_generation': 'Generating AI embeddings...',
          'completed': 'Processing complete!',
          'failed': 'Processing failed'
        };

        setProcessingStatus(statusMessages[data.status] || 'Processing...');

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          setProcessing(false);
          setUploading(false);
          
          setTimeout(() => {
            navigate(`/results/${docId}`);
          }, 1500);
        }

        if (data.status === 'failed') {
          clearInterval(pollInterval);
          setError(data.error_message || 'Processing failed');
          setProcessing(false);
          setUploading(false);
        }

      } catch (err) {
        console.error('Status poll error:', err);
        clearInterval(pollInterval);
        setError('Failed to check processing status');
        setProcessing(false);
        setUploading(false);
      }
    }, 2000);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setUploading(false);
    setProcessing(false);
    setDocumentId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Document</h1>
          <p className="text-gray-600">Upload your PDF or image file for AI-powered OCR processing</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Advanced OCR Processing</h3>
              <p className="mt-1 text-sm text-blue-700">
                Multi-engine OCR • Table Detection • AI-Powered Analysis • Export to CSV/Excel/Word
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        {!file && !uploading && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition cursor-pointer bg-white"
            onClick={() => document.getElementById('fileInput').click()}
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop your file here or click to browse
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, PNG, JPG, TIFF (Max 50MB)
            </p>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.tiff"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* File Preview */}
        {file && !uploading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <File className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={uploadFile}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Upload and Process
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              {processing ? (
                <>
                  <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {processingStatus}
                  </h3>
                  <p className="text-gray-500">
                    This may take a few minutes depending on document size
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload Complete!
                  </h3>
                </>
              )}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            {processing && (
              <div className="space-y-3 mt-6">
                {[
                  { name: 'Uploading', completed: true },
                  { name: 'Preprocessing', completed: processingStatus.includes('Extracting') || processingStatus.includes('Detecting') || processingStatus.includes('complete') },
                  { name: 'OCR Processing', completed: processingStatus.includes('Detecting') || processingStatus.includes('complete') },
                  { name: 'Table Detection', completed: processingStatus.includes('Generating') || processingStatus.includes('complete') },
                  { name: 'Finalizing', completed: processingStatus.includes('complete') }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {step.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm ${step.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* File Requirements */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Requirements</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-green-600">
              <span className="mr-2">✓</span>
              <span>Supported formats: PDF, PNG, JPG, JPEG, TIFF</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✓</span>
              <span>Maximum file size: 50MB</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✓</span>
              <span>Multi-engine OCR for best accuracy</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✓</span>
              <span>Automatic table detection and extraction</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h4 className="font-semibold text-gray-900 mb-1">Multi-Engine OCR</h4>
            <p className="text-sm text-gray-600">Tesseract, PaddleOCR, and EasyOCR for maximum accuracy</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-900 mb-1">Table Detection</h4>
            <p className="text-sm text-gray-600">Automatic detection and extraction of tabular data</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-3xl mb-2">🤖</div>
            <h4 className="font-semibold text-gray-900 mb-1">AI Chat</h4>
            <p className="text-sm text-gray-600">Ask questions about your document with AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;