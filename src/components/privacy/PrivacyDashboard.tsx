'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PrivacySettings {
  data_processing_consent: boolean
  email_marketing_consent: boolean
  analytics_consent: boolean
  document_processing_consent: boolean
  ai_processing_consent: boolean
  data_sharing_consent: boolean
  automated_decision_making_consent: boolean
  profiling_consent: boolean
  third_party_data_sharing: boolean
  data_retention_consent: boolean
}

interface DataSummary {
  total_documents: number
  total_tasks: number
  total_consents: number
  recent_access_logs: number
  data_categories: string[]
  estimated_storage_mb: number
}

interface GDPRSummary {
  user_info: {
    name: string
    email: string
    account_created: string
  }
  data_summary: DataSummary
  privacy_settings: PrivacySettings
  active_requests: {
    export_requests: any[]
    deletion_requests: any[]
  }
  gdpr_rights: Record<string, any>
}

export default function PrivacyDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [summary, setSummary] = useState<GDPRSummary | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/gdpr/summary')
      const data = await response.json()

      if (data.success) {
        setSummary(data.summary)
        setPrivacySettings(data.summary.privacy_settings)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load privacy summary' })
      }
    } catch (error) {
      console.error('Error loading summary:', error)
      setMessage({ type: 'error', text: 'Failed to load privacy summary' })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/gdpr/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        setPrivacySettings(data.privacy_settings)
        setMessage({ type: 'success', text: 'Privacy settings updated successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update privacy settings' })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setMessage({ type: 'error', text: 'Failed to update privacy settings' })
    } finally {
      setIsUpdating(false)
    }
  }

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
          const fileExtension = data.file_format === 'txt' ? 'txt' : 'json'
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
        loadSummary() // Refresh to show new request
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
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      setIsUpdating(true)
      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletion_reason: 'User requested account deletion',
          deletion_type: 'full_deletion'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Account deletion request created. Please check your email for verification.' })
        loadSummary() // Refresh to show new request
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create deletion request' })
      }
    } catch (error) {
      console.error('Error requesting deletion:', error)
      setMessage({ type: 'error', text: 'Failed to create deletion request' })
    } finally {
      setIsUpdating(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'settings', label: 'Privacy Settings', icon: '⚙️' },
    { id: 'consents', label: 'Consents', icon: '✅' },
    { id: 'export', label: 'Data Export', icon: '📤' },
    { id: 'delete', label: 'Delete Account', icon: '🗑️' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Privacy Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your personal data and privacy settings</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && summary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Data Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Documents:</span>
                        <span className="font-medium text-blue-900">{summary.data_summary.total_documents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Tasks:</span>
                        <span className="font-medium text-blue-900">{summary.data_summary.total_tasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Storage Used:</span>
                        <span className="font-medium text-blue-900">{summary.data_summary.estimated_storage_mb} MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Your Rights</h3>
                    <div className="space-y-2">
                      <div className="text-green-700">✅ Right to Access</div>
                      <div className="text-green-700">✅ Right to Rectification</div>
                      <div className="text-green-700">✅ Right to Erasure</div>
                      <div className="text-green-700">✅ Right to Portability</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.data_summary.data_categories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border"
                      >
                        {category.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {summary.active_requests.export_requests.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Active Export Requests</h3>
                    {summary.active_requests.export_requests.map((request: any) => (
                      <div key={request.id} className="text-yellow-800">
                        Status: {request.status} - Created: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                )}

                {summary.active_requests.deletion_requests.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Active Deletion Requests</h3>
                    {summary.active_requests.deletion_requests.map((request: any) => (
                      <div key={request.id} className="text-red-800">
                        Status: {request.status} - Type: {request.deletion_type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && privacySettings && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                <p className="text-gray-600">Control how your data is processed and used.</p>

                <div className="space-y-4">
                  {Object.entries(privacySettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getSettingDescription(key)}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updatePrivacySettings({ [key]: e.target.checked })}
                          disabled={isUpdating}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Export</h3>
                  <p className="text-gray-600 mb-4">
                    Request a copy of all your personal data in a structured format. 
                    This includes your profile, documents, tasks, and all other data we have about you.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">What's included in your export:</h4>
                  <ul className="text-blue-800 space-y-1">
                    <li>• Your profile information</li>
                    <li>• All uploaded documents (metadata)</li>
                    <li>• Task progress and completion history</li>
                    <li>• Privacy settings and consent history</li>
                    <li>• Access logs and activity history</li>
                  </ul>
                </div>

                <button
                  onClick={requestDataExport}
                  disabled={isUpdating}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Preparing your data...' : 'Download My Data'}
                </button>

                <div className="text-sm text-gray-500">
                  <p>• <strong>Instant processing</strong> - Your data is ready immediately</p>
                  <p>• <strong>Readable format</strong> - As text file, not JSON</p>
                  <p>• Download links expire after 30 days</p>
                  <p>• Up to 3 exports per month allowed</p>
                </div>
              </div>
            )}

            {activeTab === 'delete' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ Warning: This will permanently delete:</h4>
                  <ul className="text-red-800 space-y-1">
                    <li>• Your profile and personal information</li>
                    <li>• All uploaded documents and files</li>
                    <li>• Task progress and history</li>
                    <li>• All privacy settings and consents</li>
                    <li>• Your account and login credentials</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 mb-2">Legal Retention</h4>
                  <p className="text-yellow-800">
                    Some data may be retained for legal compliance purposes (e.g., financial records for 7 years).
                    This data will be anonymized and cannot be linked back to you.
                  </p>
                </div>

                <button
                  onClick={requestAccountDeletion}
                  disabled={isUpdating}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Creating Deletion Request...' : 'Delete My Account'}
                </button>

                <div className="text-sm text-gray-500">
                  <p>• You will receive an email confirmation before deletion</p>
                  <p>• Deletion is processed within 72 hours</p>
                  <p>• You can cancel the request within 24 hours</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    data_processing_consent: 'Allow processing of your personal data to provide our services',
    email_marketing_consent: 'Receive marketing emails and promotional content',
    analytics_consent: 'Help us improve our service through usage analytics',
    document_processing_consent: 'Process your uploaded documents for classification and form filling',
    ai_processing_consent: 'Use AI services to analyze and process your data',
    data_sharing_consent: 'Share your data with trusted third-party service providers',
    automated_decision_making_consent: 'Use automated systems to make decisions about your account',
    profiling_consent: 'Create profiles to personalize your experience',
    third_party_data_sharing: 'Share anonymized data with research partners',
    data_retention_consent: 'Retain your data according to our retention policy'
  }
  return descriptions[key] || 'Control this data processing activity'
}
