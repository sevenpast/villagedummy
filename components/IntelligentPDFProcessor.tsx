'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Edit3, Save, X } from 'lucide-react';
import { PDFField } from '../../services/pdf-form-analyzer';

interface IntelligentPDFProcessorProps {
  userData: any;
  onFilledPDF?: (pdfBlob: Blob) => void;
  onComplete?: () => void;
}

export default function IntelligentPDFProcessor({ userData, onFilledPDF, onComplete }: IntelligentPDFProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editableFields, setEditableFields] = useState<PDFField[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [filledPdfBlob, setFilledPdfBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      return;
    }

    setIsProcessing(true);
    setAnalysisResult(null);
    setEditableFields([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userData', JSON.stringify(userData));

      const response = await fetch('/api/pdf/analyze-form', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.analysis);
        setEditableFields(data.analysis.fields);
        console.log('✅ PDF analysis completed:', data.analysis);
      } else {
        console.error('❌ PDF analysis failed:', data.error);
        // Show error to user
        setAnalysisResult({
          documentType: 'Error',
          language: 'en',
          confidence: 0,
          fields: [],
          extractedText: '',
          error: data.error || 'Analysis failed'
        });
      }
    } catch (error) {
      console.error('❌ PDF processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (fieldName: string, newValue: string | boolean) => {
    setEditableFields(prev => 
      prev.map(field => 
        field.name === fieldName 
          ? { ...field, value: newValue }
          : field
      )
    );
  };

  const handleFillPDF = async () => {
    if (!analysisResult || !editableFields.length) return;

    setIsProcessing(true);

    try {
      // Create form data with the analyzed fields
      const formData = new FormData();
      formData.append('file', fileInputRef.current?.files?.[0] as File);
      formData.append('fields', JSON.stringify(editableFields));

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

        // Auto-download the filled PDF
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filled_${fileInputRef.current?.files?.[0]?.name || 'document.pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (onFilledPDF) {
          onFilledPDF(blob);
        }

        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('❌ PDF filling error:', error);
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
      {!analysisResult && (
        <button
          onClick={triggerFileSelect}
          disabled={isProcessing}
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing PDF...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload PDF Form
            </>
          )}
        </button>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Error State */}
          {analysisResult.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Analysis Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{analysisResult.error}</p>
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setEditableFields([]);
                    }}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {analysisResult.documentType}
                </h3>
                <div className="text-sm text-gray-600">
                  <p>Fields found: {analysisResult.fields.length}</p>
                </div>
              </div>

          {/* Editable Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Form Fields</h4>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {isEditing ? 'Done Editing' : 'Edit Fields'}
              </button>
            </div>

            {editableFields.map((field, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>

                {field.type === 'checkbox' ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.value === true || field.value === 'true'}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Check this box</span>
                  </label>
                ) : (
                  <input
                    type="text"
                    value={field.value as string}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleFillPDF}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Filling PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Fill & Download PDF
                </>
              )}
            </button>

            <button
              onClick={() => {
                setAnalysisResult(null);
                setEditableFields([]);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
