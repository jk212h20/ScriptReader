'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSettingsStore } from '@/lib/store/settingsStore'

export default function SettingsPage() {
  const router = useRouter()
  const { 
    anthropicApiKey, 
    setAnthropicApiKey,
    elevenLabsApiKey,
    setElevenLabsApiKey,
    silenceThreshold,
    autoAdvance,
    updatePerformanceSettings
  } = useSettingsStore()

  const [apiKey, setApiKey] = useState('')
  const [elevenKey, setElevenKey] = useState('')
  const [threshold, setThreshold] = useState(1.5)
  const [autoAdv, setAutoAdv] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKey(anthropicApiKey || '')
    setElevenKey(elevenLabsApiKey || '')
    setThreshold(silenceThreshold)
    setAutoAdv(autoAdvance)
  }, [anthropicApiKey, elevenLabsApiKey, silenceThreshold, autoAdvance])

  const handleSave = () => {
    setAnthropicApiKey(apiKey || null)
    setElevenLabsApiKey(elevenKey || null)
    updatePerformanceSettings({
      silenceThreshold: threshold,
      autoAdvance: autoAdv
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* API Keys Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-gray-800 pb-2">
              API Keys
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Anthropic API Key
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for script parsing. Get your key at{' '}
                  <a 
                    href="https://console.anthropic.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ElevenLabs API Key
                  <span className="text-gray-500 ml-1">(optional)</span>
                </label>
                <input
                  type="password"
                  value={elevenKey}
                  onChange={(e) => setElevenKey(e.target.value)}
                  placeholder="..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For premium AI voices. Free tier uses browser voices.
                </p>
              </div>
            </div>
          </section>

          {/* Performance Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-gray-800 pb-2">
              Performance Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Silence Threshold: {threshold}s
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long to wait after you stop speaking before advancing
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-Advance</label>
                  <p className="text-xs text-gray-500">
                    Automatically move to next line when you finish speaking
                  </p>
                </div>
                <button
                  onClick={() => setAutoAdv(!autoAdv)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoAdv ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoAdv ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                saved 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>

          {/* Security Note */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-200">
              <strong>Note:</strong> API keys are stored locally in your browser. 
              They are never sent to our servers.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
