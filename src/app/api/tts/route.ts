import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Default voice IDs from ElevenLabs library
const DEFAULT_VOICES: Record<string, string> = {
  'male': 'pNInz6obpgDQGcFmaJgB', // Adam
  'female': 'EXAVITQu4vr4xnSDxMaL', // Bella
  'young_male': 'TxGEqnHWrfWFTfGW9XjX', // Josh
  'young_female': 'jBpfuIE2acCO8z3wKNLl', // Gigi
  'old_male': 'VR6AewLTigWG4xSOukaG', // Arnold
  'old_female': 'ThT5KcBeYPX3keUQqHPh', // Dorothy
  'default': 'pNInz6obpgDQGcFmaJgB', // Adam as fallback
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceDescription, voiceId, apiKey } = await request.json()

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      )
    }

    // Use provided API key or fall back to server environment variable
    const effectiveApiKey = apiKey || process.env.ELEVENLABS_API_KEY
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key required' },
        { status: 401 }
      )
    }

    // Determine which voice to use
    let selectedVoiceId = voiceId

    if (!selectedVoiceId && voiceDescription) {
      // Map voice description to a default voice
      const desc = voiceDescription.toLowerCase()
      if (desc.includes('old') || desc.includes('elderly') || desc.includes('aged')) {
        selectedVoiceId = desc.includes('female') || desc.includes('woman') 
          ? DEFAULT_VOICES.old_female 
          : DEFAULT_VOICES.old_male
      } else if (desc.includes('young') || desc.includes('teen') || desc.includes('child')) {
        selectedVoiceId = desc.includes('female') || desc.includes('woman') || desc.includes('girl')
          ? DEFAULT_VOICES.young_female 
          : DEFAULT_VOICES.young_male
      } else if (desc.includes('female') || desc.includes('woman') || desc.includes('girl')) {
        selectedVoiceId = DEFAULT_VOICES.female
      } else if (desc.includes('male') || desc.includes('man') || desc.includes('boy')) {
        selectedVoiceId = DEFAULT_VOICES.male
      } else {
        selectedVoiceId = DEFAULT_VOICES.default
      }
    }

    if (!selectedVoiceId) {
      selectedVoiceId = DEFAULT_VOICES.default
    }

    // Call ElevenLabs TTS API
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': effectiveApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      return NextResponse.json(
        { success: false, error: `ElevenLabs API error: ${response.status}` },
        { status: response.status }
      )
    }

    // Return the audio as a blob
    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('TTS error:', errorMessage)
    return NextResponse.json(
      { success: false, error: `TTS error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET endpoint to list available voices
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'API key required' },
      { status: 401 }
    )
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch voices' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, voices: data.voices })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
