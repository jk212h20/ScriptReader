'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useScriptStore } from '@/lib/store/scriptStore'
import ScriptDisplay from '@/components/script/ScriptDisplay'
import RoleAssignment from '@/components/script/RoleAssignment'

export default function ScriptPage() {
  const router = useRouter()
  const params = useParams()
  const { currentScript, scripts, setCurrentScript } = useScriptStore()
  const [activeTab, setActiveTab] = useState<'script' | 'roles'>('script')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const scriptId = params.id as string
    
    // If we don't have a current script or it's different, load from saved scripts
    if (!currentScript || currentScript.id !== scriptId) {
      const found = scripts.find(s => s.id === scriptId)
      if (found) {
        setCurrentScript(found)
      } else {
        // Script not found, redirect home
        router.push('/')
      }
    }
  }, [params.id, currentScript, scripts, setCurrentScript, router])

  if (!currentScript) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </main>
    )
  }

  const handleStartPerformance = () => {
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
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditing 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isEditing ? 'Done Editing' : 'Edit'}
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
