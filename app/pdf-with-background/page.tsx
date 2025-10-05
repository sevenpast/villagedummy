'use client';

import { useState } from 'react';
import GeminiVisionPDFProcessor from '@/components/GeminiVisionPDFProcessor';

export default function PDFWithBackgroundPage() {
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
              PDF Overlay mit Original-PDF Hintergrund
            </h1>
            <p className="text-gray-600">
              Jetzt wird das Original-PDF als Hintergrund angezeigt mit den Overlays darüber
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-green-900 mb-2">✅ Problem behoben:</h2>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ Original-PDF wird als Hintergrund angezeigt</li>
              <li>✅ Blaue Overlays (Übersetzungen) über dem PDF</li>
              <li>✅ Gelbe Felder (Eingabefelder) über dem PDF</li>
              <li>✅ Korrekte z-index Schichtung</li>
              <li>✅ Synchronisierte Skalierung (0.75x)</li>
              <li>✅ Benutzer sehen jetzt den Kontext!</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🎯 Was Sie jetzt sehen sollten:</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>📄 Das Original-PDF als Hintergrund</li>
              <li>🔵 Blaue Overlays mit englischen Übersetzungen</li>
              <li>🟡 Gelbe Eingabefelder mit vorausgefüllten Daten</li>
              <li>📍 Overlays sind korrekt über den PDF-Feldern positioniert</li>
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
