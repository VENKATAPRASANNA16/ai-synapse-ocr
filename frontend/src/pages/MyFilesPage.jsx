import React, { useState, useEffect } from 'react';
import { uploadService } from '../services/uploadService';
import { formatBytes, formatDateTime } from '../utils/helpers';

const MyFilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await uploadService.getFiles();
      setFiles(data || mockFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles(mockFiles);
    } finally {
      setLoading(false);
    }
  };

  const mockFiles = [
    {
      id: 1,
      name: 'Financial_Report_Q3_2024.pdf',
      size: 2456789,
      type: 'PDF',
      uploadDate: new Date('2024-10-15'),
      status: 'Processed',
      accuracy: 98,
    },
    {
      id: 2,
      name: 'Market_Research_Analysis.docx',
      size: 1234567,
      type: 'DOCX',
      uploadDate: new Date('2024-10-12'),
      status: 'Processed',
      accuracy: 95,
    },
    {
      id: 3,
      name: 'Budget_Allocation_2025.xlsx',
      size: 987654,
      type: 'XLSX',
      uploadDate: new Date('2024-10-10'),
      status: 'Processing',
      accuracy: null,
    },
    {
      id: 4,
      name: 'Product_Launch_Strategy.pdf',
      size: 3456789,
      type: 'PDF',
      uploadDate: new Date('2024-10-08'),
      status: 'Processed',
      accuracy: 97,
    },
  ];

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await uploadService.deleteFile(fileId);
        setFiles(files.filter((f) => f.id !== fileId));
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const blob = await uploadService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = files.find((f) => f.id === fileId)?.name || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return '📄';
      case 'DOCX':
      case 'DOC':
        return '📝';
      case 'XLSX':
      case 'XLS':
        return '📊';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
          <p className="text-gray-600 mt-1">{files.length} documents in your library</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
          <span>📤</span>
          <span>Upload New</span>
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Files</option>
              <option value="processed">Processed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="date">Upload Date</option>
              <option value="name">Name</option>
              <option value="size">File Size</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex-1" />

          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                {getFileIcon(file.type)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(file.id)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  📥
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>

            <h3 className="font-medium text-gray-900 mb-2 truncate" title={file.name}>
              {file.name}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{formatBytes(file.size)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded:</span>
                <span className="font-medium">
                  {formatDateTime(file.uploadDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    file.status === 'Processed'
                      ? 'bg-green-100 text-green-800'
                      : file.status === 'Processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {file.status}
                </span>
              </div>
              {file.accuracy && (
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium text-green-600">{file.accuracy}%</span>
                </div>
              )}
            </div>

            <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
              View Results
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-600 mb-6">
            Upload your first document to get started with OCR processing
          </p>
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
};

export default MyFilesPage;