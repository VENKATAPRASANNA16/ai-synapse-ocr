import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle } from 'lucide-react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../../utils/constants';

export const UploadZone = ({ onFileSelect, disabled = false }) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      alert(error.message);
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-300 hover:border-primary-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center">
        {isDragActive ? (
          <>
            <Upload className="w-16 h-16 text-primary-500 mb-4" />
            <p className="text-lg font-medium text-primary-600">Drop your file here</p>
          </>
        ) : (
          <>
            <File className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop your file here
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            
            <div className="flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-md max-w-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium mb-1">Supported formats:</p>
                <p>PDF, JPG, JPEG, PNG, TIFF</p>
                <p className="mt-2">Maximum file size: 50MB</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};