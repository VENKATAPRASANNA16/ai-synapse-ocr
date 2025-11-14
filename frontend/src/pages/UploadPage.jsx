import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadZone } from '../components/Upload/UploadZone';
import { ProgressBar } from '../components/Upload/ProgressBar';
import { useUpload } from '../hooks/useUpload';
import { CheckCircle } from 'lucide-react';

export const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const { uploading, progress, error, uploadDocument, reset } = useUpload();
  const navigate = useNavigate();

  const handleFileSelect = (file) => {
    reset();
    setSelectedFile(file);
    setUploadedDocument(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadDocument(selectedFile);
    
    if (result.success) {
      setUploadedDocument(result.data);
    }
  };

  const handleProcessDocument = () => {
    if (uploadedDocument) {
      navigate(`/ocr/${uploadedDocument._id}`);
    }
  };

  const handleUploadAnother = () => {
    setSelectedFile(null);
    setUploadedDocument(null);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Document</h1>
        <p className="text-gray-600 mb-6">
          Upload your document to start OCR processing and table extraction
        </p>

        {!uploadedDocument ? (
          <>
            <UploadZone onFileSelect={handleFileSelect} disabled={uploading} />

            {selectedFile && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Selected File</h3>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {uploading && (
                  <ProgressBar progress={progress} error={error} />
                )}

                {!uploading && !error && (
                  <button
                    onClick={handleUpload}
                    className="w-full btn-primary"
                  >
                    Upload Document
                  </button>
                )}

                {error && (
                  <button
                    onClick={handleUploadAnother}
                    className="w-full btn-secondary"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your document has been uploaded successfully. You can now start processing it.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleProcessDocument}
                className="w-full btn-primary"
              >
                Start OCR Processing
              </button>
              <button
                onClick={handleUploadAnother}
                className="w-full btn-secondary"
              >
                Upload Another Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Supported Features
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Multi-engine OCR (Tesseract, PaddleOCR, EasyOCR)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Automatic table detection and extraction</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>95%+ accuracy on most documents</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>AI-powered document analysis and Q&A</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Support for PDF, JPG, PNG, and TIFF formats</span>
          </li>
        </ul>
      </div>
    </div>
  );
};