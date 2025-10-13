'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { intelligentDocumentAnalyzer } from '@/lib/document-analyzer/intelligent-analyzer'

interface Category {
  id: string
  name: string
  icon: string
}

interface DocumentUploadProps {
  categories: Category[]
  onUploaded: () => void
}

export function DocumentUpload({ categories, onUploaded }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
      setError(null)
      setSuccess(null)
      
      // Auto-upload files immediately after selection
      if (files.length > 0) {
        uploadFiles(files)
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(prev => [...prev, ...files])
      setError(null)
      setSuccess(null)
      
      // Auto-upload files immediately after drop
      if (files.length > 0) {
        uploadFiles(files)
      }
    }
  }

  const uploadFiles = async (filesToUpload?: File[]) => {
    const files = filesToUpload || selectedFiles
    console.log('Upload started!')
    console.log('Files to upload:', files.length)
    
    if (files.length === 0) {
      setError('Please select files to upload.')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }
      console.log('User authenticated:', user.id)

      for (const file of files) {
        console.log('Uploading file:', file.name)
        
        // Generate unique filename with user folder structure
        const fileExtension = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
        const storagePath = `${user.id}/${fileName}`
        console.log('Storage path:', storagePath)

        // Upload to Supabase Storage
        console.log('Uploading to storage...')
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }
        console.log('Storage upload successful:', uploadData)

              // Process document with intelligent analysis
              console.log('Processing document with intelligent analysis...')
              let category = 'unknown'
              let confidence = 0
              let suggestedTags = ['unknown']
              let reasoning = ['Analysis failed']
              
              try {
                // Use intelligent document analyzer
                const analysisResult = await intelligentDocumentAnalyzer.analyzeDocument(file.name)
                console.log('Analysis Result:', analysisResult)
                
                category = analysisResult.documentType
                confidence = analysisResult.confidence
                suggestedTags = analysisResult.tags
                reasoning = [analysisResult.reasoning]
                
                console.log(`Document classified as: ${category} (${(confidence * 100).toFixed(1)}% confidence)`)
                console.log('Method:', analysisResult.analysisMethod)
                console.log('Tags:', suggestedTags)
                
              } catch (error) {
                console.error('Intelligent analysis failed:', error)
                // Continue with upload even if analysis fails
              }

        // Save document record to database with AI results
        console.log('Saving to database...')
        
              // Use only the fields that exist in the current documents table
              const documentData: any = {
                user_id: user.id,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                storage_path: storagePath,
                category: category
                // Note: AI analysis data is logged to console but not stored in DB
                // The existing table doesn't have ai_analysis field
              }
              
              console.log('Document data to save:', documentData)
        
        const { error: dbError } = await supabase
          .from('documents')
          .insert(documentData)

        if (dbError) {
          console.error('Database insert error:', dbError)
          // Clean up uploaded file
          await supabase.storage.from('documents').remove([storagePath])
          throw new Error(`Failed to save ${file.name}: ${dbError.message}`)
        }
        console.log('Database insert successful')
      }

            setSuccess(`Successfully uploaded ${files.length} file(s)! Documents have been intelligently analyzed and categorized.`)
      setSelectedFiles([])
      onUploaded()

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'An error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>


      {/* File Input */}
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-orange-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4V8m-12 8h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC, DOCX up to 10MB</p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
          <ul className="divide-y divide-gray-200">
            {selectedFiles.map((file, index) => (
              <li key={index} className="py-2 flex items-center justify-between">
                <span className="text-sm text-gray-900">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94l-1.72-1.72z" clipRule="evenodd" />
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

      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button - Only show when files are selected and not uploading */}
      {selectedFiles.length > 0 && !isUploading && (
        <div className="mt-6">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              console.log('Button clicked, calling uploadFiles...')
              uploadFiles()
            }}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Upload {selectedFiles.length} file(s)
          </button>
        </div>
      )}
      
      {/* Upload Status */}
      {isUploading && (
        <div className="mt-6">
          <div className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-orange-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading and analyzing documents...
          </div>
        </div>
      )}
    </div>
  )
}
