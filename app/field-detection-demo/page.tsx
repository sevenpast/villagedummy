'use client';

import { useState } from 'react';

interface DetectedField {
  name: string;
  originalName: string;
  translation: string;
  value: string;
  confidence: number;
  isAutoFilled: boolean;
  fieldType: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  context: string;
}

interface DetectionResult {
  success: boolean;
  formFields: DetectedField[];
  translatedTexts: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  totalPages: number;
  originalFileName: string;
}

export default function FieldDetectionDemo() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [scaleFactor, setScaleFactor] = useState(0.6);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setPdfFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setDetectionResult(null); // Reset previous results
    } else {
      setPdfFile(null);
      setPdfUrl(null);
      setDetectionResult(null);
      alert('Bitte wählen Sie eine PDF-Datei aus.');
    }
  };

  const processPDF = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      // Mock user profile for demo
      const userProfile = {
        first_name: 'Maria',
        last_name: 'Müller',
        email: 'maria.mueller@example.com',
        phone: '+41 79 123 45 67',
        current_address: 'Musterstrasse 123',
        municipality: 'Zürich',
        postal_code: '8001',
        country_of_origin: 'Deutschland',
        children: [{
          first_name: 'Anna',
          last_name: 'Müller',
          date_of_birth: '2015-03-15',
          gender: 'weiblich'
        }]
      };
      formData.append('userProfile', JSON.stringify(userProfile));

      const response = await fetch('/api/pdf/process-vision', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDetectionResult(result);
      } else {
        throw new Error('Failed to process PDF');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Fehler beim Verarbeiten der PDF: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadTestPDF = async () => {
    try {
      // Generate a test PDF
      const response = await fetch('/api/generate-test-pdf');
      if (response.ok) {
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setPdfFile({ name: 'test-form.pdf', size: pdfBlob.size } as File);
        setDetectionResult(null);
      } else {
        throw new Error('Failed to generate test PDF');
      }
    } catch (error) {
      console.error('Error loading test PDF:', error);
      alert('Fehler beim Laden der Test-PDF: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🤖 Automatische Felderkennung Demo
          </h1>
          
          <p className="text-gray-600 mb-6">
            Diese Demo zeigt, wie das System automatisch Felder in PDF-Formularen erkennt und mit KI übersetzt.
          </p>

          {/* PDF Upload */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">📄 PDF Upload & Verarbeitung</h3>
            
            {!pdfFile ? (
              <div className="space-y-4">
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
                      <div className="font-semibold text-lg">PDF-Formular hochladen</div>
                      <div className="text-sm opacity-90">Klicken Sie hier um ein PDF hochzuladen</div>
                    </div>
                  </label>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-500 mb-2">oder</div>
                  <button
                    onClick={loadTestPDF}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    🧪 Test-PDF verwenden (Kindergarten-Anmeldung)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                      setDetectionResult(null);
                    }}
                    className="px-4 py-2 text-red-600 hover:text-red-700 font-medium border border-red-300 rounded hover:bg-red-50 transition-colors"
                  >
                    Entfernen
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={processPDF}
                    disabled={isProcessing}
                    className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                      isProcessing
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verarbeite PDF...
                      </>
                    ) : (
                      <>
                        🤖 Felder automatisch erkennen
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    {isProcessing 
                      ? 'KI analysiert das PDF und erkennt Felder...'
                      : 'Klicken Sie hier um die automatische Felderkennung zu starten'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Detection Results */}
          {detectionResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4 text-lg">
                ✅ Felderkennung erfolgreich
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-green-600">{detectionResult.formFields?.length || 0}</div>
                  <div className="text-sm text-gray-600">Erkannte Felder</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-blue-600">{detectionResult.translatedTexts?.length || 0}</div>
                  <div className="text-sm text-gray-600">Übersetzte Texte</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-purple-600">{detectionResult.totalPages || 1}</div>
                  <div className="text-sm text-gray-600">Seiten</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    showOverlays 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {showOverlays ? '🔴 Overlays verstecken' : '👁️ Overlays anzeigen'}
                </button>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Skalierung:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 w-8">{scaleFactor.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          )}

          {/* PDF Display with Overlays */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                PDF mit automatisch erkannten Feldern
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {detectionResult 
                  ? `Erkannt: ${detectionResult.formFields?.length || 0} Felder, ${detectionResult.translatedTexts?.length || 0} Übersetzungen`
                  : 'Laden Sie eine PDF hoch und starten Sie die Felderkennung'
                }
              </p>
            </div>

            <div className="p-4 flex justify-center">
              <div className="relative">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="border border-gray-300 shadow-lg"
                    style={{
                      width: '600px',
                      height: '800px',
                      minWidth: '400px',
                      minHeight: '600px'
                    }}
                    title="PDF mit erkannten Feldern"
                  />
                ) : (
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

                {/* Translation Overlays */}
                {showOverlays && detectionResult && detectionResult.translatedTexts.map((text, index) => (
                  <div
                    key={`translation-${index}`}
                    className="absolute z-10 bg-blue-500 bg-opacity-80 text-white text-xs p-1 rounded border border-blue-700"
                    style={{
                      left: `${text.x * scaleFactor}px`,
                      top: `${text.y * scaleFactor}px`,
                      width: `${text.width * scaleFactor}px`,
                      height: `${text.height * scaleFactor}px`,
                    }}
                  >
                    <div className="text-center leading-tight">{text.text}</div>
                  </div>
                ))}

                {/* Form Field Overlays */}
                {showOverlays && detectionResult && detectionResult.formFields?.map((field, index) => (
                  <div
                    key={`field-${index}`}
                    className={`absolute z-20 border-2 rounded ${
                      field.isAutoFilled 
                        ? 'bg-green-500 bg-opacity-80 border-green-700' 
                        : 'bg-yellow-500 bg-opacity-80 border-yellow-700'
                    }`}
                    style={{
                      left: `${field.position.x * scaleFactor}px`,
                      top: `${field.position.y * scaleFactor}px`,
                      width: `${field.position.width * scaleFactor}px`,
                      height: `${field.position.height * scaleFactor}px`,
                    }}
                    title={`${field.originalName} → ${field.translation} (${field.confidence}% Vertrauen)`}
                  >
                    <div className="text-white text-xs p-1">
                      <div className="font-bold">{field.translation}</div>
                      {field.value && (
                        <div className="text-xs opacity-90">{field.value}</div>
                      )}
                      <div className="text-xs opacity-75">{field.confidence}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Field Details */}
          {detectionResult && detectionResult.formFields && detectionResult.formFields.length > 0 && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Erkannte Felder Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectionResult.formFields.map((field, index) => (
                  <div key={index} className="bg-white p-4 rounded border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{field.translation}</div>
                        <div className="text-sm text-gray-500">{field.originalName}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        field.isAutoFilled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {field.confidence}%
                      </div>
                    </div>
                    
                    {field.value && (
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Wert:</strong> {field.value}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      <div>Typ: {field.fieldType}</div>
                      <div>Kontext: {field.context}</div>
                      <div>Position: {field.position.x}, {field.position.y}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
