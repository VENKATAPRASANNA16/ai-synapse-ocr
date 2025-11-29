import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadZone = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles);
    setIsDragActive(false);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10485760, // 10MB
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-indigo-600 bg-indigo-50'
          : 'border-gray-300 hover:border-indigo-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">☁️</span>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your file here
        </p>
        <p className="text-sm text-gray-600 mb-4">
          or click to select from your computer
        </p>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Choose File
        </button>
        <div className="mt-6 space-y-1 text-xs text-gray-500">
          <p className="flex items-center justify-center">
            <span className="text-green-600 mr-2">✓</span>
            File format supported (PDF, DOC, DOCX)
          </p>
          <p className="flex items-center justify-center">
            <span className="text-green-600 mr-2">✓</span>
            File size within limit (max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;