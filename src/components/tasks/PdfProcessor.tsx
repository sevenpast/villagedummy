'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DocumentProcessor from '@/components/DocumentProcessor';

interface PdfProcessorProps {
  taskId: string;
  onProcessingComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function PdfProcessor({ 
  taskId, 
  onProcessingComplete, 
  onError 
}: PdfProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessingComplete = (result: any) => {
    setProcessingResult(result);
    setIsProcessing(false);
    onProcessingComplete?.(result);
  };

  const handleProcessingError = (error: string) => {
    setError(error);
    setIsProcessing(false);
    onError?.(error);
  };

  const handleRetry = () => {
    setError(null);
    setProcessingResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📄 PDF Form Processing
        </h3>
        <p className="text-sm text-blue-800">
          Upload your Swiss municipality registration form and we'll automatically fill it with your profile data using AI-powered OCR technology.
        </p>
      </div>

      {/* Document Processor */}
      <DocumentProcessor
        taskId={taskId}
        onProcessingComplete={handleProcessingComplete}
        onError={handleProcessingError}
      />

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
            <span className="text-sm text-yellow-800">
              Processing your document with AI-powered OCR...
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Processing Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {processingResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">Document Processed Successfully!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your form has been analyzed and filled with your profile data.
              </p>
              
              {/* Processing Details */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Confidence:</span> {Math.round((processingResult.confidence_score || 0) * 100)}%
                </div>
                <div>
                  <span className="font-medium">Method:</span> {processingResult.processing_method || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {processingResult.document_type || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Language:</span> {processingResult.language_detected || 'N/A'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => window.open(processingResult.filled_pdf_url, '_blank')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Filled Form
                </button>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Process Another Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swiss Validation */}
      {processingResult?.swiss_validation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Swiss Data Validation</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${processingResult.swiss_validation.postal_code_valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-blue-800">Postal Code Format</span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${processingResult.swiss_validation.canton_valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-blue-800">Canton Code</span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${processingResult.swiss_validation.date_format_valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-blue-800">Date Format</span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${processingResult.swiss_validation.permit_type_valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-blue-800">Permit Type</span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {processingResult?.recommendations && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Next Steps</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {processingResult.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
