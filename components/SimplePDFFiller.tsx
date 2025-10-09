'use client';

import { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface SimplePDFFillerProps {
  userData: any;
  onFilledPDF?: (pdfBlob: Blob) => void;
}

export default function SimplePDFFiller({ userData, onFilledPDF }: SimplePDFFillerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    filledFields: string[];
    error?: string;
  } | null>(null);
  const [filledPdfBlob, setFilledPdfBlob] = useState<Blob | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
      setFilledPdfBlob(null);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleFillPDF = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userData', JSON.stringify(userData));

      const response = await fetch('/api/pdf/simple-fill', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Convert base64 to blob
        const pdfBytes = Uint8Array.from(atob(data.filledPdf), c => c.charCodeAt(0));
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setFilledPdfBlob(blob);
        setResult({
          success: true,
          filledFields: data.filledFields
        });

        if (onFilledPDF) {
          onFilledPDF(blob);
        }
      } else {
        setResult({
          success: false,
          filledFields: [],
          error: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('PDF filling error:', error);
      setResult({
        success: false,
        filledFields: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFilledPDF = () => {
    if (filledPdfBlob) {
      const url = URL.createObjectURL(filledPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled_${selectedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Simple PDF Auto-Fill
      </h3>
      
      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF Form
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        {/* User Data Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available User Data:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {userData.first_name && (
              <div><span className="font-medium">First Name:</span> {userData.first_name}</div>
            )}
            {userData.last_name && (
              <div><span className="font-medium">Last Name:</span> {userData.last_name}</div>
            )}
            {userData.email && (
              <div><span className="font-medium">Email:</span> {userData.email}</div>
            )}
            {userData.phone && (
              <div><span className="font-medium">Phone:</span> {userData.phone}</div>
            )}
            {userData.address && (
              <div><span className="font-medium">Address:</span> {userData.address}</div>
            )}
            {userData.target_postal_code && (
              <div><span className="font-medium">Postal Code:</span> {userData.target_postal_code}</div>
            )}
            {userData.target_municipality && (
              <div><span className="font-medium">City:</span> {userData.target_municipality}</div>
            )}
            {userData.country_of_origin && (
              <div><span className="font-medium">Country:</span> {userData.country_of_origin}</div>
            )}
            {userData.children && userData.children.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">Children:</span> {userData.children.length} child(ren)
                {userData.children[0].first_name && (
                  <span> - First child: {userData.children[0].first_name} {userData.children[0].last_name}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fill Button */}
        <button
          onClick={handleFillPDF}
          disabled={!selectedFile || isProcessing}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing PDF...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Auto-Fill PDF
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              )}
              <div className="flex-1">
                {result.success ? (
                  <div>
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      PDF Successfully Filled!
                    </h4>
                    <p className="text-sm text-green-700 mb-2">
                      Filled {result.filledFields.length} fields automatically.
                    </p>
                    {result.filledFields.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-green-800 mb-1">Filled fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.filledFields.map((field, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={downloadFilledPDF}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Filled PDF
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      PDF Filling Failed
                    </h4>
                    <p className="text-sm text-red-700">
                      {result.error || 'An unknown error occurred'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
