'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useScriptStore } from '@/lib/store/scriptStore'

export default function ScriptLibrary() {
  const router = useRouter()
  const { scripts, isLoading, setCurrentScript, deleteScript, fetchScripts } = useScriptStore()

  // Fetch scripts from server on mount
  useEffect(() => {
    fetchScripts()
  }, [fetchScripts])

  if (isLoading) {
    return (
      <div className="w-full text-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500 mx-auto" />
        <p className="text-gray-500 mt-2">Loading scripts...</p>
      </div>
    )
  }

  if (scripts.length === 0) {
    return null
  }

  const handleSelectScript = (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId)
    if (script) {
      setCurrentScript(script)
      router.push(`/script/${scriptId}`)
    }
  }

  const handleDeleteScript = async (e: React.MouseEvent, scriptId: string) => {
    e.stopPropagation()
    if (confirm('Delete this script?')) {
      await deleteScript(scriptId)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-lg font-semibold text-gray-300">Available Scripts</h2>
      <div className="space-y-2">
        {scripts.map((script) => (
          <div
            key={script.id}
            onClick={() => handleSelectScript(script.id)}
            className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{script.title}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span>{script.characters.length} characters</span>
                <span>•</span>
                <span>{script.lines.length} lines</span>
                <span>•</span>
                <span>{formatDate(script.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteScript(e, script.id)}
              className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete script"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
