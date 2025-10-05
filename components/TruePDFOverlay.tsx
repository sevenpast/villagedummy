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

interface TruePDFOverlayProps {
  onAnalysisComplete?: (result: PDFAnalysisResult) => void;
  onFormSubmit?: (formData: Record<string, any>) => void;
}

export default function TruePDFOverlay({ onAnalysisComplete, onFormSubmit }: TruePDFOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PDFAnalysisResult | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setFormData({});
    setPdfUrl(null);

    try {
      // Store original PDF as base64 for later use
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      setOriginalPdfBase64(base64);

      // Create URL for PDF display
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      // Analyze PDF with precise field mapper
      const formData = new FormData();
      formData.append('pdf', file);

      console.log('🔍 Starting PDF analysis...');
      const response = await fetch('/api/pdf/precise-field-mapper', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Convert the result to match our expected format
        const convertedResult: PDFAnalysisResult = {
          success: true,
          elements: result.fields.map((field: any) => ({
            elementType: 'input_field',
            pageNumber: 1,
            original_text: field.originalLabel,
            translated_text: field.translatedLabel,
            position: field.position,
            size: field.size,
            field_type: field.fieldType
          })),
          inputFields: result.fields.map((field: any) => ({
            elementType: 'input_field',
            pageNumber: 1,
            original_text: field.originalLabel,
            translated_text: field.translatedLabel,
            position: field.position,
            size: field.size,
            field_type: field.fieldType
          })),
          textBlocks: [],
          totalElements: result.fields.length,
          totalInputFields: result.fields.length,
          totalTextBlocks: 0,
          pdfDimensions: result.pdfDimensions,
          totalPages: 1,
          analysisType: 'enhanced_field_mapper'
        };
        
        setAnalysisResult(convertedResult);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        result.fields.forEach((field: any) => {
          if (field.originalLabel) {
            const fieldKey = field.originalLabel.replace(/[^a-zA-Z0-9]/g, '');
            initialData[fieldKey] = '';
          }
        });
        setFormData(initialData);
        
        onAnalysisComplete?.(convertedResult);
        console.log(`✅ Analysis complete: ${result.fields.length} fields found`);
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
      
      // Precise field mapping based on the new field names
      const fieldMappings: Record<string, string> = {
        // Child information
        'childFirstName': user.first_name || '',
        'childLastName': user.last_name || '',
        'childBirthDate': user.birth_date || '',
        'childNationality': user.nationality || '',
        'childBirthPlace': user.birth_place || '',
        
        // Father information
        'fatherFirstName': user.first_name || '',
        'fatherLastName': user.last_name || '',
        'fatherNationality': user.nationality || '',
        'fatherProfession': user.profession || '',
        
        // Mother information
        'motherFirstName': user.first_name || '',
        'motherLastName': user.last_name || '',
        'motherNationality': user.nationality || '',
        'motherProfession': user.profession || '',
        
        // Contact information
        'email': user.email || '',
        'email2': user.email || '',
        'emailAddress': user.email || '',
        'mobilePhone': user.phone || '',
        'mobilePhone2': user.phone || '',
        'phone': user.phone || '',
        
        // Address information
        'address': user.current_address || '',
        'addressLine2': user.current_address || '',
        
        // Language information
        'familyLanguage': user.family_language || '',
        'germanSkills': user.german_skills || '',
        'motherTongue': user.first_language || '',
        'firstLanguage': user.first_language || ''
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

  const renderOverlayElements = () => {
    if (!analysisResult) return null;

    const pageElements = analysisResult.elements.filter(
      (element: PDFElement) => element.pageNumber === currentPage
    );

    return pageElements.map((element: PDFElement, index: number) => {
      if (element.elementType !== 'input_field' || !element.original_text) return null;

      const fieldKey = element.original_text.replace(/[^a-zA-Z0-9]/g, '');
      
      // Convert PDF coordinates to screen coordinates
      // Assuming PDF is displayed at scale and positioned within the container
      const containerWidth = pdfContainerRef.current?.offsetWidth || 800;
      const containerHeight = pdfContainerRef.current?.offsetHeight || 600;
      
      // Calculate relative position based on PDF dimensions
      const relativeX = (element.position.x / analysisResult.pdfDimensions.width) * containerWidth * pdfScale;
      const relativeY = (element.position.y / analysisResult.pdfDimensions.height) * containerHeight * pdfScale;
      const relativeWidth = (element.size.width / analysisResult.pdfDimensions.width) * containerWidth * pdfScale;
      const relativeHeight = (element.size.height / analysisResult.pdfDimensions.height) * containerHeight * pdfScale;

      const style: React.CSSProperties = {
        position: 'absolute',
        left: `${relativeX}px`,
        top: `${relativeY}px`,
        width: `${relativeWidth}px`,
        height: `${relativeHeight}px`,
        zIndex: 10,
        pointerEvents: 'auto'
      };

      return (
        <div key={index} style={style} className="overlay-element">
          {element.field_type === 'checkbox' ? (
            <input
              type="checkbox"
              checked={formData[fieldKey] || false}
              onChange={(e) => handleFieldChange(fieldKey, e.target.checked)}
              style={{
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0,
                backgroundColor: 'rgba(9, 132, 227, 0.1)',
                border: '1px solid transparent'
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
                padding: '2px 4px',
                fontSize: '12px',
                fontFamily: 'inherit',
                borderRadius: '2px'
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
          
          {/* Field label tooltip */}
          <div style={{
            position: 'absolute',
            top: '-25px',
            left: 0,
            fontSize: '10px',
            color: '#666',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 4px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            zIndex: 20,
            pointerEvents: 'none'
          }}>
            {element.translated_text}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">True PDF Form Overlay</h2>
        
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

      {pdfUrl && (
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
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPdfScale(Math.max(0.5, pdfScale - 0.1))}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded"
              >
                Zoom Out
              </button>
              <span className="text-sm text-gray-600">
                {Math.round(pdfScale * 100)}%
              </span>
              <button
                onClick={() => setPdfScale(Math.min(2.0, pdfScale + 0.1))}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded"
              >
                Zoom In
              </button>
            </div>
          </div>

          {/* PDF with True Overlay */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">PDF with Interactive Overlay</h3>
            <div 
              ref={pdfContainerRef}
              className="relative border border-gray-300 rounded overflow-hidden"
              style={{ 
                width: '100%', 
                height: '800px',
                transform: `scale(${pdfScale})`,
                transformOrigin: 'top left'
              }}
            >
              {/* PDF iframe */}
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-full border-0"
                title="PDF with Overlay"
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Overlay Elements */}
              {renderOverlayElements()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
