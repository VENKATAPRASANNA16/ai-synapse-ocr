import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCard } from '../components/Upload/FileCard';
import { uploadService } from '../services/uploadService';
import { Loading } from '../components/Common/Loading';
import { Search, Filter } from 'lucide-react';
import { DOCUMENT_STATUS } from '../utils/constants';

export const MyFilesPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await uploadService.getMyDocuments(0, 100);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await uploadService.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc._id !== documentId));
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  const handleView = (document) => {
    if (document.status === DOCUMENT_STATUS.COMPLETED) {
      navigate(`/results/${document._id}`);
    } else if (document.status === DOCUMENT_STATUS.UPLOADED || document.status === DOCUMENT_STATUS.FAILED) {
      navigate(`/ocr/${document._id}`);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.metadata.original_filename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <Loading text="Loading your documents..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
          <p className="text-gray-600">Manage your uploaded documents</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary"
        >
          Upload New Document
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value={DOCUMENT_STATUS.UPLOADED}>Uploaded</option>
              <option value={DOCUMENT_STATUS.PREPROCESSING}>Preprocessing</option>
              <option value={DOCUMENT_STATUS.OCR_PROCESSING}>OCR Processing</option>
              <option value={DOCUMENT_STATUS.COMPLETED}>Completed</option>
              <option value={DOCUMENT_STATUS.FAILED}>Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'No documents match your filters' 
              : 'No documents uploaded yet'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary"
            >
              Upload Your First Document
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.map(doc => (
              <FileCard
                key={doc._id}
                document={doc}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};