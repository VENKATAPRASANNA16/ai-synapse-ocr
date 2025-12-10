import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileText, Image, Table, MessageSquare, ChevronLeft, Eye, Loader } from 'lucide-react';

const OCRResultsPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(true);
  const [ocrResults, setOcrResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOCRResults();
  }, [documentId]);

  const fetchOCRResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/ocr/${documentId}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setOcrResults(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching OCR results:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (format) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/ocr/${documentId}/export?format=${format}`,
        { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const renderMarkdownText = (text) => {
    if (!text) return <p className="text-gray-500">No text content available</p>;
    
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold mt-6 mb-4 text-gray-900">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-semibold mt-4 mb-3 text-gray-800">{line.slice(4)}</h3>;
      }
      if (line.trim().startsWith('|')) {
        return null; // Tables are rendered separately
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="mb-2 text-gray-700 leading-relaxed">{line}</p>;
    });
  };

  const renderTables = (text) => {
    if (!text) return <p className="text-gray-500">No tables found</p>;
    
    const lines = text.split('\n');
    const tables = [];
    let currentTable = [];
    let inTable = false;

    lines.forEach((line) => {
      if (line.trim().startsWith('|')) {
        inTable = true;
        currentTable.push(line);
      } else if (inTable && !line.trim().startsWith('|')) {
        if (currentTable.length > 0) {
          tables.push(currentTable);
          currentTable = [];
        }
        inTable = false;
      }
    });

    if (currentTable.length > 0) {
      tables.push(currentTable);
    }

    if (tables.length === 0) {
      return <p className="text-gray-500">No tables found in the document</p>;
    }

    return tables.map((table, tableIndex) => {
      const rows = table
        .filter(line => !line.includes('---'))
        .map(line => line.split('|').filter(cell => cell.trim() !== ''));

      if (rows.length === 0) return null;

      return (
        <div key={tableIndex} className="overflow-x-auto mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Table {tableIndex + 1}</h3>
          <table className="min-w-full border-collapse border border-gray-300 shadow-sm">
            <thead>
              <tr className="bg-indigo-50">
                {rows[0]?.map((cell, i) => (
                  <th key={i} className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-300 px-4 py-3 text-gray-700">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading OCR results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!ocrResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No results found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {ocrResults?.documentName || 'Document Results'}
                </h1>
                <p className="text-sm text-gray-500">
                  {ocrResults?.pages || 0} pages • Processed on {ocrResults?.processedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => downloadFile('csv')}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </button>
              <button
                onClick={() => downloadFile('xlsx')}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </button>
              <button
                onClick={() => downloadFile('docx')}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                Word
              </button>
              <button
                onClick={() => navigate(`/query/${documentId}`)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with AI
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center px-6 py-3 font-medium transition ${
                activeTab === 'text'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Extracted Text
            </button>
            <button
              onClick={() => setActiveTab('detection')}
              className={`flex items-center px-6 py-3 font-medium transition ${
                activeTab === 'detection'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Detection View
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`flex items-center px-6 py-3 font-medium transition ${
                activeTab === 'original'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Image className="w-4 h-4 mr-2" />
              Original Pages
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center px-6 py-3 font-medium transition ${
                activeTab === 'tables'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table className="w-4 h-4 mr-2" />
              Tables ({ocrResults?.tablesCount || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'text' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none">
              {renderMarkdownText(ocrResults?.extractedText)}
            </div>
          </div>
        )}

        {activeTab === 'detection' && (
          <div className="space-y-6">
            {ocrResults?.detectionImages && ocrResults.detectionImages.length > 0 ? (
              ocrResults.detectionImages.map((img, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Page {index + 1}</h3>
                    <span className="text-sm text-gray-500">Detection Visualization</span>
                  </div>
                  <img
                    src={`http://localhost:8000${img}?token=${localStorage.getItem('token')}`}
                    alt={`Detection page ${index + 1}`}
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No detection images available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'original' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ocrResults?.originalImages && ocrResults.originalImages.length > 0 ? (
              ocrResults.originalImages.map((img, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Page {index + 1}</h3>
                    <button
                      onClick={() => window.open(`http://localhost:8000${img}?token=${localStorage.getItem('token')}`, '_blank')}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View Full Size
                    </button>
                  </div>
                  <img
                    src={`http://localhost:8000${img}?token=${localStorage.getItem('token')}`}
                    alt={`Original page ${index + 1}`}
                    className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(`http://localhost:8000${img}?token=${localStorage.getItem('token')}`, '_blank')}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No original images available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Extracted Tables</h2>
            {renderTables(ocrResults?.extractedText)}
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRResultsPage;