'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, File, Trash2, Download, Eye, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  uploadedAt: string;
  storagePath: string;
  tags?: string[];
  confidence?: number;
  description?: string;
  language?: string;
  isSwissDocument?: boolean;
}

export default function VaultPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Get user ID from localStorage or session
    const storedUserData = localStorage.getItem('user_profile');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserId(userData.id || userData.email || 'default');
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUserId('default');
      }
    } else {
      setUserId('default');
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadDocuments();
    }
  }, [userId]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/load?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.documents) {
          setDocuments(data.documents.map((doc: any) => ({
            id: doc.id,
            fileName: doc.file_name,
            fileType: doc.file_type,
            fileSize: doc.file_size,
            documentType: doc.document_type,
            uploadedAt: doc.uploaded_at,
            storagePath: doc.storage_path,
            tags: doc.tags || ['unrecognized'],
            confidence: doc.confidence || 0.5,
            description: doc.description || '',
            language: doc.language || 'DE',
            isSwissDocument: doc.is_swiss_document || true,
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Analyzing document with AI...`);
        
        // Let the server handle intelligent document analysis
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        // Don't provide documentType, tags, or confidence - let the server analyze intelligently

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        if (result.success) {
          console.log(`✅ Uploaded: ${file.name}`);
        }
      }

      await loadDocuments();
      setUploadProgress('Upload completed successfully!');
      
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      console.log('Document deleted successfully');
      await loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/download?documentId=${document.id}&userId=${userId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.fileName;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        console.log(`✅ Downloaded: ${document.fileName}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download document');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadAllAsZip = async () => {
    if (documents.length === 0) {
      alert('No documents to download');
      return;
    }

    setIsDownloadingZip(true);

    try {
      const response = await fetch('/api/documents/download-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `documents_${userId}_${new Date().toISOString().split('T')[0]}.zip`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        console.log('✅ ZIP download completed successfully');
      } else {
        throw new Error('Failed to download ZIP');
      }
    } catch (error) {
      console.error('ZIP download failed:', error);
      alert(`Failed to download ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Translate document types to English
  const translateDocumentType = (documentType: string): string => {
    const translations: { [key: string]: string } = {
      'Diplome & Zertifikate': 'Diplomas & Certificates',
      'Reisepass/ID': 'Passport/ID',
      'Arbeitsvertrag': 'Employment Contract',
      'Mietvertrag': 'Rental Agreement',
      'Lohnabrechnung': 'Payroll',
      'Rechnungen': 'Invoices',
      'Versicherungsunterlagen': 'Insurance Documents',
      'Geburtsurkunde': 'Birth Certificate',
      'Heiratsurkunde': 'Marriage Certificate',
      'Aufenthaltsbewilligung': 'Residence Permit',
      'Bankdokumente': 'Banking Documents',
      'Steuerdokumente': 'Tax Documents',
      'Medizinische Dokumente': 'Medical Documents',
      'Unbekanntes Dokument': 'Unknown Document'
    };
    
    return translations[documentType] || documentType;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Document Vault</h1>
                <p className="text-sm text-gray-500">Secure document storage with AI recognition</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Upload className="w-6 h-6 animate-pulse" />
                  <p className="text-lg font-medium">{uploadProgress}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700">Click to upload documents</p>
                  <p className="text-sm text-gray-500">Supports PDF, JPG, PNG, DOCX, etc.</p>
                </div>
              )}
            </label>
          </div>

          {/* Download All as ZIP Section */}
          {documents.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-center">
                <button
                  onClick={downloadAllAsZip}
                  disabled={isDownloadingZip}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                    isDownloadingZip ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isDownloadingZip ? 'Creating ZIP...' : `Download All (${documents.length} documents)`}
                </button>
                <p className="mt-2 text-sm text-gray-600">
                  Download all your documents as a single ZIP file
                </p>
              </div>
            </div>
          )}

          {/* Document List Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Your Documents ({documents.length})</h2>
          </div>

          {/* Document List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center">No documents uploaded yet.</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <File className="w-6 h-6 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(doc.uploadedAt)}
                        </span>
                        {doc.documentType && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="w-3 h-3 mr-1" />
                            {translateDocumentType(doc.documentType)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      title="Download Document"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { setSelectedDocument(doc); setShowPreview(true); }}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      title="View Document"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete Document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Document Preview Modal */}
          {showPreview && selectedDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.fileName}</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  {selectedDocument.fileType.startsWith('image/') ? (
                    <img
                      src={`/api/documents/preview?documentId=${selectedDocument.id}&userId=${userId}`}
                      alt={selectedDocument.fileName}
                      className="max-w-full h-auto mx-auto"
                    />
                  ) : selectedDocument.fileType === 'application/pdf' ? (
                    <iframe
                      src={`/api/documents/preview?documentId=${selectedDocument.id}&userId=${userId}`}
                      className="w-full h-full"
                      title={selectedDocument.fileName}
                    />
                  ) : (
                    <p className="text-gray-600">No preview available for this file type. Please download to view.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}