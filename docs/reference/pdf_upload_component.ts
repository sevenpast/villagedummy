'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Download, Eye } from 'lucide-react';

interface PDFField {
  name: string;
  originalName: string;
  translation: string;
  value: string;
  confidence: number;
  isAutoFilled: boolean;
  fieldType: 'text' | 'date' | 'checkbox' | 'select';
}

interface PDFAnalysisResult {
  fields: PDFField[];
  detectedLanguage: string;
  formType: string;
  confidence: number;
  missingFields: string[];
  requiredDocuments: string[];
}

export default function PDFUploadAndFill({ 
  userId, 
  taskId,
  userProfile 
}: { 
  userId: string; 
  taskId: number;
  userProfile: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PDFAnalysisResult | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Auto-upload and analyze
    await uploadAndAnalyze(selectedFile);
  };

  const uploadAndAnalyze = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // 1. Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('taskId', taskId.toString());

      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const { documentId, storagePath } = await uploadRes.json();

      setUploading(false);
      setAnalyzing(true);

      // 2. Analyze PDF with AI
      const analyzeRes = await fetch('/api/pdf/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          storagePath,
          userProfile,
          taskId
        })
      });

      if (!analyzeRes.ok) {
        throw new Error('Analysis failed');
      }

      const analysis: PDFAnalysisResult = await analyzeRes.json();
      setAnalysisResult(analysis);

      // Initialize edited fields with AI-filled values
      const initialFields: Record<string, string> = {};
      analysis.fields.forEach(field => {
        initialFields[field.name] = field.value;
      });
      setEditedFields(initialFields);

    } catch (err: any) {
      setError(err.message || 'Failed to process PDF');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleFieldEdit = (fieldName: string, value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const generateFilledPDF = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/pdf/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          taskId,
          fields: editedFields
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate filled PDF');
      }

      const { pdfUrl } = await res.json();
      setFilledPdfUrl(pdfUrl);

    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Upload School Registration Form
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PDF only, max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
            Choose File
          </button>
        </div>
      )}

      {/* File Selected */}
      {file && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          {!analyzing && !analysisResult && (
            <button
              onClick={() => {
                setFile(null);
                setAnalysisResult(null);
                setError(null);
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Processing Status */}
      {(uploading || analyzing) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-lg font-medium text-blue-900">
            {uploading && 'Uploading PDF...'}
            {analyzing && 'Analyzing form with AI...'}
          </p>
          <p className="text-sm text-blue-700 mt-2">
            This may take 10-20 seconds
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Result - Field Editor */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Form Analyzed Successfully!</p>
                <p className="text-sm text-green-700 mt-1">
                  Detected: {analysisResult.formType} ({analysisResult.detectedLanguage})
                </p>
                <p className="text-sm text-green-700">
                  Auto-filled {analysisResult.fields.filter(f => f.isAutoFilled).length}/{analysisResult.fields.length} fields
                </p>
              </div>
            </div>
          </div>

          {/* Missing Fields Warning */}
          {analysisResult.missingFields.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Some fields need your input:</p>
                  <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                    {analysisResult.missingFields.map((field, idx) => (
                      <li key={idx}>• {field}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Field Editor */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Review & Edit Form Fields
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                All fields translated to English. Green = auto-filled, Yellow = needs input
              </p>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {analysisResult.fields.map((field, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${
                  field.isAutoFilled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <label className="block">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {field.translation}
                      </span>
                      <span className="text-xs text-gray-500">
                        {field.originalName}
                      </span>
                    </div>
                    
                    {field.fieldType === 'date' ? (
                      <input
                        type="date"
                        value={editedFields[field.name] || ''}
                        onChange={(e) => handleFieldEdit(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editedFields[field.name] || ''}
                        onChange={(e) => handleFieldEdit(field.name, e.target.value)}
                        placeholder={field.isAutoFilled ? '' : 'Enter value...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    )}

                    {field.isAutoFilled && field.confidence < 0.9 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠️ Please verify this value
                      </p>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents */}
          {analysisResult.requiredDocuments.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                📎 Documents you'll need to attach:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {analysisResult.requiredDocuments.map((doc, idx) => (
                  <li key={idx}>• {doc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={generateFilledPDF}
              disabled={generating}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Filled PDF
                </>
              )}
            </button>

            {filledPdfUrl && (
              <>
                <a
                  href={filledPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </a>
                <a
                  href={filledPdfUrl}
                  download
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
