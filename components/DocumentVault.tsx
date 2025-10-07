'use client';

import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, Download, Mail, Search, Filter, Eye, Tag } from 'lucide-react';
import DocumentRecognitionService, { DocumentAnalysis } from '../services/document-recognition-service';

interface StoredDocument {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  tags: string[];
  confidence: number;
  description: string;
  uploadedAt: string;
  fileData?: string; // Base64 encoded file data
}

interface DocumentVaultProps {
  userId?: string;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ userId }) => {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<StoredDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [documentService, setDocumentService] = useState<DocumentRecognitionService | null>(null);

  useEffect(() => {
    try {
      setDocumentService(new DocumentRecognitionService());
    } catch (error) {
      console.warn('DocumentRecognitionService initialization failed:', error);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    try {
      const stored = localStorage.getItem(`documents_vault_${userId || 'default'}`);
      if (stored) {
        setDocuments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const saveDocuments = (docs: StoredDocument[]) => {
    try {
      localStorage.setItem(`documents_vault_${userId || 'default'}`, JSON.stringify(docs));
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  };

  const deleteDocument = (documentId: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      saveDocuments(updatedDocuments);
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
        body: JSON.stringify({ userId: userId || 'default' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download ZIP');
      }

      // Get the ZIP file as blob
      const zipBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents_${userId || 'default'}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ ZIP download completed successfully');
    } catch (error) {
      console.error('❌ ZIP download failed:', error);
      alert(`Failed to download ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress('Uploading file...');

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      setUploadProgress('Analyzing document with AI...');

      let analysis: DocumentAnalysis;
      try {
        // Try AI analysis first if service is available
        if (documentService) {
          analysis = await documentService.analyzeDocument(file);
        } else {
          throw new Error('Document service not available');
        }
      } catch (error) {
        console.warn('AI analysis failed, using basic pattern matching:', error);
        // Fallback to basic analysis
        analysis = {
          documentType: 'other',
          confidence: 0.5,
          tags: ['other'],
          description: 'Document uploaded successfully',
          extractedText: '',
          detectedLanguage: 'unknown'
        };
      }

      setUploadProgress('Saving document...');

      // Create document record
      const newDocument: StoredDocument = {
        id: Date.now() + Math.random(),
        fileName: `${Date.now()}_${file.name}`,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: analysis.documentType,
        tags: analysis.tags,
        confidence: analysis.confidence,
        description: analysis.description,
        uploadedAt: new Date().toISOString(),
        fileData: base64
      };

      // Save to storage
      const updatedDocuments = [...documents, newDocument];
      saveDocuments(updatedDocuments);

      setUploadProgress('Document uploaded successfully!');
      setTimeout(() => setUploadProgress(''), 2000);

    } catch (error) {
      console.error('File processing failed:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(''), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


  const downloadDocument = (document: StoredDocument) => {
    if (!document.fileData) return;

    const link = document.createElement('a');
    link.href = document.fileData;
    link.download = document.originalName;
    link.click();
  };

  const createEmailWithAttachment = (document: StoredDocument) => {
    const mailtoLink = DocumentRecognitionService.createMailtoLink(
      document.documentType,
      '',
      document.originalName
    );

    // For now, we'll open the email client and inform the user about the attachment
    window.open(mailtoLink);

    // Show instructions for manual attachment
    alert(`Email opened! Please manually attach: ${document.originalName}\n\nNote: Automatic attachment will be implemented in a future update.`);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterType === 'all' || doc.documentType === filterType;

    return matchesSearch && matchesFilter;
  });

  const getDocumentTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      passport: '🛂',
      driver_license: '🚗',
      residence_permit: '🏠',
      birth_certificate: '👶',
      marriage_certificate: '💒',
      diploma: '🎓',
      contract: '📝',
      insurance: '🛡️',
      bank_statement: '🏦',
      tax_document: '💰',
      medical_record: '🏥',
      other: '📄'
    };
    return icons[type] || '📄';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const documentTypes = [
    'all', 'passport', 'driver_license', 'residence_permit', 'birth_certificate',
    'marriage_certificate', 'diploma', 'contract', 'insurance', 'bank_statement',
    'tax_document', 'medical_record', 'other'
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📁 Document Vault</h2>
        <p className="text-gray-600">Securely store your documents with AI-powered recognition</p>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-5 h-5 mr-2" />
            {isUploading ? 'Processing...' : 'Upload Documents'}
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Supports images and PDFs. AI will automatically detect document type.
          </p>
          {uploadProgress && (
            <p className="mt-2 text-sm font-medium text-blue-600">{uploadProgress}</p>
          )}
        </div>
      </div>

      {/* Download All as ZIP Section */}
      {documents.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <button
              onClick={downloadAllAsZip}
              disabled={isDownloadingZip}
              className={`inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 cursor-pointer ${
                isDownloadingZip ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download className="w-5 h-5 mr-2" />
              {isDownloadingZip ? 'Creating ZIP...' : `Download All (${documents.length} documents)`}
            </button>
            <p className="mt-2 text-sm text-blue-600">
              Download all your documents as a single ZIP file
            </p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {documentTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((document) => (
          <div 
            key={document.id} 
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative"
            onClick={() => {
              setSelectedDocument(document);
              setShowPreview(true);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 truncate">{document.originalName}</h3>
                <p className="text-sm text-gray-500">
                  {document.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDocument(document.id);
                }}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {document.tags.slice(0, 3).map((tag, index) => {
                  // Format the first tag (document type) specially
                  const isDocumentType = index === 0;
                  const displayTag = isDocumentType 
                    ? tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : tag;
                  
                  return (
                    <span
                      key={index}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isDocumentType 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {displayTag}
                    </span>
                  );
                })}
                {document.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{document.tags.length - 3} more</span>
                )}
              </div>

              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {documents.length === 0 ? (
            <div>
              <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No documents uploaded yet.</p>
              <p className="text-sm">Upload your first document to get started!</p>
            </div>
          ) : (
            <div>
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No documents match your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedDocument.originalName}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800">Document Information</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Type:</span> {selectedDocument.documentType}</p>
                  <p><span className="font-medium">Confidence:</span> {Math.round(selectedDocument.confidence * 100)}%</p>
                  <p><span className="font-medium">Size:</span> {formatFileSize(selectedDocument.fileSize)}</p>
                  <p><span className="font-medium">Uploaded:</span> {new Date(selectedDocument.uploadedAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Description</h4>
                <p className="mt-1 text-sm text-gray-600">{selectedDocument.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Tags</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedDocument.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {selectedDocument.fileData && selectedDocument.fileType.startsWith('image/') && (
                <div>
                  <h4 className="font-medium text-gray-800">Preview</h4>
                  <img
                    src={selectedDocument.fileData}
                    alt={selectedDocument.originalName}
                    className="mt-2 max-w-full h-auto rounded border"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => downloadDocument(selectedDocument)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => createEmailWithAttachment(selectedDocument)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;