'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Download, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormField {
  id: string;
  originalName: string;
  englishLabel: string;
  tooltip: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio';
  required: boolean;
  validation: string;
  options?: Array<{ original: string; translated: string }>;
  page?: number;
  inputCoords?: { x: number; y: number };
  coordinateMatched?: boolean;
  geminiMatched: boolean;
}

interface FormAnalysis {
  id: string;
  language: string;
  languageName: string;
  formTitle: string;
  fields: FormField[];
  totalFields: number;
  geminiMatchedFields: number;
  coordinateMatchedFields: number;
  pdfData: string;
  textBlocks?: Array<{
    page: number;
    coords: [number, number, number, number];
    text: string;
    fontSize?: number;
    fontName?: string;
  }>;
}

interface SmartFormOverlayProps {
  userId: string;
  onComplete?: () => void;
}

const SmartFormOverlay: React.FC<SmartFormOverlayProps> = ({ userId, onComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile for autofill
  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Autofill form with user data
  const autofillForm = () => {
    if (!formAnalysis || !userProfile) return;

    const newFieldValues: Record<string, any> = {};
    
    formAnalysis.fields.forEach((field: any) => {
      if (field.autofill && userProfile[field.autofill.replace('user.', '')]) {
        newFieldValues[field.id] = userProfile[field.autofill.replace('user.', '')];
      }
    });

    setFieldValues(newFieldValues);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/pdf/optimized-form-analysis', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setFormAnalysis(result.data);
        setSuccess(`Successfully analyzed ${result.data.totalFields} form fields in ${result.data.languageName}`);
        
        // Initialize field values
        const initialValues: Record<string, any> = {};
        result.data.fields.forEach((field: FormField) => {
          initialValues[field.id] = field.type === 'checkbox' ? false : '';
        });
        setFieldValues(initialValues);
      } else {
        console.error('API Error:', result);
        setError(result.error || 'Failed to analyze PDF form. Please try again.');
      }
    } catch (err) {
      setError('Error uploading and analyzing PDF');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFillAndDownload = async () => {
    if (!formAnalysis) return;

    setIsFilling(true);
    setError(null);

    try {
      const response = await fetch('/api/pdf/test-fill-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          formId: formAnalysis.id,
          fieldValues,
          pdfData: formAnalysis.pdfData
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filled-${formAnalysis.formTitle || 'form'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess('PDF successfully filled and downloaded!');
        if (onComplete) onComplete();
      } else {
        setError('Failed to fill PDF form');
      }
    } catch (err) {
      setError('Error filling PDF form');
      console.error('Fill error:', err);
    } finally {
      setIsFilling(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = fieldValues[field.id] || '';

    switch (field.type) {
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">{field.englishLabel}</span>
          </label>
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option.original}>
                {option.translated}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option.original}
                  checked={value === option.original}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm text-gray-700">{option.translated}</span>
              </label>
            ))}
            {(!field.options || field.options.length === 0) && (
              <>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={field.id}
                    value="yes"
                    checked={value === 'yes'}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={field.id}
                    value="no"
                    checked={value === 'no'}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </>
            )}
          </div>
        );

      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.englishLabel.toLowerCase()}`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!formAnalysis && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="smart-pdf-upload"
            disabled={isUploading || isAnalyzing}
          />
          <label htmlFor="smart-pdf-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <span className="text-lg font-medium text-gray-900">
                Upload PDF Form
              </span>
              <p className="mt-2 text-sm text-gray-500">
                PDF files only.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Loading States */}
      {(isUploading || isAnalyzing) && (
        <div className="w-full flex items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-base font-semibold text-white">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {isUploading ? 'Uploading PDF...' : 'Processing PDF...'}
        </div>
      )}

      {/* Form Analysis Results */}
      {formAnalysis && (
        <div className="space-y-6">

          {/* English Form Overlay */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Fill out the form
              </h3>
              {userProfile && (
                <button
                  onClick={autofillForm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Autofill
                </button>
              )}
            </div>

            <div className="space-y-6">
              {formAnalysis.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label 
                    className="block text-sm font-medium text-gray-700"
                    title={field.tooltip}
                  >
                    {field.englishLabel}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleFillAndDownload}
                disabled={isFilling}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 font-medium"
              >
                {isFilling ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Filling PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Filled PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFormOverlay;
