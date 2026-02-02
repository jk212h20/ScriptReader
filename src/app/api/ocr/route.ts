import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const OCR_PROMPT = `Extract all text from this image exactly as written. 
Preserve the original formatting, line breaks, and structure as much as possible.
Include character names, dialogue, stage directions, and any other text visible.
Return ONLY the extracted text, nothing else - no commentary or explanations.`

export async function POST(request: NextRequest) {
  try {
    const { imageData, mediaType, apiKey } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 }
      )
    }

    // Use provided API key or fall back to server environment variable
    const effectiveApiKey = apiKey || process.env.ANTHROPIC_API_KEY
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: effectiveApiKey,
    })

    // Validate media type
    const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const effectiveMediaType = validMediaTypes.includes(mediaType) ? mediaType : 'image/jpeg'

    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: effectiveMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: OCR_PROMPT,
              },
            ],
          },
        ],
      })
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error'
      console.error('Anthropic Vision API error:', errorMessage)
      return NextResponse.json(
        { success: false, error: `Vision API error: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Extract the text content from the response
    const extractedText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : ''

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: 'No text could be extracted from the image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, text: extractedText })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('OCR error:', errorMessage)
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
