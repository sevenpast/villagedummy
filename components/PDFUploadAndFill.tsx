'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Save } from 'lucide-react';
import AdjustablePDFOverlay from './AdjustablePDFOverlay'; // We will use this to display the interactive PDF

export default function PDFUploadAndFill({ 
  userId, 
  taskId 
}: { 
  userId: string; 
  taskId: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [interactivePdfUrl, setInteractivePdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfOverlayRef = useRef<{ getFieldValues: () => Promise<Record<string, string>> }>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setInteractivePdfUrl(null);
    await generateInteractiveForm(selectedFile);
  };

  const generateInteractiveForm = async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/generate-form', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate interactive form');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setInteractivePdfUrl(pdfUrl);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!pdfOverlayRef.current) {
      setError('PDF viewer is not available.');
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      const fieldValues = await pdfOverlayRef.current.getFieldValues();
      
      const response = await fetch('/api/save-form-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          taskId,
          formData: fieldValues,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save data');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000); // Reset after 3s

    } catch (err: any) {
      setError(err.message || 'Failed to save data');
      setSaveStatus('error');
    }
  };

  const resetState = () => {
    setFile(null);
    setProcessing(false);
    setInteractivePdfUrl(null);
    setError(null);
    setSaveStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Upload Area */}
      {!interactivePdfUrl && !processing && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Upload a PDF Form</p>
          <p className="text-sm text-gray-500 mb-4">I will make it interactive, translated, and pre-filled for you.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
            Choose File
          </button>
        </div>
      )}

      {/* 2. Processing State */}
      {processing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-lg font-medium text-blue-900">Analyzing & Rebuilding PDF...</p>
          <p className="text-sm text-blue-700 mt-2">This may take 10-30 seconds. I'm converting the PDF to an image, sending it to the AI, and rebuilding it as an interactive form.</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
         <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
           <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
           <div>
             <p className="font-medium text-red-900">An Error Occurred</p>
             <p className="text-sm text-red-700 mt-1">{error}</p>
           </div>
           <button onClick={resetState} className="ml-auto text-sm font-medium text-gray-600 hover:text-gray-900">Try Again</button>
         </div>
      )}

      {/* 3. Interactive PDF Viewer and Save Button */}
      {interactivePdfUrl && !error && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Interactive Form</h3>
            <button onClick={resetState} className="text-sm font-medium text-red-600 hover:text-red-800">Start Over</button>
          </div>
          
          <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
            <AdjustablePDFOverlay ref={pdfOverlayRef} pdfUrl={interactivePdfUrl} />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-5 h-5" /> Save Filled Data</>
              )}
            </button>
            {saveStatus === 'success' && <p className="text-green-600">Data saved successfully!</p>}
            {saveStatus === 'error' && <p className="text-red-600">Failed to save. Please try again.</p>}
          </div>
        </div>
      )}
    </div>
  );
}