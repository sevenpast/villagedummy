'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import dynamic from 'next/dynamic';
const AdjustablePDFOverlay = dynamic(() => import('@/components/AdjustablePDFOverlay'), { ssr: false });

export default function PDFAdjustablePage() {
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
              PDF Overlay mit einstellbarer Skalierung
            </h1>
            <p className="text-gray-600">
              Jetzt können Sie die Skalierung der Overlays in Echtzeit anpassen
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-green-900 mb-2">✅ Neue Features:</h2>
            <ul className="text-sm text-green-800 space-y-1">
              <li>🎛️ Einstellbarer Skalierungsfaktor (0.1x - 1.5x)</li>
              <li>📊 Live-Anpassung der Overlay-Position</li>
              <li>🔧 Schnell-Buttons für häufige Werte (0.5x, 0.6x, 0.7x, 0.8x, 1.0x)</li>
              <li>👁️ Original-PDF als Hintergrund sichtbar</li>
              <li>🎯 Präzise Positionierung der Overlays</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🎯 So funktioniert es:</h2>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Laden Sie ein PDF hoch</li>
              <li>Klicken Sie auf "Adjust" um die Einstellungen zu öffnen</li>
              <li>Passen Sie den Skalierungsfaktor an, bis die Overlays korrekt positioniert sind</li>
              <li>Verwenden Sie die Schnell-Buttons für häufige Werte</li>
              <li>Die Änderungen werden sofort angezeigt</li>
            </ol>
          </div>

          <AdjustablePDFOverlay
            userId="test-user"
            taskId={4}
            userProfile={mockUserProfile}
          />
        </div>
      </div>
    </div>
  );
}


