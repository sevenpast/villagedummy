"use client";

import React, { useState, ChangeEvent } from 'react';
import { Upload, FileText, Eye, Download, Plus, Trash2, Loader2, Save } from 'lucide-react';

// Interfaces for our data structures
interface FormField {
  label: string;
  translatedLabel?: string; // Make translatedLabel optional
  key: string;
  value: string | boolean;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'question';
  options?: { name: string; originalName: string; label: string }[];
  isPrefilled: boolean;
  group?: string;
  name?: string;
  originalName?: string;
  question?: string;
}

interface TranslatedText {
  originalText: string;
  translatedText: string;
  coordinates: { x: number; y: number; width: number; height: number };
}

interface AnalysisResult {
  translatedTexts: TranslatedText[];
  formFields: FormField[];
}

export default function PdfWorkflowPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [notes, setNotes] = useState<string>('');
  
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Upload, 2: Verify, 3: Saved/Download
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toCamelCase = (s: string) => s
    .replace(/[^a-zA-Z0-9\s]/g, "") // remove special chars
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase())
    .replace(/\s+/g, '');

  const resetState = () => {
    setPdfFile(null);
    setPdfUrl(null);
    setAnalysisResult(null);
    setFormFields([]);
    setNotes('');
    setCurrentStep(1);
    setIsLoading(false);
    setError(null);
    setSuccess(null);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      resetState();
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));

      // Automatically analyze the PDF after upload
      await handleAnalyze(file);
    } else {
      setError("Bitte wählen Sie eine gültige PDF-Datei.");
      setPdfFile(null);
      setPdfUrl(null);
    }
  };

  const handleAnalyze = async (fileToAnalyze?: File) => {
    const file = fileToAnalyze || pdfFile;
    if (!file) {
      setError("Bitte laden Sie zuerst eine PDF hoch.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the new smart field extraction API with OCR
      const response = await fetch('/api/pdf/smart-extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Set empty analysis result since we're not using AI translation
        setAnalysisResult({
          translatedTexts: [],
          formFields: result.data.formFields
        });

        // Use the directly extracted fields (no deduplication needed as they're already unique)
        const extractedFields = result.data.formFields.map((field: any) => ({
          ...field,
          value: field.type === 'checkbox' ? false : '',
          isPrefilled: false
        }));

        setFormFields(extractedFields);
        setCurrentStep(2); // Move to verification step
        setSuccess(`PDF smart analysiert! ${result.data.totalFields} Felder, ${result.data.checkboxGroups} Checkbox-Gruppen, ${result.data.semanticGroups} semantische Gruppen erkannt.`);
      } else {
        setError(result.error || "Ein unbekannter Fehler ist aufgetreten.");
      }
    } catch (err) {
      setError("Analyse fehlgeschlagen. Überprüfen Sie die Server-Logs.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (index: number, property: 'translatedLabel' | 'value', value: string | boolean) => {
      const newFields = [...formFields];
      const field = { ...newFields[index] };

      if (property === 'translatedLabel' && typeof value === 'string') {
          field.translatedLabel = value;
          // Update key based on the new translated label, ensuring uniqueness
          field.key = `${toCamelCase(value)}_${index}`;
      } else if (property === 'value') {
          field.value = value;
      }
      
      newFields[index] = field;
      setFormFields(newFields);
  };
  
  const addField = () => {
      const newIndex = formFields.length;
      const newField: FormField = { 
          label: "Neues Feld", // Original label in German
          translatedLabel: "New Field", // Editable translated label
          key: `newField_${newIndex}`, 
          value: "", 
          type: "text", 
          isPrefilled: false 
      };
      setFormFields([...formFields, newField]);
  };
  
  const removeField = (index: number) => {
      setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/save-form-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: formFields, notes: notes }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("Daten erfolgreich gespeichert!");
        setCurrentStep(3); // Move to the final step
      } else {
        setError(result.error || "Speichern fehlgeschlagen.");
      }
    } catch (err) {
      setError("Speichern fehlgeschlagen. Überprüfen Sie die Server-Logs.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillOriginalPdf = async () => {
    if (!pdfFile) {
      setError("Original-PDF nicht gefunden.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(pdfFile);
      reader.onloadend = async () => {
        const originalPdfBase64 = (reader.result as string).split(',')[1];

        const response = await fetch('/api/fill-original-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalPdfBase64,
            formFields: formFields, // The user-entered form fields
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'filled-form.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setSuccess("PDF erfolgreich ausgefüllt und heruntergeladen.");
        } else {
          const result = await response.json();
          setError(result.error || "PDF-Ausfüllung fehlgeschlagen.");
        }
      };
    } catch (err) {
      setError("Fehler beim Ausfüllen des PDFs. Überprüfen Sie die Logs.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-8xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">AI-Formular-Workflow</h1>
          <p className="text-lg text-gray-500">PDFs analysieren, Felder erkennen und das Original-PDF mit echten Daten ausfüllen.</p>
        </header>

        {error && <div className="mb-6 p-4 rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-md bg-green-50 text-green-700 border border-green-200">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Pane: PDF Upload and Preview */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Phase 1: Analyse & Generierung</h2>
            
            {/* Step 1: Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {!pdfUrl ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Schritt 1: PDF hochladen</h3>
                  <p className="mt-1 text-sm text-gray-500">Laden Sie eine beliebige PDF-Datei hoch, um den Prozess zu starten.</p>
                  <div className="mt-6">
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Datei auswählen
                    </label>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Original PDF Vorschau</h3>
                  <iframe src={pdfUrl} className="w-full h-[70vh] border rounded-md" title="PDF Preview"></iframe>
                </div>
              )}
            </div>

            {pdfFile && isLoading && currentStep === 1 && (
              <div className="w-full flex items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analysiere PDF automatisch...
              </div>
            )}

            {currentStep >= 2 && (
               <div className="mt-4">
                   <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Phase 3: Original PDF ausfüllen</h2>
                   <p className="text-sm text-gray-500 my-2">Laden Sie das Original-PDF mit Ihren eingegebenen Daten ausgefüllt herunter.</p>
                   <button
                      onClick={handleFillOriginalPdf}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300"
                  >
                      {isLoading ? (
                          <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Fülle PDF aus...
                          </>
                      ) : (
                          <>
                              <Download className="mr-2 h-5 w-5" />
                              Ausgefülltes Original-PDF herunterladen
                          </>
                      )}
                  </button>
               </div>
            )}
          </div>

          {/* Right Pane: Dynamic Form and Actions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Phase 2: Verifizierung & Speichern</h2>
            
            <div className="p-6 border rounded-lg bg-gray-50 min-h-[50vh] flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dynamisches Web-Formular</h3>
              {currentStep < 2 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Eye className="h-16 w-16 text-gray-300" />
                  <p className="mt-4">Das Web-Formular erscheint hier nach der AI-Analyse.</p>
                </div>
              ) : (
                <>
                  <form className="space-y-6 flex-grow">
                    {Object.entries(
                      formFields.reduce((groups, field, index) => {
                        const group = field.group || 'Other Fields';
                        if (!groups[group]) groups[group] = [];
                        groups[group].push({ ...field, originalIndex: index });
                        return groups;
                      }, {} as Record<string, (FormField & { originalIndex: number })[]>)
                    ).map(([groupName, fields]) => (
                      <div key={groupName} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                          {groupName}
                        </h4>
                        <div className="space-y-4">
                          {fields.map((field) => (
                            <div key={field.key}>
                              {field.type === 'question' ? (
                                /* Question with checkbox options in table format */
                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                                    <h5 className="text-sm font-medium text-gray-800">
                                      {field.question || field.label}
                                    </h5>
                                  </div>
                                  <div className="p-3">
                                    <div className="grid grid-cols-3 gap-4">
                                      {field.options?.map((option, optionIndex) => (
                                        <label key={`${field.key}_${optionIndex}`} className="flex items-center space-x-2 border border-gray-200 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type={(field as any).groupType === 'single' ? 'radio' : 'checkbox'}
                                            name={(field as any).groupType === 'single' ? field.key : undefined}
                                            value={option.name}
                                            checked={
                                              (field as any).groupType === 'single'
                                                ? field.value === option.name
                                                : Array.isArray(field.value) && field.value.includes(option.name)
                                            }
                                            onChange={(e) => {
                                              if ((field as any).groupType === 'single') {
                                                handleFieldChange(field.originalIndex, 'value', e.target.value);
                                              } else {
                                                // Handle multiple checkboxes
                                                const currentValues = Array.isArray(field.value) ? field.value : [];
                                                const newValues = e.target.checked
                                                  ? [...currentValues, option.name]
                                                  : currentValues.filter(v => v !== option.name);
                                                handleFieldChange(field.originalIndex, 'value', newValues);
                                              }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                          />
                                          <span className="text-sm text-gray-700">{option.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Regular field */
                                <div className="p-3 bg-white rounded border">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.translatedLabel || field.label}
                                        {field.isPrefilled && <span className="text-xs text-indigo-500 ml-2">(prefilled)</span>}
                                      </label>
                                      <span className="text-xs text-gray-500">
                                        Original: {field.originalName || field.name || field.label}
                                      </span>
                                    </div>
                                    <div>
                                      {field.type === 'checkbox' ? (
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={field.value as boolean}
                                            onChange={(e) => handleFieldChange(field.originalIndex, 'value', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                          />
                                          <span className="ml-2 text-sm text-gray-700">
                                            {field.value ? 'Selected' : 'Not selected'}
                                          </span>
                                        </label>
                                      ) : field.type === 'select' ? (
                                        <select
                                          value={field.value as string}
                                          onChange={(e) => handleFieldChange(field.originalIndex, 'value', e.target.value)}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                          <option value="">Select option...</option>
                                          {field.options?.map((option) => (
                                            <option key={option.name} value={option.name}>{option.label}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type={field.type === 'textarea' ? 'text' : 'text'}
                                          value={field.value as string}
                                          onChange={(e) => handleFieldChange(field.originalIndex, 'value', e.target.value)}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          placeholder={`Enter ${field.translatedLabel?.toLowerCase() || 'value'}`}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeField(field.originalIndex)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Remove field"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </form>

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-md font-semibold text-gray-600">Sicherheitsnetz</h4>
                    <p className="text-sm text-gray-500 mb-2">Wurde ein Feld nicht erkannt? Fügen Sie es manuell hinzu.</p>
                    <button
                      onClick={addField}
                      className="flex items-center justify-center rounded-md border border-dashed border-gray-400 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Neues Feld hinzufügen
                    </button>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Zusätzliche Informationen / Notizen</label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Tragen Sie hier weitere wichtige Informationen ein."
                    />
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={isLoading || currentStep === 3}
                      className="flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-400"
                    >
                      {isLoading ? (
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                         <Save className="mr-2 h-5 w-5" />
                      )}
                      Verifizierte Daten speichern
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
