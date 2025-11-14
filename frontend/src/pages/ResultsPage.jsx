import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Table } from 'lucide-react';
import { ocrService } from '../services/ocrService';
import { Loading } from '../components/Common/Loading';

export const ResultsPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadResults();
  }, [documentId]);

  const loadResults = async () => {
    try {
      const data = await ocrService.getOCRResults(documentId);
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${results.metadata.original_filename}_results.json`;
    link.click();
  };

  const exportToCSV = () => {
    if (!results.tables || results.tables.length === 0) {
      alert('No tables to export');
      return;
    }

    let csv = '';
    results.tables.forEach((table, index) => {
      csv += `Table ${index + 1} (Page ${table.page_number})\n`;
      table.data.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${results.metadata.original_filename}_tables.csv`;
    link.click();
  };

  if (loading) {
    return <Loading text="Loading results..." />;
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Results not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/my-files')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {results.metadata.original_filename}
            </h1>
            <p className="text-gray-600">Processing Results</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button onClick={exportToJSON} className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button onClick={exportToCSV} className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Pages</p>
          <p className="text-2xl font-bold text-gray-900">{results.metadata.page_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Tables Extracted</p>
          <p className="text-2xl font-bold text-gray-900">{results.tables?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
          <p className="text-2xl font-bold text-gray-900">
            {results.ocr_results && results.ocr_results.length > 0
              ? (results.ocr_results.reduce((sum, r) => sum + r.confidence, 0) / results.ocr_results.length * 100).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Processing Time</p>
          <p className="text-2xl font-bold text-gray-900">
            {results.processing_time ? `${results.processing_time.toFixed(1)}s` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'ocr', name: 'OCR Results', icon: Eye },
              { id: 'tables', name: 'Tables', icon: Table }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Filename</dt>
                    <dd className="mt-1 text-sm text-gray-900">{results.metadata.original_filename}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {(results.metadata.file_size / (1024 * 1024)).toFixed(2)} MB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pages</dt>
                    <dd className="mt-1 text-sm text-gray-900">{results.metadata.page_count}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tables Detected</dt>
                    <dd className="mt-1 text-sm text-gray-900">{results.metadata.table_count}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(results.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{results.status}</dd>
                  </div>
                </dl>
              </div>

              {results.ocr_results && results.ocr_results.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">OCR Engines Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(results.ocr_results.map(r => r.engine))).map(engine => (
                      <span key={engine} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                        {engine.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OCR Results Tab */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              {results.ocr_results && results.ocr_results.length > 0 ? (
                results.ocr_results.map((ocrResult, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Page {ocrResult.page_number}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          Engine: <span className="font-medium">{ocrResult.engine}</span>
                        </span>
                        <span className="text-gray-600">
                          Confidence: <span className="font-medium">{(ocrResult.confidence * 100).toFixed(1)}%</span>
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {ocrResult.text}
                      </pre>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No OCR results available</p>
              )}
            </div>
          )}

          {/* Tables Tab */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {results.tables && results.tables.length > 0 ? (
                results.tables.map((table, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Table {index + 1} - Page {table.page_number}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {table.rows} rows × {table.columns} columns
                        <span className="ml-4">
                          Confidence: {(table.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {table.data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-2 text-sm text-gray-900 border border-gray-200"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No tables detected in this document</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};