import { create } from 'zustand'
import type { Script, ScriptLine } from '@/types'

interface ScriptState {
  // Current script being worked on
  currentScript: Script | null
  
  // All saved scripts (fetched from server)
  scripts: Script[]
  
  // Loading state
  isLoading: boolean
  
  // Actions
  setCurrentScript: (script: Script | null) => void
  updateScript: (updates: Partial<Script>) => void
  saveScript: (script: Script) => Promise<void>
  deleteScript: (id: string) => Promise<void>
  fetchScripts: () => Promise<void>
  fetchScript: (id: string) => Promise<Script | null>
  
  // Character assignment
  assignCharacter: (characterName: string, assignedTo: 'human' | 'ai') => void
  updateCharacterVoice: (characterName: string, voiceId: string) => void
  
  // Line management
  updateLine: (lineId: string, updates: Partial<ScriptLine>) => void
}

export const useScriptStore = create<ScriptState>()((set, get) => ({
  currentScript: null,
  scripts: [],
  isLoading: false,

  setCurrentScript: (script) => set({ currentScript: script }),

  updateScript: (updates) => set((state) => ({
    currentScript: state.currentScript 
      ? { ...state.currentScript, ...updates, updatedAt: new Date() }
      : null
  })),

  // Fetch all scripts from server
  fetchScripts: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/scripts')
      const data = await response.json()
      if (data.success) {
        set({ scripts: data.scripts || [] })
      }
    } catch (error) {
      console.error('Failed to fetch scripts:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Fetch a single script from server
  fetchScript: async (id: string) => {
    try {
      const response = await fetch(`/api/scripts/${id}`)
      const data = await response.json()
      if (data.success && data.script) {
        return data.script as Script
      }
      return null
    } catch (error) {
      console.error('Failed to fetch script:', error)
      return null
    }
  },

  // Save script to server
  saveScript: async (script) => {
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(script)
      })
      const data = await response.json()
      
      if (data.success) {
        // Update local state
        set((state) => {
          const existingIndex = state.scripts.findIndex(s => s.id === script.id)
          const updatedScripts = existingIndex >= 0
            ? state.scripts.map((s, i) => i === existingIndex ? data.script : s)
            : [...state.scripts, data.script]
          return { scripts: updatedScripts }
        })
      }
    } catch (error) {
      console.error('Failed to save script:', error)
      throw error
    }
  },

  // Delete script from server
  deleteScript: async (id) => {
    try {
      const response = await fetch(`/api/scripts/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        set((state) => ({
          scripts: state.scripts.filter(s => s.id !== id),
          currentScript: state.currentScript?.id === id ? null : state.currentScript
        }))
      }
    } catch (error) {
      console.error('Failed to delete script:', error)
      throw error
    }
  },

  assignCharacter: (characterName, assignedTo) => set((state) => {
    if (!state.currentScript) return state
    
    const updatedCharacters = state.currentScript.characters.map(char =>
      char.name === characterName ? { ...char, assignedTo } : char
    )
    
    const updatedLines = state.currentScript.lines.map(line =>
      line.character === characterName ? { ...line, assignedTo } : line
    )
    
    return {
      currentScript: {
        ...state.currentScript,
        characters: updatedCharacters,
        lines: updatedLines,
        updatedAt: new Date()
      }
    }
  }),

  updateCharacterVoice: (characterName, voiceId) => set((state) => {
    if (!state.currentScript) return state
    
    const updatedCharacters = state.currentScript.characters.map(char =>
      char.name === characterName ? { ...char, voiceId } : char
    )
    
    return {
      currentScript: {
        ...state.currentScript,
        characters: updatedCharacters,
        updatedAt: new Date()
      }
    }
  }),

  updateLine: (lineId, updates) => set((state) => {
    if (!state.currentScript) return state
    
    const updatedLines = state.currentScript.lines.map(line =>
      line.id === lineId ? { ...line, ...updates } : line
    )
    
    return {
      currentScript: {
        ...state.currentScript,
        lines: updatedLines,
        updatedAt: new Date()
      }
    }
  }),
}))
