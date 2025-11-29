import React from 'react';
import { formatBytes } from '../../utils/helpers';

const FileCard = ({ file, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-2xl">📄</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
        </div>
      </div>

      <button
        onClick={() => onRemove(file)}
        className="text-red-600 hover:text-red-800"
      >
        Remove
      </button>
    </div>
  );
};

export default FileCard;