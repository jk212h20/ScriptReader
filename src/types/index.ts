// Core data models for ScriptReader

export interface Script {
  id: string
  title: string
  rawText: string
  lines: ScriptLine[]
  characters: Character[]
  createdAt: Date
  updatedAt: Date
}

export interface ScriptLine {
  id: string
  index: number
  character: string | null  // null for stage directions
  type: 'dialogue' | 'direction' | 'action'
  text: string
  assignedTo: 'human' | 'ai' | 'skip'
}

export interface Character {
  name: string
  assignedTo: 'human' | 'ai'
  voiceId?: string           // ElevenLabs voice ID or Web Speech voice
  voiceSettings?: VoiceSettings
  suggestedVoiceType?: string // AI suggestion: "deep male", "young female", etc.
}

export interface VoiceSettings {
  pitch: number    // 0-2, default 1
  rate: number     // 0.1-10, default 1
  volume: number   // 0-1, default 1
}

export interface PerformanceState {
  scriptId: string
  currentLineIndex: number
  status: 'idle' | 'listening' | 'speaking' | 'paused'
  recognizedText: string
  matchConfidence: number    // 0-1, how much of current line matched
  error?: string
}

// API response types
export interface ParseScriptResponse {
  success: boolean
  script?: Script
  error?: string
}

export interface ParseScriptRequest {
  rawText: string
  fileName?: string
}

// File upload types
export type AcceptedFileType = 'text/plain' | 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp'

export interface UploadedFile {
  name: string
  type: AcceptedFileType
  content: string | ArrayBuffer
}
