'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BackgroundPDFFillerProps {
  userData: any;
  onFilledPDF?: (pdfBlob: Blob) => void;
  onComplete?: () => void;
}

export default function BackgroundPDFFiller({ userData, onFilledPDF, onComplete }: BackgroundPDFFillerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    filledFields: string[];
    error?: string;
  } | null>(null);
  const [filledPdfBlob, setFilledPdfBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      return;
    }

    // Start processing immediately
    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userData', JSON.stringify(userData));

      const response = await fetch('/api/pdf/simple-fill', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Convert base64 to blob
        const pdfBytes = Uint8Array.from(atob(data.filledPdf), c => c.charCodeAt(0));
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setFilledPdfBlob(blob);
        setResult({
          success: true,
          filledFields: data.filledFields
        });

        if (onFilledPDF) {
          onFilledPDF(blob);
        }

        // Auto-download the filled PDF
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filled_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Call completion callback
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 1000); // Small delay to show success state
        }
      } else {
        setResult({
          success: false,
          filledFields: [],
          error: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('PDF filling error:', error);
      setResult({
        success: false,
        filledFields: [],
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

      {/* Simple upload button */}
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
            <span>✅ PDF filled and downloaded automatically</span>
          ) : (
            <span>❌ {result.error || 'Processing failed'}</span>
          )}
        </div>
      )}
    </div>
  );
}
