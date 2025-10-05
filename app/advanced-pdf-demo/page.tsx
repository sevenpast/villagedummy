'use client';

import { useState, useRef } from 'react';
import BilingualPDFOverlay from '../../components/BilingualPDFOverlay';

interface ProcessingOptions {
  enableOCR: boolean;
  enableTranslation: boolean;
  enableLayoutPreservation: boolean;
  translationProvider: string;
  targetLanguage: string;
  displayMode: 'original' | 'translated' | 'bilingual' | 'side-by-side';
}

interface BatchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  files: any[];
  progress: number;
  results: any[];
}

export default function AdvancedPDFDemo() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [scaleFactor, setScaleFactor] = useState(0.6);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  const [options, setOptions] = useState<ProcessingOptions>({
    enableOCR: true,
    enableTranslation: true,
    enableLayoutPreservation: true,
    translationProvider: 'Free Translation (Offline)',
    targetLanguage: 'en',
    displayMode: 'bilingual'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      alert('Nur PDF-Dateien sind erlaubt.');
    }
    
    setFiles(pdfFiles);
    setProcessingResults(null);
  };

  const processSingleFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));
      
      const response = await fetch('/api/pdf/advanced-process', {
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

  const processBatch = async () => {
    if (files.length === 0) return;
    
    setIsBatchProcessing(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('options', JSON.stringify(options));
      
      const response = await fetch('/api/pdf/batch-process', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setBatchJobs(prev => [...prev, result]);
        
        // Poll for updates
        pollBatchStatus(result.jobId);
      } else {
        throw new Error('Failed to start batch processing');
      }
    } catch (error) {
      console.error('Error starting batch processing:', error);
      alert('Fehler beim Starten der Batch-Verarbeitung: ' + (error as Error).message);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const pollBatchStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/pdf/batch-status/${jobId}`);
        if (response.ok) {
          const job = await response.json();
          setBatchJobs(prev => prev.map(j => j.id === jobId ? job : j));
          
          if (job.status === 'processing') {
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling batch status:', error);
      }
    };
    
    poll();
  };

  const loadTestPDF = async () => {
    try {
      const response = await fetch('/api/generate-test-pdf');
      if (response.ok) {
        const pdfBlob = await response.blob();
        const testFile = new File([pdfBlob], 'test-form.pdf', { type: 'application/pdf' });
        setFiles([testFile]);
        setProcessingResults(null);
      }
    } catch (error) {
      console.error('Error loading test PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚀 Advanced PDF Processing Demo
          </h1>
          
          <p className="text-gray-600 mb-6">
            Vollständige PDF-Verarbeitung mit OCR, Übersetzung, Layout-Erhaltung und Batch-Processing
          </p>

          {/* Processing Options */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">⚙️ Verarbeitungsoptionen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableOCR"
                  checked={options.enableOCR}
                  onChange={(e) => setOptions(prev => ({ ...prev, enableOCR: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="enableOCR" className="text-sm font-medium">🔍 OCR für gescannte PDFs</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableTranslation"
                  checked={options.enableTranslation}
                  onChange={(e) => setOptions(prev => ({ ...prev, enableTranslation: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="enableTranslation" className="text-sm font-medium">🌐 Automatische Übersetzung</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableLayoutPreservation"
                  checked={options.enableLayoutPreservation}
                  onChange={(e) => setOptions(prev => ({ ...prev, enableLayoutPreservation: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="enableLayoutPreservation" className="text-sm font-medium">📐 Layout-Erhaltung</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Übersetzungsanbieter</label>
                <select
                  value={options.translationProvider}
                  onChange={(e) => setOptions(prev => ({ ...prev, translationProvider: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="Free Translation (Offline)">🆓 Kostenlos (Offline)</option>
                  <option value="Google Translate">🌐 Google Translate (API Key benötigt)</option>
                  <option value="DeepL">🔷 DeepL (API Key benötigt)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zielsprache</label>
                <select
                  value={options.targetLanguage}
                  onChange={(e) => setOptions(prev => ({ ...prev, targetLanguage: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="en">Englisch</option>
                  <option value="fr">Französisch</option>
                  <option value="es">Spanisch</option>
                  <option value="it">Italienisch</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anzeigemodus</label>
                <select
                  value={options.displayMode}
                  onChange={(e) => setOptions(prev => ({ ...prev, displayMode: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="original">Nur Original</option>
                  <option value="translated">Nur Übersetzung</option>
                  <option value="bilingual">Bilingual (Original → Übersetzung)</option>
                  <option value="side-by-side">Nebeneinander (Original | Übersetzung)</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-4 text-lg">📁 Datei-Upload</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors border-2 border-green-600 hover:border-green-700"
                >
                  <div className="text-2xl mb-2">📁</div>
                  <div className="font-semibold text-lg">PDF-Dateien auswählen</div>
                  <div className="text-sm opacity-90">Mehrere Dateien möglich</div>
                </button>
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
              
              {files.length > 0 && (
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-900 mb-2">Ausgewählte Dateien ({files.length})</h4>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">PDF</span>
                          </div>
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Entfernen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Processing Controls */}
          {files.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-purple-900 mb-4 text-lg">⚡ Verarbeitung</h3>
              
              <div className="flex gap-4">
                {files.length === 1 && (
                  <button
                    onClick={() => processSingleFile(files[0])}
                    disabled={isProcessing}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      isProcessing
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verarbeite...
                      </>
                    ) : (
                      '🚀 Einzeldatei verarbeiten'
                    )}
                  </button>
                )}
                
                <button
                  onClick={processBatch}
                  disabled={isBatchProcessing}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isBatchProcessing
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isBatchProcessing ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Batch-Verarbeitung...
                    </>
                  ) : (
                    `📦 Batch verarbeiten (${files.length} Dateien)`
                  )}
                </button>
              </div>
            </div>
          )}

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

          {/* PDF Display with Bilingual Overlay */}
          {processingResults && (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  PDF mit erweiterten Overlays
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  OCR: {options.enableOCR ? '✅' : '❌'} | 
                  Übersetzung: {options.enableTranslation ? '✅' : '❌'} | 
                  Layout: {options.enableLayoutPreservation ? '✅' : '❌'}
                </p>
              </div>

              <div className="p-4 flex justify-center">
                <BilingualPDFOverlay
                  pdfUrl={processingResults.pdfUrl}
                  textBlocks={processingResults.translatedTexts || []}
                  formFields={processingResults.detectedFields || []}
                  scaleFactor={scaleFactor}
                  showOverlays={showOverlays}
                  displayMode={options.displayMode}
                  onDisplayModeChange={(mode) => setOptions(prev => ({ ...prev, displayMode: mode }))}
                />
              </div>
            </div>
          )}

          {/* Batch Jobs Status */}
          {batchJobs.length > 0 && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Batch-Jobs Status</h3>
              
              <div className="space-y-4">
                {batchJobs.map(job => (
                  <div key={job.id} className="bg-white p-4 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">Job {job.id}</div>
                        <div className="text-sm text-gray-500">
                          Status: <span className={`font-medium ${
                            job.status === 'completed' ? 'text-green-600' :
                            job.status === 'processing' ? 'text-blue-600' :
                            job.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                          }`}>{job.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{job.progress.toFixed(1)}%</div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {job.results.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Erfolgreich: {job.results.filter(r => r.success).length} / {job.results.length} Dateien
                      </div>
                    )}
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
