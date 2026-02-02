// Text-to-Speech service using Web Speech API

export interface Voice {
  id: string
  name: string
  lang: string
  default: boolean
}

class TTSService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private onEndCallback: (() => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
      this.loadVoices()
      
      // Voices may load asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices()
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices()
    }
  }

  getVoices(): Voice[] {
    return this.voices.map(voice => ({
      id: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      default: voice.default
    }))
  }

  getVoiceById(id: string): SpeechSynthesisVoice | undefined {
    return this.voices.find(v => v.voiceURI === id)
  }

  speak(text: string, voiceId?: string, rate: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not available'))
        return
      }

      // Cancel any ongoing speech
      this.stop()

      const utterance = new SpeechSynthesisUtterance(text)
      
      if (voiceId) {
        const voice = this.getVoiceById(voiceId)
        if (voice) {
          utterance.voice = voice
        }
      }

      utterance.rate = rate
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => {
        this.currentUtterance = null
        if (this.onEndCallback) {
          this.onEndCallback()
        }
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        if (event.error !== 'interrupted') {
          reject(new Error(`Speech error: ${event.error}`))
        } else {
          resolve() // Interrupted is not an error
        }
      }

      this.currentUtterance = utterance
      this.synth.speak(utterance)
    })
  }

  stop() {
    if (this.synth) {
      this.synth.cancel()
      this.currentUtterance = null
    }
  }

  pause() {
    if (this.synth) {
      this.synth.pause()
    }
  }

  resume() {
    if (this.synth) {
      this.synth.resume()
    }
  }

  get isSpeaking(): boolean {
    return this.synth?.speaking ?? false
  }

  get isPaused(): boolean {
    return this.synth?.paused ?? false
  }

  setOnEndCallback(callback: () => void) {
    this.onEndCallback = callback
  }
}

// Singleton instance
export const ttsService = typeof window !== 'undefined' ? new TTSService() : null
