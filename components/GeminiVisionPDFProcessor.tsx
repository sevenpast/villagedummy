'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, Download, Brain, Zap, Eye } from 'lucide-react';

interface TranslatedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FormField {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
}

interface ProcessedPDFData {
  translatedTexts: TranslatedText[];
  formFields: FormField[];
  totalPages: number;
  originalFileName: string;
}

interface GeminiVisionPDFProcessorProps {
  userId: string;
  taskId: number;
  userProfile: any;
}

export default function GeminiVisionPDFProcessor({
  userId,
  taskId,
  userProfile
}: GeminiVisionPDFProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedPDFData | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  // Load children data
  useEffect(() => {
    loadChildren();
    const interval = setInterval(loadChildren, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadChildren = async () => {
    try {
      const response = await fetch('/api/children');
      const data = await response.json();
      if (data.success) {
        setChildren(data.children);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create PDF preview URL
    const previewUrl = URL.createObjectURL(selectedFile);
    setPdfPreviewUrl(previewUrl);

    // Auto-process the PDF
    await processPDFWithGeminiVision(selectedFile);
  };

  const processPDFWithGeminiVision = async (pdfFile: File) => {
    setProcessing(true);
    setError(null);
    setCurrentProgress('Converting PDF to images...');

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const enhancedUserProfile = {
        ...userProfile,
        children: children
      };
      formData.append('userProfile', JSON.stringify(enhancedUserProfile));

      setCurrentProgress('Analyzing with Gemini Vision AI...');

      const response = await fetch('/api/pdf/process-vision', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('PDF processing failed');
      }

      setCurrentProgress('Building translated interface...');

      console.log('Processed data received:', {
        translatedTexts: result.translatedTexts || [],
        formFields: result.formFields || [],
        totalPages: result.totalPages || 1,
        originalFileName: result.originalFileName || pdfFile.name
      });

      setProcessedData({
        translatedTexts: result.translatedTexts || [],
        formFields: result.formFields || [],
        totalPages: result.totalPages || 1,
        originalFileName: result.originalFileName || pdfFile.name
      });

      setCurrentProgress('Complete!');

    } catch (err: any) {
      console.error('Gemini Vision processing error:', err);
      setError(err.message || 'Failed to process PDF with Gemini Vision');
    } finally {
      setProcessing(false);
      setCurrentProgress('');
    }
  };

  const updateFieldValue = (fieldIndex: number, value: string) => {
    if (!processedData) return;

    const updatedFields = [...processedData.formFields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], value };

    setProcessedData({
      ...processedData,
      formFields: updatedFields
    });
  };

  const downloadFilledPDF = async () => {
    if (!file || !processedData) return;

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const enhancedUserProfile = {
        ...userProfile,
        children: children
      };

      // Convert form fields to the format expected by the filling API
      const editedFields: Record<string, string> = {};
      processedData.formFields.forEach((field, index) => {
        editedFields[`field_${index}`] = field.value;
      });

      formData.append('userProfile', JSON.stringify(enhancedUserProfile));
      formData.append('editedFields', JSON.stringify(editedFields));

      const response = await fetch('/api/pdf/upload-and-fill', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate filled PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `filled_${processedData.originalFileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      setError(err.message || 'Failed to download filled PDF');
    } finally {
      setProcessing(false);
    }
  };

  const renderTranslatedText = (text: TranslatedText, index: number) => {
    // Scale factor to match PDF display - adjust this value as needed
    const scaleFactor = 0.6; // Try different values: 0.5, 0.6, 0.7, 0.8
    const style = {
      position: 'absolute' as const,
      left: `${text.x * scaleFactor}px`,
      top: `${text.y * scaleFactor}px`,
      width: `${text.width * scaleFactor}px`,
      height: `${text.height * scaleFactor}px`,
      fontSize: '12px',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: 'rgba(37, 99, 235, 0.9)',
      border: '2px solid #2563eb',
      borderRadius: '6px',
      padding: '4px 8px',
      display: 'flex',
      alignItems: 'center',
      zIndex: 30,
      pointerEvents: 'none' as const,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    return (
      <div key={`text-${index}`} style={style} title={text.text}>
        🔵 {text.text}
      </div>
    );
  };

  const renderFormField = (field: FormField, index: number) => {
    // Scale factor to match PDF display - adjust this value as needed
    const scaleFactor = 0.6; // Try different values: 0.5, 0.6, 0.7, 0.8
    const style = {
      position: 'absolute' as const,
      left: `${field.x * scaleFactor}px`,
      top: `${field.y * scaleFactor}px`,
      width: `${field.width * scaleFactor}px`,
      height: `${field.height * scaleFactor}px`,
      zIndex: 25,
    };

    return (
      <input
        key={`field-${index}`}
        type="text"
        value={field.value}
        onChange={(e) => updateFieldValue(index, e.target.value)}
        placeholder={field.label}
        title={field.label}
        style={style}
        className="bg-yellow-100 bg-opacity-80 border-2 border-yellow-400 text-sm px-2 py-1 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
        >
          <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-800 mb-2">
            AI-Powered PDF Translation
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Upload your PDF for complete translation with Gemini Vision AI
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Powered by Google Gemini Vision</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Choose PDF File
          </button>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">{file.name}</p>
              <p className="text-sm text-blue-700">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {processedData && (
                  <span> • {processedData.translatedTexts.length} texts translated • {processedData.formFields.length} fields detected</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setProcessedData(null);
              setError(null);
              setPdfPreviewUrl(null);
            }}
            className="text-red-600 hover:text-red-700 font-medium"
            disabled={processing}
          >
            Remove
          </button>
        </div>
      )}

      {/* Processing Status */}
      {processing && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse mr-3" />
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
          <p className="text-lg font-medium text-blue-900 mb-2">
            Gemini Vision AI Processing...
          </p>
          <p className="text-sm text-blue-700">
            {currentProgress || 'Please wait while we analyze your document'}
          </p>
          <div className="mt-4 bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-1/3 animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Processed Result */}
      {processedData && !processing && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                AI Translation Complete!
              </h3>
            </div>
            <p className="text-green-700">
              Gemini Vision successfully analyzed your PDF and translated {processedData.translatedTexts.length} text elements.
              {processedData.formFields.length} form fields were detected and pre-filled with your data.
            </p>
          </div>

          {/* PDF Preview with Translation Overlays */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-900">
                  📄 PDF Analysis with Translation Overlay
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  🔵 Blue overlays = English translations • 🟡 Yellow fields = Editable
                </p>
              </div>
              {pdfPreviewUrl && (
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  View Original PDF
                </a>
              )}
            </div>

            <div
              ref={overlayContainerRef}
              className="relative bg-white overflow-auto"
              style={{
                height: '600px',
                width: '100%'
              }}
            >
              {/* Original PDF Background */}
              {pdfPreviewUrl ? (
                <div className="absolute inset-0 flex justify-center items-start p-4 z-0">
                  <iframe
                    src={pdfPreviewUrl}
                    className="border border-gray-300 shadow-lg"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '500px'
                    }}
                    title="Original PDF"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 font-medium">PDF Document Representation</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {file ? `File: ${file.name}` : 'Upload a PDF to analyze'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Translation Overlays */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {(() => {
                  console.log('Rendering translated texts:', processedData.translatedTexts);
                  return processedData.translatedTexts.map((text, index) =>
                    renderTranslatedText(text, index)
                  );
                })()}
              </div>

              {/* Interactive Form Fields */}
              <div className="absolute inset-0 z-20">
                {processedData.formFields.map((field, index) =>
                  renderFormField(field, index)
                )}
              </div>

              {/* Instructions overlay if no content */}
              {processedData.translatedTexts.length === 0 && processedData.formFields.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500 bg-white bg-opacity-90 p-6 rounded-lg">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Upload a PDF to see AI analysis</p>
                    <p className="text-sm mt-1">The system will detect text and create translation overlays</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={downloadFilledPDF}
              disabled={processing}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-3 text-lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  Download Translated & Filled PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}