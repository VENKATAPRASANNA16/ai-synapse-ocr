import React from 'react';
import { Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './components/Layout/DashboardLayout';
import MainLayout from './components/Layout/MainLayout';

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

const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: <DashboardLayout />,
    children: [
      { path: '/app/dashboard', element: <DashboardPage /> },
      { path: '/app/upload', element: <UploadPage /> },
      { path: '/app/processing', element: <OCRProcessingPage /> },
      { path: '/app/query', element: <QueryPage /> },
      { path: '/app/results/:id', element: <ResultsPage /> },
      { path: '/app/analytics', element: <AnalyticsPage /> },
      { path: '/app/my-files', element: <MyFilesPage /> },
      { path: '/app/settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/404',
    element: <NotFound />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
];

export default routes;