import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Script, Character, ScriptLine } from '@/types'

interface ScriptState {
  // Current script being worked on
  currentScript: Script | null
  
  // All saved scripts
  scripts: Script[]
  
  // Actions
  setCurrentScript: (script: Script | null) => void
  updateScript: (updates: Partial<Script>) => void
  saveScript: (script: Script) => void
  deleteScript: (id: string) => void
  
  // Character assignment
  assignCharacter: (characterName: string, assignedTo: 'human' | 'ai') => void
  updateCharacterVoice: (characterName: string, voiceId: string) => void
  
  // Line management
  updateLine: (lineId: string, updates: Partial<ScriptLine>) => void
}

export const useScriptStore = create<ScriptState>()(
  persist(
    (set, get) => ({
      currentScript: null,
      scripts: [],

      setCurrentScript: (script) => set({ currentScript: script }),

      updateScript: (updates) => set((state) => ({
        currentScript: state.currentScript 
          ? { ...state.currentScript, ...updates, updatedAt: new Date() }
          : null
      })),

      saveScript: (script) => set((state) => {
        const existingIndex = state.scripts.findIndex(s => s.id === script.id)
        const updatedScripts = existingIndex >= 0
          ? state.scripts.map((s, i) => i === existingIndex ? script : s)
          : [...state.scripts, script]
        return { scripts: updatedScripts }
      }),

      deleteScript: (id) => set((state) => ({
        scripts: state.scripts.filter(s => s.id !== id),
        currentScript: state.currentScript?.id === id ? null : state.currentScript
      })),

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
    }),
    {
      name: 'scriptreader-scripts',
    }
  )
)
