// features/pdf-upload/components/PDFUploader.tsx
'use client';

import React, { useState, useRef } from 'react';

interface PDFUploaderProps {
  taskId?: number;
  documentType?: string;
  onUploadComplete?: (result: any) => void;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  taskId,
  documentType,
  onUploadComplete
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 200);

      // Upload and analyze
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('taskId', taskId?.toString() || '');
      formData.append('documentType', documentType || 'other');

      const response = await fetch('/api/pdf/analyze', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setResult(data);
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload and analyze PDF. Please try again.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!result && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}
          `}
          onClick={handleButtonClick}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium mb-2">
                {analyzing ? 'Analyzing PDF...' : 'Uploading...'}
              </p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}%</p>
            </div>
          ) : (
            <>
              <svg 
                className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Upload your PDF
              </h3>
              <p className="text-gray-500 mb-4">
                Drop your PDF here or click to browse
              </p>
              <button
                type="button"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
              >
                Choose PDF
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Supported: PDF files up to 10MB
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Result */}
      {result && (
        <div className="mt-4">
          <AnalysisResult result={result} onReset={() => setResult(null)} />
        </div>
      )}
    </div>
  );
};

// Analysis Result Component
interface AnalysisResultProps {
  result: any;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">✅ PDF Analyzed</h3>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Upload another
        </button>
      </div>

      {/* File Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-2">
          <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-gray-900">{result.file_name}</span>
        </div>
        <p className="text-sm text-gray-600">
          Size: {(result.file_size / 1024).toFixed(1)} KB • 
          Pages: {result.analysis_result?.page_count || 'Unknown'}
        </p>
      </div>

      {/* Form Type */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600 font-medium mb-1">Form Type</p>
          <p className="text-lg font-semibold text-blue-900">
            {result.is_fillable ? '📝 Fillable Form' : '📄 Flat PDF'}
          </p>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 font-medium mb-1">Detected Fields</p>
          <p className="text-lg font-semibold text-green-900">
            {result.analysis_result?.field_count || 0} fields
          </p>
        </div>
      </div>

      {/* Fields List */}
      {result.analysis_result?.detected_fields && result.analysis_result.detected_fields.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Detected Fields:</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {result.analysis_result.detected_fields.slice(0, 10).map((field: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {field.field_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Type: {field.field_type}
                    {field.auto_fillable && ' • Auto-fillable'}
                  </p>
                </div>
                {field.auto_fillable && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    ✓ Ready
                  </span>
                )}
              </div>
            ))}
            {result.analysis_result.detected_fields.length > 10 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                + {result.analysis_result.detected_fields.length - 10} more fields
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {result.is_fillable && (
          <button className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
            🤖 Auto-Fill with my data
          </button>
        )}
        <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          👁️ Preview
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Next step:</strong> {
            result.is_fillable 
              ? "Click 'Auto-Fill' to automatically fill the form with your profile data."
              : "This is a flat PDF. We can help you fill it manually with guided steps."
          }
        </p>
      </div>
    </div>
  );
};

export default PDFUploader;