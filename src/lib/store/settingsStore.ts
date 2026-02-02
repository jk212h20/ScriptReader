import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // API Keys
  anthropicApiKey: string | null
  elevenLabsApiKey: string | null
  
  // Voice settings
  defaultVoiceRate: number
  defaultVoicePitch: number
  defaultVoiceVolume: number
  useElevenLabs: boolean  // Toggle between Web Speech and ElevenLabs (server has default key)
  
  // Performance settings
  silenceThreshold: number  // seconds to wait before advancing
  autoAdvance: boolean
  
  // Actions
  setAnthropicApiKey: (key: string | null) => void
  setElevenLabsApiKey: (key: string | null) => void
  setUseElevenLabs: (use: boolean) => void
  updateVoiceSettings: (settings: Partial<{
    defaultVoiceRate: number
    defaultVoicePitch: number
    defaultVoiceVolume: number
  }>) => void
  updatePerformanceSettings: (settings: Partial<{
    silenceThreshold: number
    autoAdvance: boolean
  }>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      anthropicApiKey: null,
      elevenLabsApiKey: null,
      defaultVoiceRate: 1,
      defaultVoicePitch: 1,
      defaultVoiceVolume: 1,
      useElevenLabs: false,
      silenceThreshold: 1.5,
      autoAdvance: true,

      setAnthropicApiKey: (key) => set({ anthropicApiKey: key }),
      setElevenLabsApiKey: (key) => set({ elevenLabsApiKey: key }),
      setUseElevenLabs: (use) => set({ useElevenLabs: use }),
      
      updateVoiceSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      })),
      
      updatePerformanceSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      })),
    }),
    {
      name: 'scriptreader-settings',
    }
  )
)
