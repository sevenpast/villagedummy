'use client';

import { useState } from 'react';

interface SimpleProcessingOptions {
  enableTranslation: boolean;
  targetLanguage: string;
  displayMode: 'original' | 'translated' | 'bilingual';
}

export default function SimplePDFDemo() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [scaleFactor, setScaleFactor] = useState(0.6);
  
  const [options, setOptions] = useState<SimpleProcessingOptions>({
    enableTranslation: true,
    targetLanguage: 'en',
    displayMode: 'bilingual'
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setPdfFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setProcessingResults(null);
    } else {
      setPdfFile(null);
      setPdfUrl(null);
      setProcessingResults(null);
      alert('Bitte wählen Sie eine PDF-Datei aus.');
    }
  };

  const processPDF = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('options', JSON.stringify(options));
      
      const response = await fetch('/api/pdf/simple-process', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProcessingResults(result);
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
      const response = await fetch('/api/generate-test-pdf');
      if (response.ok) {
        const pdfBlob = await response.blob();
        const testFile = new File([pdfBlob], 'test-form.pdf', { type: 'application/pdf' });
        setPdfFile(testFile);
        setPdfUrl(URL.createObjectURL(pdfBlob));
        setProcessingResults(null);
      }
    } catch (error) {
      console.error('Error loading test PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📄 Simple PDF Demo (Kostenlos)
          </h1>
          
          <p className="text-gray-600 mb-6">
            Einfache PDF-Verarbeitung mit kostenlosen Übersetzungen - keine API-Keys erforderlich!
          </p>

          {/* Processing Options */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">⚙️ Verarbeitungsoptionen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableTranslation"
                  checked={options.enableTranslation}
                  onChange={(e) => setOptions(prev => ({ ...prev, enableTranslation: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="enableTranslation" className="text-sm font-medium">🌐 Kostenlose Übersetzung</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zielsprache</label>
                <select
                  value={options.targetLanguage}
                  onChange={(e) => setOptions(prev => ({ ...prev, targetLanguage: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="en">🇺🇸 Englisch</option>
                  <option value="fr">🇫🇷 Französisch</option>
                  <option value="es">🇪🇸 Spanisch</option>
                  <option value="it">🇮🇹 Italienisch</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anzeigemodus</label>
                <select
                  value={options.displayMode}
                  onChange={(e) => setOptions(prev => ({ ...prev, displayMode: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="original">📄 Nur Original</option>
                  <option value="translated">🌐 Nur Übersetzung</option>
                  <option value="bilingual">🔄 Bilingual (Original → Übersetzung)</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-4 text-lg">📁 PDF Upload</h3>
            
            {!pdfFile ? (
              <div className="space-y-4">
                <div className="text-center">
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors border-2 border-green-600 hover:border-green-700">
                      <div className="text-2xl mb-2">📁</div>
                      <div className="font-semibold text-lg">PDF-Datei auswählen</div>
                      <div className="text-sm opacity-90">Klicken Sie hier um eine PDF hochzuladen</div>
                    </div>
                  </label>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-500 mb-2">oder</div>
                  <button
                    onClick={loadTestPDF}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    🧪 Test-PDF verwenden
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
                      setProcessingResults(null);
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
                      '🚀 PDF verarbeiten'
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    {isProcessing 
                      ? 'Analysiere PDF und erkenne Felder...'
                      : 'Klicken Sie hier um die PDF-Verarbeitung zu starten'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Results Display */}
          {processingResults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4 text-lg">✅ Verarbeitungsergebnisse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-green-600">{processingResults.detectedFields?.length || 0}</div>
                  <div className="text-sm text-gray-600">Erkannte Felder</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-blue-600">{processingResults.translatedTexts?.length || 0}</div>
                  <div className="text-sm text-gray-600">Übersetzungen</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-purple-600">{processingResults.confidence?.toFixed(1) || 0}%</div>
                  <div className="text-sm text-gray-600">Vertrauen</div>
                </div>
              </div>

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

          {/* PDF Display */}
          {pdfUrl && (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  PDF mit Overlays
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {processingResults 
                    ? `Erkannt: ${processingResults.detectedFields?.length || 0} Felder, ${processingResults.translatedTexts?.length || 0} Übersetzungen`
                    : 'Laden Sie eine PDF hoch und starten Sie die Verarbeitung'
                  }
                </p>
              </div>

              <div className="p-4 flex justify-center">
                <div className="relative">
                  <iframe
                    src={pdfUrl}
                    className="border border-gray-300 shadow-lg"
                    style={{
                      width: '600px',
                      height: '800px',
                      minWidth: '400px',
                      minHeight: '600px'
                    }}
                    title="PDF mit Overlays"
                  />

                  {/* Translation Overlays */}
                  {showOverlays && processingResults && processingResults.translatedTexts?.map((text: any, index: number) => (
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
                      <div className="text-center leading-tight">
                        {options.displayMode === 'original' ? text.originalText :
                         options.displayMode === 'translated' ? text.text :
                         `${text.originalText} → ${text.text}`}
                      </div>
                    </div>
                  ))}

                  {/* Form Field Overlays */}
                  {showOverlays && processingResults && processingResults.detectedFields?.map((field: any, index: number) => (
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
                        <div className="font-bold">
                          {options.displayMode === 'original' ? field.originalName :
                           options.displayMode === 'translated' ? field.translation :
                           `${field.originalName} → ${field.translation}`}
                        </div>
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
          )}
        </div>
      </div>
    </div>
  );
}


