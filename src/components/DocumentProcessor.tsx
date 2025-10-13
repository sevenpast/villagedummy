'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DocumentProcessorProps {
  taskId?: string;
  onProcessingComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function DocumentProcessor({ 
  taskId, 
  onProcessingComplete, 
  onError 
}: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show error message instead of processing
    const errorMsg = "Sorry, this function still doesn't work as wished. I am doing my best to fix it as soon as possible.";
    setError(errorMsg);
    onError?.(errorMsg);
    return;

    // Original validation code (commented out)
    /*
    // Validate file type
    if (file.type !== 'application/pdf') {
      const errorMsg = 'Please select a PDF file';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 10MB';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      if (taskId) {
        formData.append('taskId', taskId);
      }

      // Call the PDF OCR Dynamic API
      const response = await fetch('/api/pdf-ocr-dynamic', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process PDF');
      }

      // Enhanced result processing
      const enhancedResult = {
        ...result,
        processing_timestamp: new Date().toISOString(),
        file_size: file.size,
        file_type: file.type,
        user_id: user.id
      };

      setProcessingResult(enhancedResult);
      onProcessingComplete?.(enhancedResult);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while processing the PDF';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Document processing error:', err);
    } finally {
      setIsProcessing(false);
    }
    */
  };

  const handleRetry = () => {
    setError(null);
    setProcessingResult(null);
    fileInputRef.current?.click();
  };

  const handleDownloadFilledPdf = () => {
    if (processingResult?.filled_pdf_url) {
      window.open(processingResult.filled_pdf_url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isProcessing}
        />
        
        {!isProcessing && !processingResult && (
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload PDF Document
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Upload a PDF form to automatically fill it with your profile data
            </p>
            <p className="text-xs text-gray-400">
              Supported: PDF files up to 10MB
            </p>
          </div>
        )}

        {isProcessing && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Processing your document...</p>
            <p className="text-xs text-gray-500">This may take a few moments</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94l-1.72-1.72z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleRetry}
                  className="text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {processingResult && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Document Processed Successfully!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your document has been analyzed and filled with your profile data.</p>
                <div className="mt-2 space-y-1">
                  <p><strong>Confidence Score:</strong> {Math.round((processingResult.confidence_score || 0) * 100)}%</p>
                  <p><strong>Processing Time:</strong> {processingResult.processing_time || 'N/A'}</p>
                  <p><strong>Processing Method:</strong> {processingResult.processing_method || 'N/A'}</p>
                  <p><strong>Document Type:</strong> {processingResult.document_type || 'N/A'}</p>
                  <p><strong>Language Detected:</strong> {processingResult.language_detected || 'N/A'}</p>
                  <p><strong>File Size:</strong> {(processingResult.file_size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleDownloadFilledPdf}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Filled PDF
                </button>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Process Another Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swiss Validation Display */}
      {processingResult?.swiss_validation && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Swiss Data Validation</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${processingResult.swiss_validation.postal_code_valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-blue-800">Postal Code</span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${processingResult.swiss_validation.canton_valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-blue-800">Canton</span>
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

      {/* Extracted Data Display */}
      {processingResult?.extracted_data && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Extracted Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries(processingResult.extracted_data).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="text-gray-900 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Fields Display */}
      {processingResult?.missing_fields && processingResult.missing_fields.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Missing Information</h4>
          <p className="text-sm text-yellow-800 mb-2">The following fields could not be extracted from your profile:</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            {processingResult.missing_fields.map((field: string, index: number) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {field.replace(/([A-Z])/g, ' $1').trim()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {processingResult?.recommendations && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations</h4>
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
