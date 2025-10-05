'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';

interface FormField {
  fieldName: string;
  originalLabel: string;
  translatedLabel: string;
  fieldType: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  required: boolean;
  options: string[];
  validation: string;
  placeholder: string;
}

interface FormAnalysis {
  formLanguage: string;
  formTitle: string;
  totalFields: number;
  fields: FormField[];
}

export default function IntelligentFormBuilder() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FormAnalysis | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [originalPdf, setOriginalPdf] = useState<ArrayBuffer | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setFormData({});

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      console.log('📤 Uploading file for Gemini Vision analysis...');
      
      // Try intelligent field mapping first
      let response = await fetch('/api/pdf/intelligent-field-mapper', {
        method: 'POST',
        body: formData,
      });

      // If intelligent mapping fails, try Gemini Vision
      if (!response.ok) {
        console.log('⚠️ Intelligent mapping failed, trying Gemini Vision...');
        response = await fetch('/api/pdf/gemini-vision-analysis', {
          method: 'POST',
          body: formData,
        });
      }

      // If Gemini Vision also fails, fallback to simple analysis
      if (!response.ok) {
        console.log('⚠️ Gemini Vision failed, trying fallback...');
        response = await fetch('/api/pdf/simple-intelligent-analysis', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Analysis result:', result);
      
      setAnalysisResult(result.analysis);
      setOriginalPdf(await file.arrayBuffer());
      
      // Initialize form data with empty values
      const initialData: Record<string, any> = {};
      result.analysis.fields.forEach((field: FormField) => {
        initialData[field.fieldName] = '';
      });
      setFormData(initialData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
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
      
      // Simple field mapping based on common patterns
      const fieldMappings: Record<string, string> = {
        'firstName': user.first_name || '',
        'lastName': user.last_name || '',
        'email': user.email || '',
        'phone': user.phone || '',
        'address': user.current_address || '',
        'city': user.municipality || '',
        'postalCode': user.postal_code || '',
        'country': user.country_of_origin || '',
        'nationality': user.nationality || '',
        'birthPlace': user.birth_place || '',
        'germanSkills': user.german_skills || '',
        'firstLanguage': user.first_language || '',
        'familyLanguage': user.family_language || '',
      };

      // Try to match fields intelligently
      const newFormData = { ...formData };
      
      analysisResult?.fields.forEach(field => {
        const fieldName = field.fieldName.toLowerCase();
        const translatedLabel = field.translatedLabel.toLowerCase();
        
        // Direct mapping
        if (fieldMappings[fieldName]) {
          newFormData[field.fieldName] = fieldMappings[fieldName];
          return;
        }
        
        // Intelligent matching based on translated labels
        if (translatedLabel.includes('first name') || translatedLabel.includes('vorname')) {
          newFormData[field.fieldName] = user.first_name || '';
        } else if (translatedLabel.includes('last name') || translatedLabel.includes('nachname')) {
          newFormData[field.fieldName] = user.last_name || '';
        } else if (translatedLabel.includes('email') || translatedLabel.includes('e-mail')) {
          newFormData[field.fieldName] = user.email || '';
        } else if (translatedLabel.includes('phone') || translatedLabel.includes('telefon')) {
          newFormData[field.fieldName] = user.phone || '';
        } else if (translatedLabel.includes('address') || translatedLabel.includes('adresse')) {
          newFormData[field.fieldName] = user.current_address || '';
        } else if (translatedLabel.includes('city') || translatedLabel.includes('stadt')) {
          newFormData[field.fieldName] = user.municipality || '';
        } else if (translatedLabel.includes('postal') || translatedLabel.includes('plz')) {
          newFormData[field.fieldName] = user.postal_code || '';
        } else if (translatedLabel.includes('country') || translatedLabel.includes('land')) {
          newFormData[field.fieldName] = user.country_of_origin || '';
        } else if (translatedLabel.includes('nationality') || translatedLabel.includes('nationalität')) {
          newFormData[field.fieldName] = user.nationality || '';
        } else if (translatedLabel.includes('birth') || translatedLabel.includes('geburt')) {
          newFormData[field.fieldName] = user.birth_place || '';
        } else if (translatedLabel.includes('german') || translatedLabel.includes('deutsch')) {
          newFormData[field.fieldName] = user.german_skills || '';
        } else if (translatedLabel.includes('language') || translatedLabel.includes('sprache')) {
          newFormData[field.fieldName] = user.first_language || '';
        }
      });

      setFormData(newFormData);
      alert('Form filled with your profile data!');

    } catch (error) {
      console.error('Autofill error:', error);
      alert('Failed to autofill form');
    }
  };

  const generateFilledPDF = async () => {
    if (!analysisResult) return;

    setIsGenerating(true);
    try {
      console.log('📝 Generating filled PDF with coordinates...');
      
      // Convert the original PDF to base64
      const originalPdfBase64 = Buffer.from(await new Response(originalPdf).arrayBuffer()).toString('base64');
      
      // Call the fill-with-coordinates API
      const response = await fetch('/api/pdf/fill-with-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfData: analysisResult,
          fieldValues: formData,
          originalPdfBase64: originalPdfBase64
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ PDF filled successfully:', result);

      // Download the filled PDF
      const filledPdfBytes = Buffer.from(result.filledPdf, 'base64');
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Filled PDF downloaded successfully!');
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.fieldName] || '';

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'date':
      case 'number':
        return (
          <input
            type={field.fieldType}
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">{field.translatedLabel}</span>
          </div>
        );

      case 'radio':
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'signature':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p className="text-gray-500">Signature field - Click to sign</p>
            <button
              type="button"
              onClick={() => handleFieldChange(field.fieldName, 'SIGNED')}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Signature
            </button>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧠 Intelligent Form Builder
          </h1>
          <p className="text-gray-600">
            Upload any form document and let AI create an interactive form for you
          </p>
        </div>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Upload Form Document
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, images, and scanned documents
            </p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isAnalyzing}
              className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">🧠 AI is analyzing your document...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <span className="text-red-800">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900">
                  🎯 Form Analysis Complete
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-800">Language:</span>
                  <p className="text-green-700">{analysisResult.formLanguage.toUpperCase()}</p>
                </div>
                <div>
                  <span className="font-medium text-green-800">Title:</span>
                  <p className="text-green-700">{analysisResult.formTitle}</p>
                </div>
                <div>
                  <span className="font-medium text-green-800">Fields Found:</span>
                  <p className="text-green-700">{analysisResult.totalFields}</p>
                </div>
                <div>
                  <span className="font-medium text-green-800">Status:</span>
                  <p className="text-green-700">Ready to Fill</p>
                </div>
              </div>
            </div>

            {/* Autofill Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Interactive Form
              </h2>
              <button
                onClick={autofillFromProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Autofill from Profile
              </button>
            </div>

            {/* Dynamic Form */}
            <form className="space-y-6">
              {analysisResult.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.translatedLabel}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {field.fieldType}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    Original: "{field.originalLabel}"
                  </div>
                  
                  {renderField(field)}
                </div>
              ))}

              {/* Generate PDF Button */}
              <div className="pt-6 border-t">
                <button
                  type="button"
                  onClick={generateFilledPDF}
                  disabled={isGenerating}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Filled PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
