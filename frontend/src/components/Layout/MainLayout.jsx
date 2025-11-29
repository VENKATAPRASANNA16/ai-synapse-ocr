import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Common/Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; 2025 AI Synapse. All rights reserved.</p>
            <div className="mt-4 space-x-6">
              <a href="/privacy" className="hover:text-indigo-400">Privacy Policy</a>
              <a href="/terms" className="hover:text-indigo-400">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;