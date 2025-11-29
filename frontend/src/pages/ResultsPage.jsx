import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const extractedData = [
    { category: 'Financial', value: '$2,400,000', page: 1, confidence: 98 },
    { category: 'Percentage', value: '15.2%', page: 1, confidence: 95 },
    { category: 'Financial', value: '$650,000', page: 1, confidence: 97 },
    { category: 'Date', value: 'December 31, 2024', page: 1, confidence: 99 },
    { category: 'Percentage', value: '22.9%', page: 1, confidence: 97 },
    { category: 'Percentage', value: '84.2%', page: 1, confidence: 95 },
  ];

  const handleExport = (format) => {
    alert(`Exporting as ${format}...`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PDF Analysis Results</h1>
              <p className="text-sm text-gray-600">Document_Report_2024.pdf</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2">
              <span>⚠️</span>
              <span>Report Error</span>
            </button>
            <div className="relative">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">👤</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Document Preview */}
        <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm">
                Page <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="w-12 text-center border rounded mx-1"
                  min="1"
                  max="15"
                /> of 15
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(15, currentPage + 1))}
                disabled={currentPage === 15}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                →
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-sm w-16 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
              <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 ml-2">
                <span>🔄</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
              <div className="border border-gray-300 p-8">
                <h2 className="text-2xl font-bold mb-6">QUARTERLY FINANCIAL REPORT</h2>
                <p className="text-sm text-gray-600 mb-6">Q4 2024 Performance Analysis</p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Executive Summary</h3>
                    <p className="text-sm text-gray-700">
                      The fourth quarter of 2024 demonstrated strong revenue growth of 15.2%
                      compared to the previous quarter, with total revenue reaching $2.4 million.
                      Operating expenses increased by 9.3%, resulting in improved operational
                      efficiency.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">Key Performance Indicators</h3>
                    <table className="w-full border border-gray-300 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 p-2 text-left">Metric</th>
                          <th className="border border-gray-300 p-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">Total Revenue:</td>
                          <td className="border border-gray-300 p-2 text-right bg-yellow-100">
                            $2,400,000
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Operating Expenses:</td>
                          <td className="border border-gray-300 p-2 text-right">$1,850,000</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Net Profit:</td>
                          <td className="border border-gray-300 p-2 text-right bg-yellow-100">
                            $550,000
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Profit Margin:</td>
                          <td className="border border-gray-300 p-2 text-right bg-yellow-100">
                            22.9%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">Market Analysis</h3>
                    <p className="text-sm text-gray-700">
                      Market conditions remained favorable throughout Q4, with customer
                      acquisition costs decreasing by 12% and retention rates improved to 84.2%.
                      The competitive landscape showed increased activity in our primary market
                      segments.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-8">
                  Document generated on December 31, 2024 | Page 1 of 15
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Data Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Extracted Data</h2>
            <p className="text-sm text-gray-600 mt-1">✓ Processed • 156 entries extracted</p>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                All Categories
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>All Categories</option>
                <option>Financial</option>
                <option>Percentage</option>
                <option>Date</option>
              </select>
            </div>

            <div className="space-y-3">
              {extractedData.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-700">
                        <span className="text-sm">👁️</span>
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-700">
                        <span className="text-sm">✏️</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-2">{item.value}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Page {item.page}</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className="bg-green-600 h-1.5 rounded-full"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span>{item.confidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Processing Statistics</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">156</p>
                <p className="text-xs text-gray-600">Total Extracted</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-600">94%</p>
                <p className="text-xs text-gray-600">Avg Confidence</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">2.3s</p>
                <p className="text-xs text-gray-600">Processing Time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;