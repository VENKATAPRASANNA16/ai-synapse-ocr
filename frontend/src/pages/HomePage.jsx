import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Unlock Full Processing Power
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Sign in to process unlimited files and access advanced features
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 shadow-lg"
            >
              Sign up Now
            </Link>
            <Link
              to="/login"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 border-2 border-indigo-600 shadow-lg"
>
Sign In
</Link>
</div>
</div>
    {/* Features Grid */}
    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚡</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Processing</h3>
        <p className="text-gray-600">
          Quick document analysis and extraction with advanced OCR technology
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Upload</h3>
        <p className="text-gray-600">
          Your documents are encrypted and protected with enterprise-grade security
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Table Detection</h3>
        <p className="text-gray-600">
          Automatically identify and extract tables from your documents
        </p>
      </div>
    </div>

    {/* Additional Features */}
    <div className="mt-20">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Why Choose AI Synapse?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Multi-Engine AI Processing
            </h3>
            <p className="text-gray-600">
              Choose from Tesseract v5, PaddleOCR, EasyOCR, or Azure Cognitive Services
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              AI-Powered Chat
            </h3>
            <p className="text-gray-600">
              Ask questions about your documents and get intelligent answers with citations
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Advanced Analytics
            </h3>
            <p className="text-gray-600">
              Track processing metrics, accuracy rates, and performance over time
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📥</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Export Options
            </h3>
            <p className="text-gray-600">
              Download results in multiple formats including PDF, Excel, and JSON
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
);
};
export default HomePage;