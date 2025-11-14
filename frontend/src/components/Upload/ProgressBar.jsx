import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const ProgressBar = ({ progress, status, error }) => {
  const getStatusIcon = () => {
    if (error) return <XCircle className="w-5 h-5 text-red-500" />;
    if (progress === 100) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
  };

  const getStatusText = () => {
    if (error) return 'Upload failed';
    if (progress === 100) return 'Upload complete';
    return `Uploading... ${progress}%`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">
            {status || getStatusText()}
          </span>
        </div>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            error ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};