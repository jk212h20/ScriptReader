'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useScriptStore } from '@/lib/store/scriptStore'
import { useSettingsStore } from '@/lib/store/settingsStore'
import type { Script } from '@/types'

export default function NewScriptPage() {
  const router = useRouter()
  const { setCurrentScript, saveScript } = useScriptStore()
  const { anthropicApiKey } = useSettingsStore()
  
  const [status, setStatus] = useState<'loading' | 'parsing' | 'error' | 'needsKey'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [serverHasKey, setServerHasKey] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if server has a default API key
    fetch('/api/has-api-key')
      .then(res => res.json())
      .then(data => setServerHasKey(data.hasKey))
      .catch(() => setServerHasKey(false))
  }, [])

  useEffect(() => {
    // Wait for server key check
    if (serverHasKey === null) return

    // Get pending script from localStorage
    const pending = localStorage.getItem('pendingScript')
    if (!pending) {
      router.push('/')
      return
    }

    const { rawText: text, fileName: name } = JSON.parse(pending)
    setRawText(text)
    setFileName(name)

    // Check for API key (user's key or server default)
    if (!anthropicApiKey && !serverHasKey) {
      setStatus('needsKey')
      return
    }

    // Parse the script (pass user's key if they have one, otherwise server will use default)
    parseScript(text, anthropicApiKey || undefined)
  }, [anthropicApiKey, serverHasKey, router])

  const parseScript = async (text: string, apiKey?: string) => {
    setStatus('parsing')
    setError(null)

    try {
      const response = await fetch('/api/parse-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text, apiKey }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to parse script')
        setStatus('error')
        return
      }

      // Save and set the script
      const script: Script = data.script
      setCurrentScript(script)
      saveScript(script)

      // Clear pending and navigate to script view
      localStorage.removeItem('pendingScript')
      router.push(`/script/${script.id}`)

    } catch (err) {
      console.error('Parse error:', err)
      setError('Failed to connect to parsing service')
      setStatus('error')
    }
  }

  const handleRetry = () => {
    if (anthropicApiKey) {
      parseScript(rawText, anthropicApiKey)
    }
  }

  const handleGoToSettings = () => {
    router.push('/settings')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
            <p className="text-gray-400">Loading...</p>
          </>
        )}

        {status === 'parsing' && (
          <>
            <div className="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
            <div>
              <p className="text-lg font-medium">Parsing Script</p>
              <p className="text-gray-400 text-sm mt-1">{fileName}</p>
              <p className="text-gray-500 text-xs mt-4">
                AI is analyzing characters and dialogue...
              </p>
            </div>
          </>
        )}

        {status === 'needsKey' && (
          <>
            <div className="text-5xl">🔑</div>
            <div>
              <p className="text-lg font-medium">API Key Required</p>
              <p className="text-gray-400 text-sm mt-2">
                You need to add your Anthropic API key to parse scripts.
              </p>
            </div>
            <button
              onClick={handleGoToSettings}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Go to Settings
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl">❌</div>
            <div>
              <p className="text-lg font-medium text-red-400">Parsing Failed</p>
              <p className="text-gray-400 text-sm mt-2">{error}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
