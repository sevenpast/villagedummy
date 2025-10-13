'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DocumentUpload } from './DocumentUpload'
import { DocumentList } from './DocumentList'

interface Document {
  id: string
  user_id: string
  category: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  created_at: string
}

const CATEGORIES = [
  { id: 'Reisepass/ID', name: 'Passport/ID', icon: '' },
  { id: 'Schule/Kindergarten', name: 'School/Kindergarten', icon: '' },
  { id: 'Arbeitsvertrag', name: 'Employment Contract', icon: '' },
  { id: 'Diplome & Zertifikate', name: 'Diplomas & Certificates', icon: '' },
  { id: 'Mietvertrag', name: 'Rental Agreement', icon: '' },
  { id: 'Lohnabrechnung', name: 'Payroll', icon: '' },
  { id: 'Rechnungen', name: 'Invoices', icon: '' },
  { id: 'Versicherungsunterlagen', name: 'Insurance Documents', icon: '' },
  { id: 'Geburtsurkunde', name: 'Birth Certificate', icon: '' },
  { id: 'Heiratsurkunde', name: 'Marriage Certificate', icon: '' },
  { id: 'Aufenthaltsbewilligung', name: 'Residence Permit', icon: '' },
  { id: 'Bankdokumente', name: 'Banking Documents', icon: '' },
  { id: 'Steuerdokumente', name: 'Tax Documents', icon: '' },
  { id: 'Medizinische Dokumente', name: 'Medical Documents', icon: '' },
  { id: 'Unbekanntes Dokument', name: 'Unknown Document', icon: '' }
]

export default function DocumentVault() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, selectedCategory])

  const filterDocuments = () => {
    let filtered = documents

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory)
    }

    setFilteredDocuments(filtered)
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading documents:', error)
        setError('Failed to load documents')
        return
      }

      setDocuments(data || [])
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUploaded = () => {
    loadDocuments()
  }

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      newSet.delete(documentId)
      return newSet
    })
  }

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)))
    }
  }

  const handleDownloadSelected = async () => {
    if (selectedDocuments.size === 0) return

    setIsDownloadingAll(true)
    try {
      for (const documentId of selectedDocuments) {
        const doc = documents.find(d => d.id === documentId)
        if (doc) {
          // Method 1: Direct blob download (most reliable for direct download)
          try {
            const { data, error } = await supabase.storage
              .from('documents')
              .download(doc.storage_path)

            if (error) {
              throw error
            }

            // Create download link from blob - this forces direct download
            const url = URL.createObjectURL(data)
            const link = window.document.createElement('a')
            link.href = url
            link.download = doc.file_name
            link.style.display = 'none'
            window.document.body.appendChild(link)
            link.click()
            window.document.body.removeChild(link)
            URL.revokeObjectURL(url)
            
            continue // Success, move to next document

          } catch (blobError) {
            console.log('Blob download failed, trying signed URL:', blobError)
          }
          
          // Method 2: Fallback to signed URL with fetch
          try {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('documents')
              .createSignedUrl(doc.storage_path, 60)

            if (!signedUrlError && signedUrlData) {
              // Fetch the file and create blob for direct download
              const response = await fetch(signedUrlData.signedUrl)
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }
              
              const blob = await response.blob()
              const url = URL.createObjectURL(blob)
              const link = window.document.createElement('a')
              link.href = url
              link.download = doc.file_name
              link.style.display = 'none'
              window.document.body.appendChild(link)
              link.click()
              window.document.body.removeChild(link)
              URL.revokeObjectURL(url)
              
              continue // Success, move to next document
            }
          } catch (fetchError) {
            console.log('Fetch download failed:', fetchError)
          }

          console.error(`Failed to download ${doc.file_name}`)
        }
      }
    } catch (error) {
      console.error('Bulk download error:', error)
      alert('Some downloads failed')
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true)
    try {
      for (const doc of filteredDocuments) {
        // Method 1: Direct blob download (most reliable for direct download)
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .download(doc.storage_path)

          if (error) {
            throw error
          }

          // Create download link from blob - this forces direct download
          const url = URL.createObjectURL(data)
          const link = window.document.createElement('a')
          link.href = url
          link.download = doc.file_name
          link.style.display = 'none'
          window.document.body.appendChild(link)
          link.click()
          window.document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          continue // Success, move to next document

        } catch (blobError) {
          console.log('Blob download failed, trying signed URL:', blobError)
        }
        
        // Method 2: Fallback to signed URL with fetch
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.storage_path, 60)

          if (!signedUrlError && signedUrlData) {
            // Fetch the file and create blob for direct download
            const response = await fetch(signedUrlData.signedUrl)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = window.document.createElement('a')
            link.href = url
            link.download = doc.file_name
            link.style.display = 'none'
            window.document.body.appendChild(link)
            link.click()
            window.document.body.removeChild(link)
            URL.revokeObjectURL(url)
            
            continue // Success, move to next document
          }
        } catch (fetchError) {
          console.log('Fetch download failed:', fetchError)
        }

        console.error(`Failed to download ${doc.file_name}`)
      }
    } catch (error) {
      console.error('Download all error:', error)
      alert('Some downloads failed')
    } finally {
      setIsDownloadingAll(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Village</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-800">
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Vault</h1>
          <p className="mt-2 text-gray-600">
            Store and manage your important documents
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

              {/* Upload Section */}
              <div className="mb-8">
                <DocumentUpload 
                  categories={CATEGORIES}
                  onUploaded={handleDocumentUploaded}
                />
              </div>

              {/* Search and Filter Section */}
              <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                      Search Documents
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by filename..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="sm:w-64">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Category
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {filteredDocuments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3 items-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="selectAll"
                        checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                        Select All ({filteredDocuments.length})
                      </label>
                    </div>

                    {selectedDocuments.size > 0 && (
                      <button
                        onClick={handleDownloadSelected}
                        disabled={isDownloadingAll}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                      >
                        {isDownloadingAll ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading...
                          </>
                        ) : (
                          `Download Selected (${selectedDocuments.size})`
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleDownloadAll}
                      disabled={isDownloadingAll}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      {isDownloadingAll ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Downloading...
                        </>
                      ) : (
                        `Download All (${filteredDocuments.length})`
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Documents List */}
              <DocumentList
                documents={filteredDocuments}
                categories={CATEGORIES}
                onDocumentDeleted={handleDocumentDeleted}
                selectedDocuments={selectedDocuments}
                onSelectDocument={handleSelectDocument}
              />
      </div>
    </div>
  )
}
