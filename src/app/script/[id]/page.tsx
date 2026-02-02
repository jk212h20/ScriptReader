'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useScriptStore } from '@/lib/store/scriptStore'
import ScriptDisplay from '@/components/script/ScriptDisplay'
import RoleAssignment from '@/components/script/RoleAssignment'

export default function ScriptPage() {
  const router = useRouter()
  const params = useParams()
  const { currentScript, scripts, setCurrentScript, fetchScript, saveScript } = useScriptStore()
  const [activeTab, setActiveTab] = useState<'script' | 'roles'>('script')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load script from server or local state
  useEffect(() => {
    const loadScript = async () => {
      const scriptId = params.id as string
      setIsLoading(true)
      
      // First check if we have it in local state
      if (currentScript && currentScript.id === scriptId) {
        setIsLoading(false)
        return
      }
      
      // Check local scripts array
      const localScript = scripts.find(s => s.id === scriptId)
      if (localScript) {
        setCurrentScript(localScript)
        setIsLoading(false)
        return
      }
      
      // Fetch from server
      const serverScript = await fetchScript(scriptId)
      if (serverScript) {
        setCurrentScript(serverScript)
      } else {
        // Script not found, redirect home
        router.push('/')
      }
      setIsLoading(false)
    }
    
    loadScript()
  }, [params.id, currentScript, scripts, setCurrentScript, fetchScript, router])

  // Save script to server when done editing
  const handleSaveScript = useCallback(async () => {
    if (!currentScript) return
    
    setIsSaving(true)
    try {
      await saveScript(currentScript)
    } catch (error) {
      console.error('Failed to save script:', error)
    } finally {
      setIsSaving(false)
    }
  }, [currentScript, saveScript])

  // Auto-save when exiting edit mode
  const handleToggleEdit = async () => {
    if (isEditing && currentScript) {
      // Save when done editing
      await handleSaveScript()
    }
    setIsEditing(!isEditing)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </main>
    )
  }

  if (!currentScript) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Script not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </main>
    )
  }

  const handleStartPerformance = async () => {
    // Save before starting performance
    await handleSaveScript()
    router.push(`/perform/${currentScript.id}`)
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{currentScript.title}</h1>
            <p className="text-sm text-gray-500">
              {currentScript.characters.length} characters • {currentScript.lines.filter(l => l.type === 'dialogue').length} lines
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleEdit}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditing 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Done Editing' : 'Edit'}
            </button>
            <button
              onClick={handleStartPerformance}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Start Performance
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'script'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Script
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Assign Roles
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4">
          {activeTab === 'script' && (
            <ScriptDisplay script={currentScript} isEditing={isEditing} />
          )}
          {activeTab === 'roles' && (
            <RoleAssignment script={currentScript} />
          )}
        </div>
      </div>
    </main>
  )
}
