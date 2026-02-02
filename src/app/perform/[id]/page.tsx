'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useScriptStore } from '@/lib/store/scriptStore'
import { useSettingsStore } from '@/lib/store/settingsStore'
import { ttsService } from '@/lib/speech/tts'
import type { ScriptLine, Character } from '@/types'

export default function PerformPage() {
  const router = useRouter()
  const params = useParams()
  const { currentScript, scripts, setCurrentScript } = useScriptStore()
  const { useElevenLabs, elevenLabsApiKey } = useSettingsStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [waitingForHuman, setWaitingForHuman] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const scriptId = params.id as string
    
    if (!currentScript || currentScript.id !== scriptId) {
      const found = scripts.find(s => s.id === scriptId)
      if (found) {
        setCurrentScript(found)
      } else {
        router.push('/')
      }
    }
  }, [params.id, currentScript, scripts, setCurrentScript, router])

  // Scroll current line into view
  useEffect(() => {
    const lineEl = lineRefs.current[currentLineIndex]
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLineIndex])

  // Get character's voice description
  const getCharacterVoice = useCallback((characterName: string | null): Character | undefined => {
    if (!currentScript || !characterName) return undefined
    return currentScript.characters.find(c => c.name === characterName)
  }, [currentScript])

  // Speak using ElevenLabs
  const speakWithElevenLabs = useCallback(async (text: string, voiceDescription?: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceDescription,
            apiKey: elevenLabsApiKey
          })
        })

        if (!response.ok) {
          throw new Error('ElevenLabs TTS failed')
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.pause()
        }
        
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          reject(new Error('Audio playback failed'))
        }
        
        await audio.play()
      } catch (error) {
        reject(error)
      }
    })
  }, [elevenLabsApiKey])

  // Speak using Web Speech API
  const speakWithWebSpeech = useCallback(async (text: string): Promise<void> => {
    if (!ttsService) throw new Error('TTS not available')
    await ttsService.speak(text)
  }, [])

  const speakLine = useCallback(async (line: ScriptLine) => {
    if (line.type !== 'dialogue') return
    
    setIsSpeaking(true)
    
    try {
      if (useElevenLabs && elevenLabsApiKey) {
        const character = getCharacterVoice(line.character)
        await speakWithElevenLabs(line.text, character?.suggestedVoiceType)
      } else {
        await speakWithWebSpeech(line.text)
      }
    } catch (error) {
      console.error('TTS error:', error)
      // Fallback to Web Speech if ElevenLabs fails
      if (useElevenLabs) {
        try {
          await speakWithWebSpeech(line.text)
        } catch {
          console.error('Fallback TTS also failed')
        }
      }
    } finally {
      setIsSpeaking(false)
    }
  }, [useElevenLabs, elevenLabsApiKey, getCharacterVoice, speakWithElevenLabs, speakWithWebSpeech])

  const advanceToNextLine = useCallback(() => {
    if (!currentScript) return
    
    const nextIndex = currentLineIndex + 1
    if (nextIndex >= currentScript.lines.length) {
      // End of script
      setIsPlaying(false)
      setCurrentLineIndex(0)
      return
    }
    
    setCurrentLineIndex(nextIndex)
  }, [currentScript, currentLineIndex])

  const playCurrentLine = useCallback(async () => {
    if (!currentScript || !isPlaying) return
    
    const line = currentScript.lines[currentLineIndex]
    if (!line) return

    // Skip directions
    if (line.type === 'direction' || line.type === 'action') {
      advanceToNextLine()
      return
    }

    // Check if this is a human line
    if (line.assignedTo === 'human') {
      setWaitingForHuman(true)
      return
    }

    // AI line - speak it
    setWaitingForHuman(false)
    await speakLine(line)
    advanceToNextLine()
  }, [currentScript, currentLineIndex, isPlaying, speakLine, advanceToNextLine])

  // Auto-play when line changes
  useEffect(() => {
    if (isPlaying && !isSpeaking) {
      playCurrentLine()
    }
  }, [currentLineIndex, isPlaying, isSpeaking, playCurrentLine])

  const handlePlay = () => {
    setIsPlaying(true)
    setWaitingForHuman(false)
    playCurrentLine()
  }

  const handlePause = () => {
    setIsPlaying(false)
    ttsService?.stop()
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentLineIndex(0)
    setWaitingForHuman(false)
    setIsSpeaking(false)
    ttsService?.stop()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const handleHumanDone = () => {
    setWaitingForHuman(false)
    advanceToNextLine()
  }

  const handleLineClick = (index: number) => {
    setCurrentLineIndex(index)
    if (!isPlaying) {
      setIsPlaying(true)
    }
  }

  if (!currentScript) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </main>
    )
  }

  const currentLine = currentScript.lines[currentLineIndex]
  const humanCharacters = currentScript.characters.filter(c => c.assignedTo === 'human').map(c => c.name)

  return (
    <main className="min-h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{currentScript.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Line {currentLineIndex + 1} of {currentScript.lines.length}</span>
              {useElevenLabs && elevenLabsApiKey && (
                <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs">
                  ElevenLabs
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/script/${currentScript.id}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Script Display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {currentScript.lines.map((line, index) => {
            const isCurrentLine = index === currentLineIndex
            const isPastLine = index < currentLineIndex
            const isHumanLine = line.assignedTo === 'human'
            
            return (
              <div
                key={line.id}
                ref={el => { lineRefs.current[index] = el }}
                onClick={() => handleLineClick(index)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  isCurrentLine
                    ? isHumanLine
                      ? 'bg-green-900/50 border-2 border-green-500 scale-105'
                      : 'bg-blue-900/50 border-2 border-blue-500 scale-105'
                    : isPastLine
                      ? 'opacity-40'
                      : 'bg-gray-900/30 hover:bg-gray-800/50'
                }`}
              >
                {line.type === 'dialogue' ? (
                  <>
                    <div className={`text-sm font-bold mb-1 ${
                      isHumanLine ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {line.character}
                      {isHumanLine && ' (YOU)'}
                    </div>
                    <div className={`text-lg ${isCurrentLine ? 'text-white' : 'text-gray-300'}`}>
                      {line.text}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 italic text-sm">
                    [{line.text}]
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-gray-800 p-4 bg-gray-900/80">
        <div className="max-w-3xl mx-auto">
          {waitingForHuman ? (
            <div className="text-center space-y-4">
              <p className="text-green-400 text-lg font-medium">
                Your turn! Read your line as {currentLine?.character}
              </p>
              <button
                onClick={handleHumanDone}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-bold transition-colors"
              >
                Done Reading ✓
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              {!isPlaying ? (
                <button
                  onClick={handlePlay}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-bold transition-colors"
                >
                  ▶ Play
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-8 py-4 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-lg font-bold transition-colors"
                >
                  {isSpeaking ? '🔊 Speaking...' : '⏸ Pause'}
                </button>
              )}
              <button
                onClick={handleStop}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-medium transition-colors"
              >
                ⏹ Stop
              </button>
            </div>
          )}
          
          {humanCharacters.length > 0 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              You are reading: {humanCharacters.join(', ')}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
