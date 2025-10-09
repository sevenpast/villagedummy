'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SimplePDFUploadProps {
  userData: any;
  onFilledPDF?: (pdfBlob: Blob) => void;
  onComplete?: () => void;
}

export default function SimplePDFUpload({ userData, onFilledPDF, onComplete }: SimplePDFUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult({
        success: true
      });

      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('PDF processing error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={triggerFileSelect}
        disabled={isProcessing}
        className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing PDF...
          </>
        ) : result?.success ? (
          <>
            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
            PDF Processed Successfully
          </>
        ) : result?.success === false ? (
          <>
            <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
            Processing Failed - Try Again
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Upload PDF Form
          </>
        )}
      </button>

      {/* Minimal success/error feedback */}
      {result && (
        <div className={`mt-3 text-sm text-center ${
          result.success ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.success ? (
            <span>✅ PDF processed successfully</span>
          ) : (
            <span>❌ {result.error || 'Processing failed'}</span>
          )}
        </div>
      )}
    </div>
  );
}
