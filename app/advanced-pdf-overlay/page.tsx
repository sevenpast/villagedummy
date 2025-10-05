'use client';

import React from 'react';
import AdvancedPDFOverlay from '../../components/AdvancedPDFOverlay';

export default function AdvancedPDFOverlayPage() {
  const handleAnalysisComplete = (result: any) => {
    console.log('📊 Analysis completed:', result);
  };

  const handleFormSubmit = (formData: Record<string, any>) => {
    console.log('📋 Form submitted:', formData);
    alert('Form submitted! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced PDF Form Overlay
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Upload a PDF form and get an intelligent overlay with automatic translation, 
            field detection, and autofill capabilities. Perfect for Swiss government forms.
          </p>
        </div>

        <AdvancedPDFOverlay
          onAnalysisComplete={handleAnalysisComplete}
          onFormSubmit={handleFormSubmit}
        />

        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-semibold mb-2">1. Upload PDF</h3>
              <p className="text-gray-600 text-sm">
                Upload any Swiss government form or document
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-semibold mb-2">2. AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Gemini AI analyzes and translates all form fields
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✏️</span>
              </div>
              <h3 className="font-semibold mb-2">3. Fill & Download</h3>
              <p className="text-gray-600 text-sm">
                Fill the form with autofill and download the completed PDF
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
