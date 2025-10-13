'use client'

import { useState } from 'react'

interface Result {
  success: boolean
  message: string
  data?: any
  error?: string
  details?: string
  note?: string
}

export default function EmailTestButtonSimple() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const testEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email-simple-fix', {
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
        message: 'Fehler beim Testen',
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3">E-Mail-Test (Fix)</h3>
      
      <button
        onClick={testEmail}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Teste E-Mail...' : 'E-Mail senden (Fix)'}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded ${
          result.success 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-semibold">{result.message}</p>
          {result.error && <p className="text-sm mt-1">Fehler: {result.error}</p>}
          {result.details && <p className="text-sm mt-1">Details: {result.details}</p>}
          {result.note && <p className="text-sm mt-1">Hinweis: {result.note}</p>}
          {result.data && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">Technische Details</summary>
              <pre className="text-xs mt-1 overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
