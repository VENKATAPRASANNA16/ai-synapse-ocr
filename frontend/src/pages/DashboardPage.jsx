import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Search, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analyticsService } from '../services/analyticsService';
import { uploadService } from '../services/uploadService';
import { Loading } from '../components/Common/Loading';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, docsData] = await Promise.all([
        analyticsService.getMyStats(),
        uploadService.getMyDocuments(0, 5)
      ]);
      setStats(statsData);
      setRecentDocuments(docsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  const quickActions = [
    {
      name: 'Upload Document',
      description: 'Upload a new document for processing',
      icon: Upload,
      href: '/upload',
      color: 'bg-blue-500'
    },
    {
      name: 'Query Documents',
      description: 'Search your processed documents',
      icon: Search,
      href: '/query',
      color: 'bg-purple-500'
    },
    {
      name: 'My Files',
      description: 'View all your documents',
      icon: FileText,
      href: '/my-files',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your document processing activity
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.documents.total}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.documents.completed} completed
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Queries</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.queries.total}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {stats.queries.recent_7_days} this week
                </p>
              </div>
              <Search className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.accuracy.average}%
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Excellent quality
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Storage Used</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.storage.used_mb}
                </p>
                <p className="text-sm text-gray-600 mt-1">MB</p>
              </div>
              <FileText className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {action.name}
                </h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
            <Link to="/my-files" className="text-sm text-primary-600 hover:text-primary-500">
              View all →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentDocuments.map((doc) => (
                <div key={doc._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.metadata.original_filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        {doc.metadata.page_count} pages
                      </span>
                      {doc.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Usage Limits */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Usage Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">Upload Limit</span>
                <span className="text-sm font-medium text-blue-900">
                  {stats.limits.uploads_remaining} remaining
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.limits.uploads_remaining / 100) * 100}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">Query Limit</span>
                <span className="text-sm font-medium text-blue-900">
                  {stats.limits.queries_remaining} remaining
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.limits.queries_remaining / 1000) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};