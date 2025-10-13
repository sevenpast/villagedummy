'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  icon: string
}

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

interface DocumentListProps {
  documents: Document[]
  categories: Category[]
  onDocumentDeleted: (documentId: string) => void
  selectedDocuments: Set<string>
  onSelectDocument: (documentId: string) => void
}

export function DocumentList({ documents, categories, onDocumentDeleted, selectedDocuments, onSelectDocument }: DocumentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<string>('')
  
  const supabase = createClient()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { name: 'Unknown', icon: '' }
  }

  const handleEditCategory = (documentId: string, currentCategory: string) => {
    setEditingCategoryId(documentId)
    setNewCategory(currentCategory)
  }

  const handleSaveCategory = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ category: newCategory })
        .eq('id', documentId)

      if (error) {
        console.error('Error updating category:', error)
        alert('Failed to update category')
        return
      }

      setEditingCategoryId(null)
      setNewCategory('')
      
      // Refresh the documents list
      window.location.reload()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    }
  }

  const handleCancelEdit = () => {
    setEditingCategoryId(null)
    setNewCategory('')
  }


  const handleDownload = async (doc: Document) => {
    try {
      setDownloadingId(doc.id)
      console.log('Starting download for:', doc.storage_path)
      
      // Method 1: Direct blob download (most reliable for direct download)
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(doc.storage_path)

        if (error) {
          throw error
        }

        console.log('Downloading blob directly...')
        
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
        
        console.log('Download started successfully!')
        return

      } catch (blobError) {
        console.log('Blob download failed, trying signed URL:', blobError)
      }
      
      // Method 2: Fallback to signed URL with fetch
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storage_path, 60)

        if (!signedUrlError && signedUrlData) {
          console.log('Fetching file from signed URL...')
          
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
          
          console.log('Download started via fetch!')
          return
        }
      } catch (fetchError) {
        console.log('Fetch download failed:', fetchError)
      }

      throw new Error('All download methods failed')

    } catch (error) {
      console.error('Download failed:', error)
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      setDeletingId(documentId)
      
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.storage_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (dbError) {
        throw dbError
      }

      onDocumentDeleted(documentId)

    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading your first document.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Documents ({documents.length})
          {selectedDocuments.size > 0 && (
            <span className="ml-2 text-sm font-normal text-orange-600">
              ({selectedDocuments.size} selected)
            </span>
          )}
        </h2>
      </div>
      <ul role="list" className="divide-y divide-gray-200">
        {documents.map((doc) => {
          const categoryInfo = getCategoryInfo(doc.category)
          return (
            <li key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex-1 flex items-center min-w-0">
                <div className="flex-shrink-0 mr-4">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.has(doc.id)}
                    onChange={() => onSelectDocument(doc.id)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    aria-label={`Select ${doc.file_name}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.file_size)} | {doc.file_type}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    {editingCategoryId === doc.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          aria-label="Select new category"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveCategory(doc.id)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {categoryInfo.name}
                        </span>
                        <button
                          onClick={() => handleEditCategory(doc.id, doc.category)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Change
                        </button>
                      </div>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
                    <div className="ml-4 flex-shrink-0 space-x-2">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingId === doc.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === doc.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

    </div>
  )
}