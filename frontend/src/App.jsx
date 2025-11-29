import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OCRProvider } from './context/OCRContext';
import { QueryProvider } from './context/QueryContext';
import { UploadProvider } from './context/UploadContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import OCRProcessingPage from './pages/OCRProcessingPage';
import QueryPage from './pages/QueryPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MyFilesPage from './pages/MyFilesPage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

// Auth Components
import GuestAccess from './components/Auth/GuestAccess';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <OCRProvider>
        <QueryProvider>
          <UploadProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/guest" element={<GuestAccess />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
                <Route path="/processing" element={<PrivateRoute><OCRProcessingPage /></PrivateRoute>} />
                <Route path="/query" element={<PrivateRoute><QueryPage /></PrivateRoute>} />
                <Route path="/results/:id" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
                <Route path="/my-files" element={<PrivateRoute><MyFilesPage /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

                {/* 404 */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" />} />
              </Routes>
            </Router>
          </UploadProvider>
        </QueryProvider>
      </OCRProvider>
    </AuthProvider>
  );
}

export default App;