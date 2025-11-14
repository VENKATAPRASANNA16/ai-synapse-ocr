import React from 'react';
import { File, Trash2, Eye, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { STATUS_COLORS } from '../../utils/constants';

export const FileCard = ({ document, onDelete, onView }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <File className="w-10 h-10 text-primary-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.metadata.original_filename}
            </h3>
            
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatFileSize(document.metadata.file_size)}</span>
              <span>•</span>
              <span>{document.metadata.page_count || 0} pages</span>
              <span>•</span>
              <span>{document.metadata.table_count || 0} tables</span>
            </div>
            
            <p className="mt-1 text-xs text-gray-500">
              Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
            </p>
            
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[document.status]}`}>
                {document.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {document.status === 'completed' && (
            <button
              onClick={() => onView(document)}
              className="p-2 text-gray-400 hover:text-primary-500"
              title="View Results"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => onDelete(document._id)}
            className="p-2 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
