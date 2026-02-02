/**
 * Speech Recognition Service
 * Wrapper around Web Speech API for continuous listening
 */

type RecognitionCallback = (transcript: string, isFinal: boolean) => void
type ErrorCallback = (error: string) => void

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private onTranscript: RecognitionCallback | null = null
  private onError: ErrorCallback | null = null
  private shouldRestart = false

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI()
        this.setupRecognition()
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    // Configure for continuous listening with interim results
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Get the latest result
      const result = event.results[event.results.length - 1]
      if (result) {
        const transcript = result[0].transcript
        const isFinal = result.isFinal
        
        if (this.onTranscript) {
          this.onTranscript(transcript, isFinal)
        }
      }
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      
      // Don't report "no-speech" as an error - it's normal
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        if (this.onError) {
          this.onError(event.error)
        }
      }
      
      // Auto-restart on recoverable errors
      if (this.shouldRestart && event.error !== 'not-allowed') {
        setTimeout(() => this.restartIfNeeded(), 100)
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      // Auto-restart if we should still be listening
      if (this.shouldRestart) {
        setTimeout(() => this.restartIfNeeded(), 100)
      }
    }

    this.recognition.onstart = () => {
      this.isListening = true
    }
  }

  private restartIfNeeded() {
    if (this.shouldRestart && !this.isListening && this.recognition) {
      try {
        this.recognition.start()
      } catch (e) {
        // Already started, ignore
      }
    }
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    return this.recognition !== null
  }

  /**
   * Start listening for speech
   */
  start(onTranscript: RecognitionCallback, onError?: ErrorCallback): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not available')
      return false
    }

    this.onTranscript = onTranscript
    this.onError = onError || null
    this.shouldRestart = true

    try {
      this.recognition.start()
      return true
    } catch (e) {
      console.error('Failed to start speech recognition:', e)
      return false
    }
  }

  /**
   * Stop listening
   */
  stop() {
    this.shouldRestart = false
    this.onTranscript = null
    this.onError = null
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    this.isListening = false
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening
  }
}

// Singleton instance
export const recognitionService = typeof window !== 'undefined' 
  ? new SpeechRecognitionService() 
  : null

export type { RecognitionCallback, ErrorCallback }
