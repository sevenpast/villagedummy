'use client';

import React, { useState, useRef } from 'react';

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

interface SimplePDFOverlayProps {
  onAnalysisComplete?: (result: PDFAnalysisResult) => void;
  onFormSubmit?: (formData: Record<string, any>) => void;
}

export default function SimplePDFOverlay({ onAnalysisComplete, onFormSubmit }: SimplePDFOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PDFAnalysisResult | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Analyze PDF with Gemini using the enhanced field mapper
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Simple PDF Form Overlay</h2>
        
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
          </div>

          {/* PDF Display and Form */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* PDF Viewer */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Original PDF</h3>
              <iframe
                src={pdfUrl}
                className="w-full h-96 border border-gray-300 rounded"
                title="PDF Preview"
              />
            </div>

            {/* Form Fields */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Form Fields</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {analysisResult?.inputFields.map((field, index) => {
                  if (!field.original_text) return null;
                  
                  const fieldKey = field.original_text.replace(/[^a-zA-Z0-9]/g, '');
                  
                  return (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.translated_text}
                        {field.original_text !== field.translated_text && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({field.original_text})
                          </span>
                        )}
                      </label>
                      
                      {field.field_type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={formData[fieldKey] || false}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      ) : field.field_type === 'date' ? (
                        <input
                          type="date"
                          value={formData[fieldKey] || ''}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[fieldKey] || ''}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                          placeholder={field.translated_text}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
