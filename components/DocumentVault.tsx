'use client';

import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, Download, Eye, Tag, Plus } from 'lucide-react';

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
}

interface DocumentVaultProps {
  userId?: string;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ userId = 'default' }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
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
            tags: ['unrecognized'],
            confidence: 0.5,
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
        setUploadProgress(`Uploading ${file.name}...`);

        // Step 1: Basic document type detection (Gemini temporarily disabled)
        setUploadProgress(`Processing ${file.name}...`);
        
        let documentType = 'Other';
        let tags = ['unrecognized'];
        let confidence = 0.5;

        // Basic filename-based detection
        const fileName = file.name.toLowerCase();
        if (fileName.includes('passport') || fileName.includes('pass') || fileName.includes('reisepass')) {
          documentType = 'Passport';
          tags = ['passport', 'identity'];
          confidence = 0.8;
        } else if (fileName.includes('id') || fileName.includes('identity')) {
          documentType = 'ID Card';
          tags = ['id', 'identity'];
          confidence = 0.8;
        } else if (fileName.includes('diploma') || fileName.includes('degree') || fileName.includes('zeugnis')) {
          documentType = 'Education Certificate';
          tags = ['education', 'certificate'];
          confidence = 0.8;
        } else if (fileName.includes('contract') || fileName.includes('employment')) {
          documentType = 'Employment Contract';
          tags = ['employment', 'contract'];
          confidence = 0.8;
        } else if (fileName.includes('birth') || fileName.includes('geburt')) {
          documentType = 'Birth Certificate';
          tags = ['birth', 'certificate'];
          confidence = 0.8;
        } else if (fileName.includes('marriage') || fileName.includes('heirat')) {
          documentType = 'Marriage Certificate';
          tags = ['marriage', 'certificate'];
          confidence = 0.8;
        }

        console.log(`✅ Document type detected: ${documentType} (confidence: ${confidence})`);

        setUploadProgress(`Uploading ${file.name}...`);

        // Step 2: Upload to Supabase Storage with analysis results
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('documentType', documentType);
        formData.append('tags', JSON.stringify(tags));
        formData.append('confidence', confidence.toString());

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

      // Reload documents after upload
      await loadDocuments();
      setUploadProgress('Upload completed successfully!');
      
      // Clear the input
      event.target.value = '';

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

      if (response.ok) {
        // Remove from local state
        setDocuments(docs => docs.filter(doc => doc.id !== documentId));
        console.log('✅ Document deleted successfully');
      } else {
        throw new Error('Failed to delete document');
      }
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
      } else {
        throw new Error('Failed to download document');
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

    setIsDownloading(true);
    
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
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Vault</h1>
        <p className="text-gray-600">Manage and organize your important documents</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Drag & drop or click to upload</span>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isUploading ? 'Uploading...' : 'Choose files to upload'}
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOC, DOCX, JPG, PNG, TXT files supported
            </p>
          </label>
        </div>

        {uploadProgress && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">{uploadProgress}</p>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Documents ({documents.length})
            </h2>
            {documents.length > 0 && (
              <button
                onClick={downloadAllAsZip}
                disabled={isDownloading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Creating ZIP...' : 'Download All as ZIP'}
              </button>
            )}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <File className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {doc.fileName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatFileSize(doc.fileSize)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(doc.uploadedAt)}
                        </span>
                        {doc.documentType && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="w-3 h-3 mr-1" />
                            {doc.documentType}
                          </span>
                        )}
                        {doc.confidence && doc.confidence > 0.7 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            AI: {(doc.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                        {doc.tags && doc.tags.length > 0 && doc.tags[0] !== 'unrecognized' && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                {tag}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{doc.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVault;
