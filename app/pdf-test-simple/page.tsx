'use client';

import { useState } from 'react';
import GeminiVisionPDFProcessor from '@/components/GeminiVisionPDFProcessor';

export default function PDFTestSimplePage() {
  // Mock user profile for testing
  const mockUserProfile = {
    id: 'test-user',
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@email.com',
    country_of_origin: 'Brazil',
    municipality: 'Zürich',
    canton: 'Zürich',
    postal_code: '8050',
    phone: '+41 79 123 45 67',
    has_kids: true,
    num_children: 2,
    children: [
      {
        name: 'Sofia Santos',
        first_name: 'Sofia',
        last_name: 'Santos',
        date_of_birth: '2015-03-15',
        school_grade: '3rd Grade'
      },
      {
        name: 'Lucas Santos',
        first_name: 'Lucas',
        last_name: 'Santos',
        date_of_birth: '2018-07-22',
        school_grade: 'Kindergarten'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Overlay Test - Simple Fix
            </h1>
            <p className="text-gray-600">
              Test the PDF overlay with a simple scaling fix (0.75x)
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-yellow-900 mb-2">🔧 Simple Fix Applied:</h2>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>✅ Applied 0.75x scaling factor to field coordinates</li>
              <li>✅ Applied 0.75x scaling factor to text coordinates</li>
              <li>⚠️ This is a quick fix - may need adjustment for different PDFs</li>
              <li>⚠️ For better results, use the full FixedPDFOverlay component</li>
            </ul>
          </div>

          <GeminiVisionPDFProcessor
            userId="test-user"
            taskId={4}
            userProfile={mockUserProfile}
          />
        </div>
      </div>
    </div>
  );
}
