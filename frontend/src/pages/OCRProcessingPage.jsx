import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';
import { useOCR } from '../hooks/useOCR';
import { ProcessingMetrics } from '../components/OCR/ProcessingMetrics';
import { Loading } from '../components/Common/Loading';

export const OCRProcessingPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { processing, status, error, startProcessing, reset } = useOCR();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleStartProcessing = async () => {
    setHasStarted(true);
    await startProcessing(documentId);
  };

  const handleViewResults = () => {
    navigate(`/results/${documentId}`);
  };

  const getStatusMessage = () => {
    if (!status) return 'Ready to start processing';
    
    switch (status.status) {
      case 'preprocessing':
        return 'Preprocessing document...';
      case 'ocr_processing':
        return 'Extracting text with OCR engines...';
      case 'table_extraction':
        return 'Detecting and extracting tables...';
      case 'embedding_generation':
        return 'Generating embeddings for search...';
      case 'completed':
        return 'Processing completed successfully!';
      case 'failed':
        return 'Processing failed';
      default:
        return status.status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/my-files')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OCR Processing</h1>
          <p className="text-gray-600">Document ID: {documentId}</p>
        </div>
      </div>

      {/* Processing Status */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          {processing ? (
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
          ) : status?.status === 'completed' ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : status?.status === 'failed' ? (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          )}

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {getStatusMessage()}
          </h2>
          
          {error && (
            <p className="text-red-600 mb-4">{error}</p>
          )}

          {!hasStarted && !status && (
            <button
              onClick={handleStartProcessing}
              disabled={processing}
              className="btn-primary mt-4"
            >
              Start Processing
            </button>
          )}

          {status?.status === 'completed' && (
            <button
              onClick={handleViewResults}
              className="btn-primary mt-4"
            >
              View Results
            </button>
          )}

          {status?.status === 'failed' && (
            <button
              onClick={() => {
                reset();
                setHasStarted(false);
              }}
              className="btn-secondary mt-4"
            >
              Try Again
            </button>
          )}
        </div>

        {status && <ProcessingMetrics status={status} />}
      </div>

      {/* Processing Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Steps</h3>
        
        <div className="space-y-4">
          {[
            { name: 'Preprocessing', status: 'preprocessing' },
            { name: 'OCR Text Extraction', status: 'ocr_processing' },
            { name: 'Table Detection', status: 'table_extraction' },
            { name: 'Embedding Generation', status: 'embedding_generation' },
            { name: 'Completed', status: 'completed' }
          ].map((step, index) => {
            const isActive = status?.status === step.status;
            const isCompleted = status?.status === 'completed' || 
              (status && ['preprocessing', 'ocr_processing', 'table_extraction', 'embedding_generation'].indexOf(status.status) > 
               ['preprocessing', 'ocr_processing', 'table_extraction', 'embedding_generation'].indexOf(step.status));

            return (
              <div key={step.name} className="flex items-center space-x-4">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isCompleted ? 'bg-green-500' : isActive ? 'bg-primary-500' : 'bg-gray-200'}
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-gray-500 text-sm">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};