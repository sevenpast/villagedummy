'use client'

import { useState } from 'react'

export default function SimplePrivacyDashboard() {
  const [activeTab, setActiveTab] = useState('export')
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const requestDataExport = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/gdpr/export-readable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        if (data.instant_download && data.download_data) {
          // Create and download the file immediately
          const fileType = data.file_format === 'txt' ? 'text/plain' : 'application/json'
          const fileName = data.file_format === 'txt' 
            ? `My-Data-ExpatVillage-${new Date().toISOString().split('T')[0]}.txt`
            : `village-data-export-${new Date().toISOString().split('T')[0]}.json`
          
          const blob = new Blob([data.download_data], { type: fileType })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          setMessage({ type: 'success', text: 'Your data has been successfully downloaded!' })
        } else {
          setMessage({ type: 'success', text: 'Data export request created successfully' })
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create export request' })
      }
    } catch (error) {
      console.error('Error requesting export:', error)
      setMessage({ type: 'error', text: 'Failed to create export request' })
    } finally {
      setIsUpdating(false)
    }
  }

  const requestAccountDeletion = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'User requested account deletion',
          confirmation: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Account deletion request submitted successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit deletion request' })
      }
    } catch (error) {
      console.error('Error requesting deletion:', error)
      setMessage({ type: 'error', text: 'Failed to submit deletion request' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300">
            <h1 className="text-xl font-medium text-gray-900">Privacy & Data Control</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your personal data according to GDPR regulations.
            </p>
          </div>

          <div className="p-6">
            {/* Simple navigation */}
            <div className="border-b border-gray-300 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('export')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'export'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Data Export
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'delete'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Delete Account
                </button>
              </nav>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 border ${
                message.type === 'success' 
                  ? 'border-gray-300 bg-gray-50 text-gray-800' 
                  : 'border-gray-300 bg-gray-50 text-gray-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Data Export Tab */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Download Your Data</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    You can download all your personal data in a readable text format. This includes your profile information, task progress, and privacy settings.
                  </p>
                </div>

                <button
                  onClick={requestDataExport}
                  disabled={isUpdating}
                  className="w-full bg-gray-900 text-white py-3 px-6 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-900"
                >
                  {isUpdating ? 'Preparing your data...' : 'Download My Data'}
                </button>

                <div className="text-sm text-gray-500">
                  <p>• Instant processing - Your data is ready immediately</p>
                  <p>• Readable format - As text file, not JSON</p>
                  <p>• Download links expire after 30 days</p>
                  <p>• Up to 3 exports per month allowed</p>
                </div>
              </div>
            )}

            {/* Delete Account Tab */}
            {activeTab === 'delete' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Delete Your Account</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>

                <div className="border border-gray-300 p-4">
                  <h3 className="font-medium text-gray-900 mb-2">What will be deleted:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Your profile information</li>
                    <li>• Task progress and history</li>
                    <li>• Privacy settings and consents</li>
                    <li>• All uploaded documents</li>
                    <li>• Account access logs</li>
                  </ul>
                </div>

                <button
                  onClick={requestAccountDeletion}
                  disabled={isUpdating}
                  className="w-full bg-gray-900 text-white py-3 px-6 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-900"
                >
                  {isUpdating ? 'Processing request...' : 'Delete My Account'}
                </button>

                <div className="text-sm text-gray-500">
                  <p>• Account deletion is processed within 24 hours</p>
                  <p>• You will receive a confirmation email</p>
                  <p>• This action cannot be undone</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
