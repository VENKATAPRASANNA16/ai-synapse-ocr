import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await analyticsService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalDocuments || 0}</p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+12% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.successRate || 0}%</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+2.1% improvement</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.avgProcessingTime || 0}s</p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
          <p className="text-sm text-green-600 mt-2">-0.2s faster</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Extracted</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.dataExtracted || 0} GB</p>
            </div>
            <div className="text-4xl">💾</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+8.2% growth</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;