'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PDFElement {
  elementType: 'input_field' | 'text_block';
  pageNumber: number;
  original_text: string | null;
  translated_text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  field_type?: 'text' | 'date' | 'checkbox';
}

interface PDFAnalysisResult {
  success: boolean;
  elements: PDFElement[];
  inputFields: PDFElement[];
  textBlocks: PDFElement[];
  totalElements: number;
  totalInputFields: number;
  totalTextBlocks: number;
  pdfDimensions: { width: number; height: number };
  totalPages: number;
  analysisType: string;
}

interface AdvancedPDFOverlayProps {
  onAnalysisComplete?: (result: PDFAnalysisResult) => void;
  onFormSubmit?: (formData: Record<string, any>) => void;
}

export default function AdvancedPDFOverlay({ onAnalysisComplete, onFormSubmit }: AdvancedPDFOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PDFAnalysisResult | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        // @ts-ignore
        const pdfjsLib = await import('pdfjs-dist');
        // @ts-ignore
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        return pdfjsLib;
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
        return null;
      }
    };

    loadPDFJS();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setFormData({});
    setPdfUrl(null);
    setPdfPages([]);

    try {
      // Store original PDF as base64 for later use
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      setOriginalPdfBase64(base64);

      // Create URL for PDF display
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      // Load PDF with PDF.js
      await loadPDFWithPDFJS(file);

      // Analyze PDF with Gemini
      const formData = new FormData();
      formData.append('pdf', file);

      console.log('🔍 Starting advanced PDF analysis...');
      const response = await fetch('/api/pdf/advanced-pdf-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        result.inputFields.forEach((field: PDFElement) => {
          if (field.original_text) {
            const fieldKey = field.original_text.replace(/[^a-zA-Z0-9]/g, '');
            initialData[fieldKey] = '';
          }
        });
        setFormData(initialData);
        
        onAnalysisComplete?.(result);
        console.log(`✅ Analysis complete: ${result.totalElements} elements found`);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ File upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPDFWithPDFJS = async (file: File) => {
    try {
      // @ts-ignore
      const pdfjsLib = await import('pdfjs-dist');
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        pages.push({
          pageNumber: i,
          canvas: canvas,
          viewport: viewport
        });
      }
      
      setPdfPages(pages);
      console.log(`✅ Loaded ${pages.length} PDF pages`);
    } catch (error) {
      console.error('❌ Failed to load PDF with PDF.js:', error);
      throw error;
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const autofillFromProfile = async () => {
    try {
      // Get user profile from localStorage
      const userData = localStorage.getItem('village_current_user');
      if (!userData) {
        alert('Please sign in to use autofill');
        return;
      }

      const user = JSON.parse(userData);
      
      // Enhanced field mapping based on common patterns
      const fieldMappings: Record<string, string> = {
        'Vorname': user.first_name || '',
        'Name': user.last_name || '',
        'Nachname': user.last_name || '',
        'EMail': user.email || '',
        'EMailAdresse': user.email || '',
        'Mobile': user.phone || '',
        'Telefonnummer': user.phone || '',
        'Adresse': user.current_address || '',
        'Staatsangehörigkeit': user.nationality || '',
        'Nationalität': user.nationality || '',
        'Geburtsort': user.birth_place || '',
        'Bürgerort': user.birth_place || '',
        'Deutschkenntnisse': user.german_skills || '',
        'Muttersprache': user.first_language || '',
        'Erstsprache': user.first_language || '',
        'UmgangsspracheinderFamilie': user.family_language || '',
        'Beruf': user.profession || '',
        'Funktion': user.profession || ''
      };
      
      const newFormData = { ...formData };
      Object.entries(fieldMappings).forEach(([key, value]) => {
        if (value) {
          newFormData[key] = value;
        }
      });
      
      setFormData(newFormData);
      console.log('✅ Form autofilled from user profile');
    } catch (error) {
      console.error('❌ Autofill failed:', error);
      alert('Autofill failed. Please check your profile data.');
    }
  };

  const handleFormSubmit = async () => {
    if (onFormSubmit) {
      onFormSubmit(formData);
    } else {
      console.log('📋 Form data:', formData);
      alert('Form submitted! Check console for data.');
    }
  };

  const generateFilledPDF = async () => {
    if (!originalPdfBase64 || !analysisResult) {
      alert('Please upload and analyze a PDF first.');
      return;
    }

    setGeneratingPDF(true);
    
    try {
      console.log('📝 Generating filled PDF...');
      
      const response = await fetch('/api/pdf/generate-filled-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPdfBase64: originalPdfBase64,
          formData: formData,
          elements: analysisResult.elements
        }),
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Filled PDF downloaded successfully');
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      alert('Failed to generate filled PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const renderOverlayElements = (pageNumber: number) => {
    if (!analysisResult) return null;

    const pageElements = analysisResult.elements.filter(
      (element: PDFElement) => element.pageNumber === pageNumber
    );

    return pageElements.map((element: PDFElement, index: number) => {
      const page = pdfPages.find(p => p.pageNumber === pageNumber);
      if (!page) return null;

      const { viewport } = page;
      const { width: pdfWidth, height: pdfHeight } = viewport;
      
      // Convert absolute coordinates to relative percentages
      const relativeX = (element.position.x / analysisResult.pdfDimensions.width) * 100;
      const relativeY = (element.position.y / analysisResult.pdfDimensions.height) * 100;
      const relativeWidth = (element.size.width / analysisResult.pdfDimensions.width) * 100;
      const relativeHeight = (element.size.height / analysisResult.pdfDimensions.height) * 100;

      const style: React.CSSProperties = {
        position: 'absolute',
        left: `${relativeX}%`,
        top: `${relativeY}%`,
        width: `${relativeWidth}%`,
        height: `${relativeHeight}%`,
        boxSizing: 'border-box',
        zIndex: 10
      };

      if (element.elementType === 'input_field') {
        const fieldKey = element.original_text?.replace(/[^a-zA-Z0-9]/g, '') || `field_${index}`;
        
        return (
          <div key={index} style={style} className="overlay-element input-field">
            {element.field_type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={formData[fieldKey] || false}
                onChange={(e) => handleFieldChange(fieldKey, e.target.checked)}
                style={{
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0
                }}
              />
            ) : (
              <input
                type={element.field_type === 'date' ? 'date' : 'text'}
                value={formData[fieldKey] || ''}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                placeholder={element.translated_text}
                style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid transparent',
                  backgroundColor: 'rgba(9, 132, 227, 0.1)',
                  padding: '4px',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #0984e3';
                  e.target.style.backgroundColor = 'rgba(9, 132, 227, 0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid transparent';
                  e.target.style.backgroundColor = 'rgba(9, 132, 227, 0.1)';
                }}
              />
            )}
            {element.original_text && (
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: 0,
                fontSize: '10px',
                color: '#666',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 4px',
                borderRadius: '2px',
                whiteSpace: 'nowrap'
              }}>
                {element.translated_text}
              </div>
            )}
          </div>
        );
      } else if (element.elementType === 'text_block') {
        return (
          <div key={index} style={style} className="overlay-element text-block">
            <div style={{
              color: '#333',
              fontSize: '12px',
              lineHeight: '1.2',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 4px',
              borderRadius: '2px'
            }}>
              {element.translated_text}
            </div>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Advanced PDF Form Overlay</h2>
        
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="mb-4"
          />
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing PDF...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {analysisResult && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Analysis Complete!</strong> Found {analysisResult.totalElements} elements:
            <ul className="mt-2 text-sm">
              <li>• {analysisResult.totalInputFields} input fields</li>
              <li>• {analysisResult.totalTextBlocks} text blocks</li>
              <li>• {analysisResult.totalPages} pages</li>
            </ul>
          </div>
        )}
      </div>

      {pdfPages.length > 0 && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded">
            <div className="flex space-x-4">
              <button
                onClick={autofillFromProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Autofill from Profile
              </button>
              <button
                onClick={handleFormSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit Form
              </button>
              <button
                onClick={generateFilledPDF}
                disabled={generatingPDF}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {generatingPDF ? 'Generating...' : 'Download Filled PDF'}
              </button>
            </div>
            
            {pdfPages.length > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pdfPages.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(pdfPages.length, currentPage + 1))}
                  disabled={currentPage === pdfPages.length}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* PDF Pages with Overlays */}
          <div ref={pdfContainerRef} className="space-y-4">
            {pdfPages.map((page) => (
              <div
                key={page.pageNumber}
                className={`page-container ${page.pageNumber === currentPage ? 'block' : 'hidden'}`}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                {/* PDF Canvas */}
                <div style={{ position: 'relative' }}>
                  {page.canvas}
                  
                  {/* Overlay Elements */}
                  {renderOverlayElements(page.pageNumber)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
