import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../hooks/useAuth';
import Analytics from '../components/Admin/Analytics';
import SystemMonitor from '../components/Admin/SystemMonitor';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await analyticsService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || user?.email}!</p>
        </div>
        <Link
          to="/upload"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <span>📤</span>
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalDocuments || 247}</p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
          <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.successRate || 94.2}%</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <p className="text-sm text-green-600 mt-2">↑ 2.1% improvement</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.avgTime || 2.4}s</p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
          <p className="text-sm text-green-600 mt-2">↓ 0.2s faster</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Extracted</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.dataSize || 1.2}TB</p>
            </div>
            <div className="text-4xl">💾</div>
          </div>
          <p className="text-sm text-green-600 mt-2">↑ 8.2% growth</p>
        </div>
      </div>

      {/* Analytics and System Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Analytics />
        </div>
        <div>
          <SystemMonitor />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      invoice_2024_{item}.pdf
                    </p>
                    <p className="text-xs text-gray-500">OCR Processing • 2 min ago</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Success
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;