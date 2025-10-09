'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, File, Trash2, Download, Eye, Tag, Edit2 } from 'lucide-react';
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

interface FilterOptions {
  documentTypes: string[];
  tags: string[];
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
  const [customTag, setCustomTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagValue, setEditTagValue] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ documentTypes: [], tags: [] });
  const [selectedDocumentType, setSelectedDocumentType] = useState('all');
  const [selectedTags, setSelectedTags] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

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
        // The load API returns { success, documents }
        const documentsArray = data.documents || data || [];
        
        // Transform document_type to documentType for frontend compatibility
        const transformedDocs = documentsArray.map((doc: any) => ({
          ...doc,
          fileName: doc.file_name || doc.fileName,
          fileType: doc.file_type || doc.fileType,
          fileSize: doc.file_size || doc.fileSize,
          documentType: doc.document_type || doc.documentType,
          uploadedAt: doc.uploaded_at || doc.uploadedAt,
          storagePath: doc.storage_path || doc.storagePath,
        }));
        
        setDocuments(transformedDocs);
        // Update filter options based on loaded documents
        updateFilterOptions(transformedDocs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const updateFilterOptions = (docs: Document[]) => {
    const documentTypes = [...new Set(docs.map(doc => doc.documentType).filter(Boolean))];
    const allTags = [...new Set(docs.flatMap(doc => doc.tags || []))];
    
    setFilterOptions({
      documentTypes: ['all', ...documentTypes],
      tags: ['all', ...allTags]
    });
  };

  const filterDocuments = async () => {
    if (!userId) return;

    try {
      const params = new URLSearchParams({
        userId,
        documentType: selectedDocumentType,
        tags: selectedTags,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/documents/filter-by-tags?${params}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
        setFilterOptions(data.filterOptions);
      } else {
        console.error('Failed to filter documents:', data.error);
      }
    } catch (error) {
      console.error('Error filtering documents:', error);
    }
  };

  const updateDocumentTags = async (documentId: string, newTags: string[], documentType?: string, description?: string) => {
    try {
      const response = await fetch('/api/documents/update-tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          userId,
          tags: newTags,
          documentType,
          description
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the document in the local state
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.id === documentId 
              ? { ...doc, tags: newTags, documentType: documentType || doc.documentType, description: description || doc.description }
              : doc
          )
        );
        console.log('✅ Document tags updated successfully');
      } else {
        console.error('Failed to update document tags:', data.error);
      }
    } catch (error) {
      console.error('Error updating document tags:', error);
    }
  };

  const startEditingTag = (documentId: string, currentTag: string) => {
    setEditingTag(documentId);
    setEditTagValue(currentTag || '');
  };

  const saveTag = async (documentId: string) => {
    if (editTagValue.trim()) {
      // Map common tag values to document types
      const tagToDocumentType: { [key: string]: string } = {
        'passport': 'Reisepass/ID',
        'pass': 'Reisepass/ID',
        'id': 'Reisepass/ID',
        'school': 'Schule/Kindergarten',
        'kindergarten': 'Schule/Kindergarten',
        'anmeldung': 'Schule/Kindergarten',
        'diploma': 'Diplome & Zertifikate',
        'certificate': 'Diplome & Zertifikate',
        'zeugnis': 'Diplome & Zertifikate',
        'work': 'Arbeitsvertrag',
        'employment': 'Arbeitsvertrag',
        'rental': 'Mietvertrag',
        'insurance': 'Versicherung',
        'tax': 'Steuer',
        'bank': 'Bank',
        'medical': 'Medizinisch',
        'legal': 'Rechtlich'
      };
      
      const newDocumentType = tagToDocumentType[editTagValue.toLowerCase()] || editTagValue.trim();
      await updateDocumentTags(documentId, [editTagValue.trim()], newDocumentType);
    }
    setEditingTag(null);
    setEditTagValue('');
  };

  const cancelEditingTag = () => {
    setEditingTag(null);
    setEditTagValue('');
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
        // Add custom tag if provided
        if (customTag.trim()) {
          formData.append('customTag', customTag.trim());
        }
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

  const startEditingTag = (documentId: string, currentTag: string) => {
    setEditingTag(documentId);
    setEditTagValue(currentTag);
  };

  const cancelEditingTag = () => {
    setEditingTag(null);
    setEditTagValue('');
  };

  const saveTag = async (documentId: string) => {
    try {
      const response = await fetch('/api/documents/update-tag', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentId, 
          userId, 
          newTag: editTagValue.trim() 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tag');
      }

      // Update the document in the local state
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, documentType: editTagValue.trim() }
            : doc
        )
      );

      setEditingTag(null);
      setEditTagValue('');
    } catch (error) {
      console.error('Failed to update tag:', error);
      alert(`Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Translate document types to English
  const translateDocumentType = (documentType: string): string => {
    const translations: { [key: string]: string } = {
      'Diplome & Zertifikate': 'Diplomas & Certificates',
      'diploma': 'Diplomas & Certificates',
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
                aria-label="Go back"
                title="Go back"
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
            {/* Custom Tag Input */}
            <div className="mb-6">
              <label htmlFor="custom-tag" className="block text-sm font-medium text-gray-700 mb-2">
                Optional: Add a custom tag for your documents
              </label>
              <input
                type="text"
                id="custom-tag"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="e.g., Important, Work, Personal, etc."
                className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This tag will be applied to all documents in this upload batch
              </p>
            </div>
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

          {/* Filter and Sort Section */}
          {documents.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filter & Sort Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Document Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Filter by document type"
                  >
                    {filterOptions.documentTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <select
                    value={selectedTags}
                    onChange={(e) => setSelectedTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Filter by tags"
                  >
                    {filterOptions.tags.map(tag => (
                      <option key={tag} value={tag}>
                        {tag === 'all' ? 'All Tags' : tag}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Sort documents by"
                  >
                    <option value="created_at">Upload Date</option>
                    <option value="file_name">File Name</option>
                    <option value="document_type">Document Type</option>
                    <option value="file_size">File Size</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Sort order"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={filterDocuments}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filter & Sort Documents</h3>
              <p className="text-gray-500">Upload documents to see filtering and sorting options.</p>
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
                        {/* Document Type and Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Type:</span>
                            {editingTag === doc.id ? (
                            <div className="flex items-center space-x-1">
                              <select
                                value={editTagValue}
                                onChange={(e) => setEditTagValue(e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              >
                                <option value="">Select document type...</option>
                                <option value="Reisepass/ID">Reisepass/ID</option>
                                <option value="Schule/Kindergarten">Schule/Kindergarten</option>
                                <option value="Diplome & Zertifikate">Diplome & Zertifikate</option>
                                <option value="Arbeitsvertrag">Arbeitsvertrag</option>
                                <option value="Mietvertrag">Mietvertrag</option>
                                <option value="Versicherung">Versicherung</option>
                                <option value="Steuer">Steuer</option>
                                <option value="Bank">Bank</option>
                                <option value="Familie">Familie</option>
                                <option value="Medizinisch">Medizinisch</option>
                                <option value="Rechtlich">Rechtlich</option>
                                <option value="Sonstiges">Sonstiges</option>
                              </select>
                              <button
                                onClick={() => saveTag(doc.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Save tag"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditingTag}
                                className="text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              {doc.documentType && doc.documentType !== 'Unbekanntes Dokument' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {translateDocumentType(doc.documentType)}
                                </span>
                              )}
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="text-sm font-medium text-gray-700">Tags:</span>
                                  {doc.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {doc.tags.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                      +{doc.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                              {(!doc.documentType || doc.documentType === 'Unbekanntes Dokument') && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Tag className="w-3 h-3 mr-1" />
                                  Unknown Document
                                </span>
                              )}
                            </>
                          )}
                          </div>
                        </div>
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
                      onClick={() => startEditingTag(doc.id, doc.documentType)}
                      className="px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Edit Document Type"
                    >
                      <Edit2 className="w-4 h-4 mr-1 inline" />
                      Edit
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