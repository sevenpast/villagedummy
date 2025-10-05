'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestPDFAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/pdf/optimized-form-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Feld-Erkennung Test
            </h1>
            <p className="text-gray-600">
              Testen Sie unser System mit der Kindergarten/Schule Anmeldung PDF
            </p>
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                PDF-Datei hochladen
              </p>
              <p className="text-sm text-gray-500">
                Laden Sie die "Anmeldung_Kindergarten_und_Schule_neu.pdf" hoch
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
                className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Analysiere PDF...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-800">Fehler: {error}</span>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-900">
                    Analyse Abgeschlossen
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Sprache:</span>
                    <p className="text-green-700">{analysisResult.formLanguage || 'Nicht erkannt'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Formular-Titel:</span>
                    <p className="text-green-700">{analysisResult.formTitle || 'Nicht erkannt'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Gesamt Felder:</span>
                    <p className="text-green-700">{analysisResult.fields?.length || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Erkannte Felder:</span>
                    <p className="text-green-700">
                      {analysisResult.fields?.filter((f: any) => f.fieldType).length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fields List */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Erkannte Formularfelder
                </h3>
                
                {analysisResult.fields && analysisResult.fields.length > 0 ? (
                  <div className="space-y-3">
                    {analysisResult.fields.map((field: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Feldname:</span>
                            <p className="text-gray-900 font-mono text-sm">{field.fieldName}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Typ:</span>
                            <p className="text-gray-900">{field.fieldType || 'Unbekannt'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium text-gray-600">Original Label:</span>
                            <p className="text-gray-900">{field.originalLabel || 'Nicht erkannt'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium text-gray-600">Übersetztes Label:</span>
                            <p className="text-blue-600">{field.translatedLabel || 'Nicht übersetzt'}</p>
                          </div>
                          {field.options && field.options.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-sm font-medium text-gray-600">Optionen:</span>
                              <div className="mt-1 space-y-1">
                                {field.options.map((option: any, optIndex: number) => (
                                  <div key={optIndex} className="text-sm">
                                    <span className="text-gray-600">{option.original}</span>
                                    <span className="mx-2">→</span>
                                    <span className="text-blue-600">{option.translated}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {field.required && (
                            <div className="md:col-span-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Erforderlich
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Keine Formularfelder erkannt
                  </p>
                )}
              </div>

              {/* Raw Data (for debugging) */}
              <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Raw Analysis Data (für Debugging)
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto max-h-96 bg-white p-3 rounded border">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
