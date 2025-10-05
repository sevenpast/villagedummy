'use client';

import { useState } from 'react';
import FixedPDFOverlay from '@/components/FixedPDFOverlay';

export default function PDFOverlayTestPage() {
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
              PDF Overlay Test - Fixed Version
            </h1>
            <p className="text-gray-600">
              Test the improved PDF overlay with proper coordinate transformation
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🔧 What's Fixed:</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Dynamic PDF dimension calculation</li>
              <li>✅ Proper coordinate transformation (PDF → HTML)</li>
              <li>✅ Synchronized iframe and overlay scaling</li>
              <li>✅ Responsive scaling based on container size</li>
              <li>✅ Y-coordinate flipping for correct positioning</li>
              <li>✅ Debug information display</li>
              <li>✅ Fullscreen mode support</li>
            </ul>
          </div>

          <FixedPDFOverlay
            userId="test-user"
            taskId={4}
            userProfile={mockUserProfile}
          />
        </div>
      </div>
    </div>
  );
}
