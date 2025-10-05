'use client';

import SimpleRedOverlay from '@/components/SimpleRedOverlay';

export default function RedOverlayTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Einfacher Roter Overlay Test
            </h1>
            <p className="text-gray-600">
              Nur eine rote Fläche über dem PDF - um die Koordinaten-Transformation zu testen
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-red-900 mb-2">🎯 Ziel:</h2>
            <ul className="text-sm text-red-800 space-y-1">
              <li>✅ PDF als Hintergrund anzeigen</li>
              <li>🔴 Eine rote Fläche über dem PDF positionieren</li>
              <li>🎛️ Skalierung und Position in Echtzeit anpassen</li>
              <li>📊 Debug-Informationen anzeigen</li>
              <li>🎯 Die richtige Skalierung für Ihr PDF finden</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🔧 So verwenden Sie es:</h2>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Laden Sie Ihr PDF hoch</li>
              <li>Passen Sie den <strong>Scale Factor</strong> an (0.1x - 2.0x)</li>
              <li>Verschieben Sie die rote Box mit <strong>Position X/Y</strong></li>
              <li>Ändern Sie die <strong>Width</strong> der roten Box</li>
              <li>Verwenden Sie die Schnell-Buttons für häufige Skalierungen</li>
              <li>Finden Sie die richtige Skalierung für Ihr PDF</li>
            </ol>
          </div>

          <SimpleRedOverlay />
        </div>
      </div>
    </div>
  );
}


