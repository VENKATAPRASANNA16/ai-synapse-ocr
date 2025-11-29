import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/Upload/UploadZone';
import FileCard from '../components/Upload/FileCard';
import ProgressBar from '../components/Upload/ProgressBar';
import { useUpload } from '../context/UploadContext';
import { uploadService } from '../services/uploadService';

const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const navigate = useNavigate();

  const handleFilesSelected = (files) => {
    const validFiles = files.filter((file) => {
      const validation = uploadService.validateFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);

    for (const file of selectedFiles) {
      try {
        await uploadService.uploadFile(file, {
          onProgress: (p) => {
            setProgress((prev) => ({
              ...prev,
              [file.name]: p,
            }));
          },
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setUploading(false);
    navigate('/processing');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Your Document</h1>
        <p className="text-gray-600 mt-2">
          Drag and drop your file or click to browse
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">👑</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Unlock Full Processing Power</h3>
            <p className="mt-1 text-sm text-blue-700">
              Sign in to process unlimited files and access advanced features
            </p>
          </div>
        </div>
      </div>

      <UploadZone onFilesSelected={handleFilesSelected} />

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Selected Files</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index}>
                <FileCard file={file} onRemove={handleRemoveFile} />
                {uploading && progress[file.name] !== undefined && (
                  <div className="mt-2">
                    <ProgressBar progress={progress[file.name]} fileName={file.name} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleStartProcessing}
              disabled={uploading || selectedFiles.length === 0}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? 'Processing...' : 'Start Processing'}
              </button>
            <button
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Requirements</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-green-600">
            <span className="mr-2">✓</span>
            <span>File format supported (PDF, DOC, DOCX)</span>
          </div>
          <div className="flex items-center text-green-600">
            <span className="mr-2">✓</span>
            <span>File size within limit (max 10MB)</span>
          </div>
          <div className="flex items-center text-orange-600">
            <span className="mr-2">⚠</span>
            <span>Guest users limited to 5 pages preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;