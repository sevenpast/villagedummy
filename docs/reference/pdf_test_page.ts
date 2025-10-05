// app/test-pdf/page.tsx
'use client';

import { useState } from 'react';
import PDFUploader from '@/features/pdf-upload/components/PDFUploader';

export default function TestPDFPage() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [autoFilling, setAutoFilling] = useState(false);

  // Mock user profile for testing
  const mockUserProfile = {
    first_name: 'Max',
    last_name: 'Mustermann',
    date_of_birth: '1990-01-15',
    email: 'max.mustermann@example.com',
    phone: '+41 79 123 45 67',
    country_of_origin: 'Germany',
    current_address: 'Musterstrasse 123',
    municipality: 'Zürich',
    canton: 'ZH',
    postal_code: '8001',
    employer: 'Tech Company AG',
    has_kids: false,
    num_children: 0
  };

  const handleUploadComplete = (result: any) => {
    console.log('Upload complete:', result);
    setUploadResult(result);
  };

  const handleAutoFill = async () => {
    if (!uploadResult) return;

    setAutoFilling(true);

    try {
      // Get the original PDF file
      const response = await fetch('/api/pdf/get-original', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: uploadResult.file_name })
      });

      const pdfBlob = await response.blob();
      
      // Create FormData for auto-fill
      const formData = new FormData();
      formData.append('pdf', pdfBlob, uploadResult.file_name);
      formData.append('userProfile', JSON.stringify(mockUserProfile));

      // Call auto-fill API
      const fillResponse = await fetch('/api/pdf/auto-fill', {
        method: 'POST',
        body: formData
      });

      if (fillResponse.ok) {
        const filledPdfBlob = await fillResponse.blob();
        
        // Download filled PDF
        const url = URL.createObjectURL(filledPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filled_${uploadResult.file_name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ PDF filled successfully! Check your downloads.');
      } else {
        const error = await fillResponse.json();
        alert(`❌ Auto-fill failed: ${error.error}`);
      }

    } catch (error) {
      console.error('Auto-fill error:', error);
      alert('❌ Auto-fill failed. Check console for details.');
    } finally {
      setAutoFilling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 PDF Auto-Fill Test
          </h1>
          <p className="text-gray-600">
            Upload a PDF form and we'll automatically fill it with test data
          </p>
        </div>

        {/* Mock User Profile */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📝 Test User Profile
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{mockUserProfile.first_name} {mockUserProfile.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-medium">{mockUserProfile.date_of_birth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{mockUserProfile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{mockUserProfile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{mockUserProfile.current_address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="font-medium">{mockUserProfile.postal_code} {mockUserProfile.municipality}</p>
            </div>
          </div>
        </div>

        {/* PDF Uploader */}
        <PDFUploader 
          onUploadComplete={handleUploadComplete}
          documentType="test_form"
        />

        {/* Auto-Fill Button */}
        {uploadResult && uploadResult.is_fillable && (
          <div className="mt-6">
            <button
              onClick={handleAutoFill}
              disabled={autoFilling}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {autoFilling ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Filling PDF...
                </span>
              ) : (
                '🤖 Auto-Fill PDF with Test Data'
              )}
            </button>

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Ready to Auto-Fill!
              </h3>
              <p className="text-sm text-green-800">
                We detected <strong>{uploadResult.analysis_result?.field_count}</strong> fields in your PDF.
                {uploadResult.analysis_result?.detected_fields?.filter((f: any) => f.auto_fillable).length > 0 && (
                  <span> <strong>{uploadResult.analysis_result.detected_fields.filter((f: any) => f.auto_fillable).length}</strong> can be automatically filled.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Non-fillable PDF message */}
        {uploadResult && !uploadResult.is_fillable && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">
              ⚠️ Non-fillable PDF Detected
            </h3>
            <p className="text-sm text-yellow-800">
              This PDF doesn't have fillable form fields. We'll need to use OCR to help you fill it.
              <br />
              <strong>Coming soon:</strong> OCR-powered field detection!
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            📚 How to Test:
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. <strong>Find a fillable PDF form</strong> (e.g., download a German municipality registration form)</li>
            <li>2. <strong>Upload it</strong> using the uploader above</li>
            <li>3. <strong>Check the analysis</strong> - it will show detected fields</li>
            <li>4. <strong>Click "Auto-Fill"</strong> to fill it with test data</li>
            <li>5. <strong>Download and open</strong> the filled PDF to verify!</li>
          </ol>
          
          <div className="mt-4 pt-4 border-t border-blue-300">
            <p className="text-sm text-blue-800">
              💡 <strong>Test PDFs:</strong> Search for "Anmeldeformular Gemeinde" or "Schulanmeldung Formular" PDF on Google to find real Swiss forms.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        {uploadResult && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              🔍 View Analysis Details
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}