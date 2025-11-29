import React from 'react';
import { Link } from 'react-router-dom';

const GuestAccess = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">📄</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">AI Synapse</h2>
          <p className="mt-2 text-gray-600">Extract text from documents with AI</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Guest Access Limitations</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload one document only</li>
                  <li>View limited metadata</li>
                  <li>No document history saved</li>
                  <li>No advanced features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            to="/upload"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue as Guest
          </Link>

          <div className="text-center text-sm text-gray-600">or</div>

          <Link
            to="/login"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign In to Your Account
          </Link>

          <Link
            to="/register"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Create New Account
          </Link>
        </div>

        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-600 text-center mb-4">Full account benefits:</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-center">
              <span className="mr-2">∞</span>
              <span>Unlimited uploads</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📊</span>
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📁</span>
              <span>Document history</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📥</span>
              <span>Export options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestAccess;