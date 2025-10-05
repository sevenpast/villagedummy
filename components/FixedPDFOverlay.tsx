'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, Loader2, Download, Eye, Maximize2, Minimize2 } from 'lucide-react';

interface PDFField {
  name: string;
  originalName: string;
  translation: string;
  value: string;
  confidence: number;
  isAutoFilled: boolean;
  fieldType: 'text' | 'date' | 'checkbox' | 'select';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
}

interface PDFAnalysisResult {
  fields: PDFField[];
  detectedLanguage: string;
  formType: string;
  confidence: number;
  missingFields: string[];
  requiredDocuments: string[];
  pageInfo?: Array<{
    pageNumber: number;
    width: number;
    height: number;
  }>;
}

interface PDFDimensions {
  width: number;
  height: number;
  scale: number;
}

export default function FixedPDFOverlay({ 
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<PDFDimensions | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate PDF dimensions based on container size
  const calculatePDFDimensions = useCallback(() => {
    if (!analysisResult?.pageInfo || !containerRef.current) return;

    const firstPage = analysisResult.pageInfo[0];
    if (!firstPage) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40; // Padding
    const containerHeight = container.clientHeight - 40;

    // Calculate scale to fit container while maintaining aspect ratio
    const scaleX = containerWidth / firstPage.width;
    const scaleY = containerHeight / firstPage.height;
    const scale = Math.min(scaleX, scaleY, 1.0); // Don't scale up beyond 100%

    setPdfDimensions({
      width: firstPage.width * scale,
      height: firstPage.height * scale,
      scale: scale
    });
  }, [analysisResult?.pageInfo]);

  // Recalculate dimensions when container size changes
  useEffect(() => {
    calculatePDFDimensions();
    
    const handleResize = () => calculatePDFDimensions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePDFDimensions]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview URL
    const previewUrl = URL.createObjectURL(selectedFile);
    setPdfPreviewUrl(previewUrl);

    // Auto-upload and analyze
    await uploadAndAnalyze(selectedFile);
  };

  const uploadAndAnalyze = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userProfile', JSON.stringify(userProfile));

      const response = await fetch('/api/pdf/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const analysis: PDFAnalysisResult = await response.json();
      setAnalysisResult(analysis);

      // Initialize edited fields
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

  const renderFieldOverlay = (field: PDFField) => {
    if (!pdfDimensions || !analysisResult?.pageInfo) return null;

    const pageInfo = analysisResult.pageInfo.find(p => p.pageNumber === field.position.page);
    if (!pageInfo) return null;

    // Convert PDF coordinates to HTML coordinates
    const scaleFactor = pdfDimensions.scale;
    const pdfX = field.position.x;
    const pdfY = pageInfo.height - field.position.y - field.position.height; // Flip Y coordinate
    const htmlX = pdfX * scaleFactor;
    const htmlY = pdfY * scaleFactor;
    const htmlWidth = field.position.width * scaleFactor;
    const htmlHeight = field.position.height * scaleFactor;

    const style = {
      position: 'absolute' as const,
      left: `${htmlX}px`,
      top: `${htmlY}px`,
      width: `${htmlWidth}px`,
      height: `${htmlHeight}px`,
      zIndex: 20,
    };

    if (field.fieldType === 'checkbox') {
      return (
        <input
          key={field.name}
          type="checkbox"
          checked={editedFields[field.name] === 'true'}
          onChange={(e) => handleFieldEdit(field.name, e.target.checked ? 'true' : 'false')}
          style={style}
          className="w-full h-full opacity-80"
          title={field.translation}
          aria-label={field.translation}
          placeholder={field.translation}
        />
      );
    }

    return (
      <input
        key={field.name}
        type={field.fieldType === 'date' ? 'date' : 'text'}
        value={editedFields[field.name] || ''}
        onChange={(e) => handleFieldEdit(field.name, e.target.value)}
        placeholder={field.isAutoFilled ? '' : 'Enter value...'}
        style={style}
        className={`w-full h-full px-1 py-0.5 text-xs border-2 rounded ${
          field.isAutoFilled 
            ? 'border-green-400 bg-green-50' 
            : 'border-yellow-400 bg-yellow-50'
        } focus:border-blue-500 focus:bg-white focus:outline-none`}
        title={field.translation}
        aria-label={field.translation}
      />
    );
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
            Upload PDF with Overlay Editor
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
                if (pdfPreviewUrl) {
                  URL.revokeObjectURL(pdfPreviewUrl);
                  setPdfPreviewUrl(null);
                }
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
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* PDF Overlay Editor */}
      {analysisResult && pdfPreviewUrl && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
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

          {/* PDF Overlay Container */}
          <div 
            ref={containerRef}
            className={`relative border border-gray-300 rounded-lg overflow-auto ${
              isFullscreen ? 'fixed inset-4 z-50 bg-white' : ''
            }`}
            style={{
              height: isFullscreen ? 'calc(100vh - 2rem)' : '600px',
              width: '100%'
            }}
          >
            {/* PDF Preview */}
            <div className="flex justify-center items-start p-4">
              <div 
                className="relative"
                style={{
                  width: pdfDimensions?.width || 'auto',
                  height: pdfDimensions?.height || 'auto'
                }}
              >
                <iframe
                  src={pdfPreviewUrl}
                  className="border border-gray-300"
                  style={{
                    width: pdfDimensions?.width || '100%',
                    height: pdfDimensions?.height || '600px',
                    transform: `scale(${pdfDimensions?.scale || 1})`,
                    transformOrigin: 'top left'
                  }}
                  title="PDF Preview"
                />
                
                {/* Field Overlays */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: `scale(${pdfDimensions?.scale || 1})`,
                    transformOrigin: 'top left'
                  }}
                >
                  {analysisResult.fields.map(field => (
                    <div key={field.name} className="pointer-events-auto">
                      {renderFieldOverlay(field)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Debug Info */}
            {pdfDimensions && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                <div>Scale: {Math.round(pdfDimensions.scale * 100)}%</div>
                <div>PDF: {Math.round(pdfDimensions.width)}x{Math.round(pdfDimensions.height)}</div>
                <div>Fields: {analysisResult.fields.length}</div>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded hover:bg-opacity-90"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

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
