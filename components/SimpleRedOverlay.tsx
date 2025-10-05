'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

export default function SimpleRedOverlay() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState(0.6);
  const [redBoxPosition, setRedBoxPosition] = useState({ x: 100, y: 100, width: 200, height: 50 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview URL
    const previewUrl = URL.createObjectURL(selectedFile);
    setPdfPreviewUrl(previewUrl);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-500 hover:bg-red-50 transition cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Upload PDF for Red Overlay Test
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PDF only, max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
            Choose File
          </button>
        </div>
      )}

      {/* File Selected */}
      {file && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setError(null);
              if (pdfPreviewUrl) {
                URL.revokeObjectURL(pdfPreviewUrl);
                setPdfPreviewUrl(null);
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {pdfPreviewUrl && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">🔧 Red Box Controls</h3>
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
      )}

      {/* PDF with Red Overlay */}
      {pdfPreviewUrl && (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              PDF with Red Overlay Test
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Adjust the controls above to position the red box correctly over the PDF
            </p>
          </div>

          <div
            className="relative bg-white overflow-auto"
            style={{
              height: '600px',
              width: '100%'
            }}
          >
            {/* Original PDF Background */}
            <div className="absolute inset-0 flex justify-center items-start p-4 z-0">
              <iframe
                src={pdfPreviewUrl}
                className="border border-gray-300 shadow-lg"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '500px'
                }}
                title="Original PDF"
              />
            </div>

            {/* Red Overlay Box */}
            <div 
              className="absolute z-10 bg-red-500 bg-opacity-80 border-2 border-red-700"
              style={{
                left: `${redBoxPosition.x * scaleFactor}px`,
                top: `${redBoxPosition.y * scaleFactor}px`,
                width: `${redBoxPosition.width * scaleFactor}px`,
                height: `${redBoxPosition.height * scaleFactor}px`,
              }}
            >
              <div className="flex items-center justify-center h-full text-white font-bold text-sm">
                RED BOX
              </div>
            </div>

            {/* Debug Info */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-20">
              <div>Scale: {scaleFactor}</div>
              <div>X: {redBoxPosition.x}</div>
              <div>Y: {redBoxPosition.y}</div>
              <div>W: {redBoxPosition.width}</div>
              <div>H: {redBoxPosition.height}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


