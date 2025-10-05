'use client';

import { useState } from 'react';

export default function SimpleRedTestPage() {
  const [scaleFactor, setScaleFactor] = useState(0.6);
  const [redBoxPosition, setRedBoxPosition] = useState({ x: 100, y: 100, width: 200, height: 50 });
  const [showRedOverlay, setShowRedOverlay] = useState(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setPdfFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile));
    } else {
      setPdfFile(null);
      setPdfUrl(null);
      alert('Bitte wählen Sie eine PDF-Datei aus.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Fester Roter Overlay Test
          </h1>
          
          <p className="text-gray-600 mb-6">
            Laden Sie eine echte PDF-Datei hoch und testen Sie die rote Fläche darüber
          </p>

          {/* PDF Upload - Vereinfacht */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">📄 PDF Upload</h3>
            
            {!pdfFile ? (
              <div className="space-y-4">
                {/* Großer Upload Button */}
                <div className="text-center">
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <div className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors border-2 border-blue-600 hover:border-blue-700">
                      <div className="text-2xl mb-2">📁</div>
                      <div className="font-semibold text-lg">PDF-Datei auswählen</div>
                      <div className="text-sm opacity-90">Klicken Sie hier um eine PDF hochzuladen</div>
                    </div>
                  </label>
                </div>
                
                {/* Oder Test-PDF Button */}
                <div className="text-center">
                  <div className="text-gray-500 mb-2">oder</div>
                  <button
                    onClick={() => {
                      setPdfUrl('/Anmeldung_Kindergarten_und_Schule_neu.pdf');
                      setPdfFile({ name: 'Anmeldung_Kindergarten_und_Schule_neu.pdf', size: 1024 } as File);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    🧪 Test-PDF verwenden (Anmeldung_Kindergarten_und_Schule_neu.pdf)
                  </button>
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  <p>Wählen Sie eine PDF-Datei aus, um sie mit der roten Fläche zu testen</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
                    <span className="text-white text-lg font-bold">PDF</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{pdfFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPdfFile(null);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl(null);
                    }
                  }}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium border border-red-300 rounded hover:bg-red-50 transition-colors"
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-3">🔧 PDF Overlay Kontrollen</h3>
            
            {/* Toggle Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowRedOverlay(!showRedOverlay)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  showRedOverlay 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {showRedOverlay ? '🔴 Rote Fläche anzeigen' : '📄 Original PDF anzeigen'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                {showRedOverlay 
                  ? 'Rote Fläche ist sichtbar - klicken Sie um das Original PDF zu sehen'
                  : 'Original PDF ist sichtbar - klicken Sie um die rote Fläche zu sehen'
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Scale Factor: {scaleFactor}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Position X: {redBoxPosition.x}
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={redBoxPosition.x}
                  onChange={(e) => setRedBoxPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Position Y: {redBoxPosition.y}
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={redBoxPosition.y}
                  onChange={(e) => setRedBoxPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Width: {redBoxPosition.width}
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={redBoxPosition.width}
                  onChange={(e) => setRedBoxPosition(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setScaleFactor(0.5)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                0.5x
              </button>
              <button
                onClick={() => setScaleFactor(0.6)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                0.6x
              </button>
              <button
                onClick={() => setScaleFactor(0.7)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                0.7x
              </button>
              <button
                onClick={() => setScaleFactor(1.0)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                1.0x
              </button>
            </div>
          </div>

          {/* PDF Container with Red Overlay */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                PDF mit natürlicher Größe + Rote Fläche
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                PDF behält seine natürliche Größe. Rote Fläche hat dieselbe Größe wie das PDF.
              </p>
            </div>

            <div className="p-4 flex justify-center">
              <div className="relative">
                {pdfUrl ? (
                  /* Echte PDF-Datei */
                  <iframe
                    src={pdfUrl}
                    className="border border-gray-300 shadow-lg"
                    style={{
                      width: '600px',
                      height: '800px',
                      minWidth: '400px',
                      minHeight: '600px'
                    }}
                    title="Original PDF"
                  />
                ) : (
                  /* Platzhalter wenn keine PDF hochgeladen */
                  <div
                    className="bg-gray-100 border-2 border-dashed border-gray-300 shadow-lg flex items-center justify-center"
                    style={{
                      width: '600px',
                      height: '800px',
                      minWidth: '400px',
                      minHeight: '600px'
                    }}
                  >
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-lg font-medium">Keine PDF-Datei hochgeladen</p>
                      <p className="text-sm">Laden Sie oben eine PDF-Datei hoch</p>
                    </div>
                  </div>
                )}

                {/* Red Overlay Box - Gleiche Größe wie PDF */}
                {showRedOverlay && (
                  <div 
                    className="absolute top-0 left-0 z-10 bg-red-500 bg-opacity-80 border-2 border-red-700"
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-white font-bold text-lg">
                      ROTE FLÄCHE<br/>
                      Gleiche Größe wie PDF
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
