import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
try {
setLoading(true);
const data = await analyticsService.getDashboardStats();
setStats(data);
} catch (error) {
console.error('Failed to load analytics:', error);
} finally {
setLoading(false);
}
};
if (loading) {
return (
<div className="flex items-center justify-center h-full">
<div className="text-center">
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
<p className="mt-4 text-gray-600">Loading analytics...</p>
</div>
</div>
);
}
return (
<div className="space-y-6">
<div className="flex justify-between items-center">
<div>
<h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
<p className="text-gray-600 mt-1">Monitor your key performance metrics</p>
</div>
<div className="flex items-center space-x-3">
<select
value={timeRange}
onChange={(e) => setTimeRange(e.target.value)}
className="border border-gray-300 rounded-lg px-4 py-2"
>
<option value="7d">Last 7 days</option>
<option value="30d">Last 30 days</option>
<option value="90d">Last 90 days</option>
<option value="1y">Last year</option>
</select>
<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
📊 Export Report
</button>
</div>
</div>
  {/* Main Stats */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Total Documents</span>
        <span className="text-2xl">📄</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">24,847</p>
      <p className="text-sm text-green-600 mt-2">↑ 12.5% from last month</p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Accuracy Rate</span>
        <span className="text-2xl">✅</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">97.8%</p>
      <p className="text-sm text-green-600 mt-2">↑ 2.1% improvement</p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Processing Time</span>
        <span className="text-2xl">⚡</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">2.4s</p>
      <p className="text-sm text-green-600 mt-2">↓ 0.2s slower</p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Active Users</span>
        <span className="text-2xl">👥</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">1,847</p>
      <p className="text-sm text-green-600 mt-2">↑ 8.2% growth</p>
    </div>
  </div>

  {/* Charts Section */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* OCR Performance Trends */}
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">OCR Performance Trends</h2>
        <select className="text-sm border border-gray-300 rounded px-2 py-1">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>
      <div className="h-64 flex items-end space-x-2">
        {[97.2, 97.5, 97.8, 97.9, 98.1].map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-indigo-600 rounded-t" style={{ height: `${value}%` }} />
            <span className="text-xs text-gray-600 mt-2">Week {index + 1}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <span className="text-sm text-gray-600">Accuracy %</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-400 rounded-full" />
          <span className="text-sm text-gray-600">Processing Rate</span>
        </div>
      </div>
    </div>

    {/* Current Accuracy Gauge */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Current Accuracy</h2>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray="282.7"
              strokeDashoffset="28.27"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">98</p>
              <p className="text-sm text-gray-600">Target: 98%</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-600 mt-4">
        System is performing at optimal levels
      </p>
    </div>
  </div>

  {/* Document Types and Error Analysis */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Document Types */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Document Types Processed</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700">Invoices: 49.2%</span>
            <span className="text-gray-600">12,219 docs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '49.2%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700">Receipts: 19.8%</span>
            <span className="text-gray-600">4,920 docs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '19.8%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700">Contracts: 20.5%</span>
            <span className="text-gray-600">5,094 docs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20.5%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700">Forms: 10.5%</span>
            <span className="text-gray-600">2,609 docs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '10.5%' }} />
          </div>
        </div>
      </div>
    </div>

    {/* Error Analysis */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Error Analysis</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600">❌</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Damaged Images</p>
              <p className="text-xs text-gray-600">Poor quality scans</p>
            </div>
          </div>
          <span className="text-xl font-bold text-red-600">45%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Complex Layout</p>
              <p className="text-xs text-gray-600">Multi-column detection</p>
            </div>
          </div>
          <span className="text-xl font-bold text-orange-600">30%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">⚡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Language Detection</p>
              <p className="text-xs text-gray-600">Mixed language docs</p>
            </div>
          </div>
          <span className="text-xl font-bold text-yellow-600">15%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600">📝</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Other Issues</p>
              <p className="text-xs text-gray-600">Various errors</p>
            </div>
          </div>
          <span className="text-xl font-bold text-gray-600">10%</span>
        </div>
      </div>
    </div>
  </div>

  {/* Recent Activity Table */}
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">Recent User Activity</h2>
      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center space-x-1">
        <span>Search users...</span>
        <span>🔍</span>
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Document
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[
            {
              user: 'Sarah Johnson',
              action: 'OCR Processing',
              doc: 'invoice_2024_001.pdf',
              status: 'Success',
              time: '2 min ago',
              accuracy: '98.5%',
            },
            {
              user: 'Michael Chen',
              action: 'Batch Processing',
              doc: 'contracts_batch_01.zip',
              status: 'Processing',
              time: '5 min ago',
              accuracy: '-',
            },
            {
              user: 'Emma Davis',
              action: 'OCR Processing',
              doc: 'receipt_scan_023.jpg',
              status: 'Failed',
              time: '8 min ago',
              accuracy: '-',
            },
          ].map((activity, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium">
                      {activity.user.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {activity.user}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-indigo-600">
                  {activity.action === 'OCR Processing' && '🔄'}
                  {activity.action === 'Batch Processing' && '📦'}
                  {activity.action === 'Download' && '📥'}
                  <span className="ml-2">{activity.action}</span>
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.doc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    activity.status === 'Success'
                      ? 'bg-green-100 text-green-800'
                      : activity.status === 'Processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {activity.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {activity.accuracy}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <span className="text-sm text-gray-700">Showing 1 to 25 of 1,247 results</span>
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
          Previous
        </button>
        {[1, 2, 3, '...', 50].map((page, index) => (
          <button
            key={index}
            className={`px-3 py-1 border rounded text-sm ${
              page === 1
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
          Next
        </button>
      </div>
    </div>
  </div>
</div>
);
};
export default AnalyticsPage;