import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ocrService } from '../services/ocrService';

const OCRProcessingPage = () => {
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('upload');
  const [estimatedTime, setEstimatedTime] = useState('1m 56s');
  const navigate = useNavigate();

  useEffect(() => {
    simulateProcessing();
  }, []);

  const simulateProcessing = () => {
    const steps = [
      { name: 'upload', label: 'Upload Complete', duration: 1000 },
      { name: 'processing', label: 'Text Recognition', duration: 3000 },
      { name: 'download', label: 'Download Ready', duration: 1000 },
    ];

    let currentProgress = 0;
    let stepIndex = 0;

    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress >= 33 && stepIndex === 0) {
        setCurrentStep('processing');
        stepIndex = 1;
      } else if (currentProgress >= 66 && stepIndex === 1) {
        setCurrentStep('download');
        stepIndex = 2;
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          navigate('/results/1');
        }, 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📄</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Processing Your Document</h1>
          <p className="text-gray-600 mt-2">
            Please wait while we extract text from your document using OCR technology
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              <span className="text-orange-500 mr-2">⏱️</span>
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Time Remaining</p>
                <p className="text-xs text-gray-600">Based on document complexity</p>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-900">{estimatedTime}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">✓</span>
              <div>
                <p className="text-sm font-medium text-green-800">Text Recognition</p>
                <p className="text-xs text-green-700">
                  Analyzing characters and extracting readable text...
                </p>
              </div>
            </div>
          </div>

          <div
            className={`${
              currentStep === 'upload'
                ? 'bg-green-50 border-green-500'
                : 'bg-white border-gray-200'
            } border-l-4 p-4 rounded`}
          >
            <div className="flex items-center">
              <span className={`${currentStep === 'upload' ? 'text-green-600' : 'text-gray-400'} text-2xl mr-3`}>
                {currentStep === 'upload' ? '✓' : '○'}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">Upload Complete</p>
                <p className="text-xs text-gray-600">File received</p>
              </div>
            </div>
          </div>

          <div
            className={`${
              currentStep === 'processing'
                ? 'bg-blue-50 border-blue-500'
                : currentStep === 'download'
                ? 'bg-green-50 border-green-500'
                : 'bg-white border-gray-200'
            } border-l-4 p-4 rounded`}
          >
            <div className="flex items-center">
              <span
                className={`${
                  currentStep === 'processing'
                    ? 'text-blue-600'
                    : currentStep === 'download'
                    ? 'text-green-600'
                    : 'text-gray-400'
                } text-2xl mr-3`}
              >
                {currentStep === 'processing' ? (
                  <div className="animate-spin">⚙️</div>
                ) : currentStep === 'download' ? (
                  '✓'
                ) : (
                  '○'
                )}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">Processing</p>
                <p className="text-xs text-gray-600">In progress</p>
              </div>
            </div>
          </div>

          <div
            className={`${
              currentStep === 'download'
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200'
            } border-l-4 p-4 rounded`}
          >
            <div className="flex items-center">
              <span className={`${currentStep === 'download' ? 'text-gray-600' : 'text-gray-400'} text-2xl mr-3`}>
                {currentStep === 'download' ? '⏳' : '○'}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">Download Ready</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="text-green-600 mr-1">🔒</span>
              <span>Secure Processing</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-1">🗑️</span>
              <span>Auto-delete after 24h</span>
            </div>
            <div className="flex items-center">
              <span className="text-purple-600 mr-1">🔐</span>
              <span>No registration required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRProcessingPage;