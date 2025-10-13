'use client'

import { useState } from 'react'

export default function EmailTestButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  const sendTestEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/direct-resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error: ' + (error as Error).message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📧 E-Mail Test</h3>
          <p className="text-sm text-gray-500">
            Teste das E-Mail-Notification-System
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={sendTestEmail}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Sending...' : '📧 Send Test Email'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-2">📧 E-Mail Test Result</h4>
          <pre className="text-xs text-green-700 overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}