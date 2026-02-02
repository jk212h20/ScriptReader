import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import type { Script, ScriptLine, Character } from '@/types'

const PARSE_PROMPT = `You are a script parser. Analyze the following script text and extract:
1. The title (if present, otherwise generate one from context)
2. All characters who have dialogue
3. Each line of dialogue with the character name and text
4. Stage directions and action descriptions

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Script Title",
  "characters": [
    { "name": "CHARACTER_NAME", "suggestedVoiceType": "description like deep male voice or young female voice" }
  ],
  "lines": [
    { "character": "CHARACTER_NAME", "type": "dialogue", "text": "The line of dialogue" },
    { "character": null, "type": "direction", "text": "Stage direction or action" }
  ]
}

CRITICAL JSON RULES:
- Return ONLY the JSON object, nothing else
- Escape all quotes inside text with backslash: \\"
- Escape all newlines inside text with: \\n
- No trailing commas
- Character names should be normalized (consistent capitalization)
- type can be: "dialogue", "direction", or "action"
- For dialogue, character is the speaker's name
- For directions/actions, character is null
- suggestedVoiceType should be a brief description suitable for text-to-speech voice selection

Script text to parse:
`

export async function POST(request: NextRequest) {
  try {
    const { rawText, apiKey } = await request.json()

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'No script text provided', stage: 'validation' },
        { status: 400 }
      )
    }

    // Use provided API key or fall back to server environment variable
    const effectiveApiKey = apiKey || process.env.ANTHROPIC_API_KEY
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required', stage: 'validation' },
        { status: 401 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: effectiveApiKey,
    })

    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: PARSE_PROMPT + rawText
          },
          {
            role: 'assistant',
            content: '{'
          }
        ]
      })
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error'
      console.error('Anthropic API error:', errorMessage)
      return NextResponse.json(
        { success: false, error: `AI API error: ${errorMessage}`, stage: 'ai_call' },
        { status: 500 }
      )
    }

    // Extract the text content from the response (prepend { since we prefilled it)
    const responseText = message.content[0].type === 'text' 
      ? '{' + message.content[0].text 
      : ''

    if (!responseText || responseText === '{') {
      return NextResponse.json(
        { success: false, error: 'AI returned empty response', stage: 'ai_response' },
        { status: 500 }
      )
    }

    // Parse the JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not find JSON in AI response', stage: 'json_extract' },
        { status: 500 }
      )
    }

    let parsed
    try {
      // First try direct parse
      parsed = JSON.parse(jsonMatch[0])
    } catch (jsonError) {
      // Use jsonrepair to fix malformed JSON
      try {
        const repairedJson = jsonrepair(jsonMatch[0])
        parsed = JSON.parse(repairedJson)
        console.log('JSON repaired successfully')
      } catch (repairError) {
        const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'
        console.error('JSON parse failed even after repair:', errorMessage)
        return NextResponse.json(
          { 
            success: false, 
            error: `JSON parsing failed: ${errorMessage}`, 
            stage: 'json_parse',
            // Include first 500 chars of response for debugging
            debug: jsonMatch[0].substring(0, 500) + '...'
          },
          { status: 500 }
        )
      }
    }

    // Validate parsed structure
    if (!parsed.characters || !Array.isArray(parsed.characters)) {
      return NextResponse.json(
        { success: false, error: 'AI response missing characters array', stage: 'validation' },
        { status: 500 }
      )
    }

    if (!parsed.lines || !Array.isArray(parsed.lines)) {
      return NextResponse.json(
        { success: false, error: 'AI response missing lines array', stage: 'validation' },
        { status: 500 }
      )
    }

    // Generate IDs and build the full Script object
    const scriptId = crypto.randomUUID()
    const now = new Date()

    const characters: Character[] = parsed.characters.map((char: { name: string; suggestedVoiceType?: string }) => ({
      name: char.name,
      assignedTo: 'ai' as const,
      suggestedVoiceType: char.suggestedVoiceType,
    }))

    const lines: ScriptLine[] = parsed.lines.map((line: { character: string | null; type: string; text: string }, index: number) => ({
      id: crypto.randomUUID(),
      index,
      character: line.character,
      type: line.type as 'dialogue' | 'direction' | 'action',
      text: line.text,
      assignedTo: line.character ? 'ai' : 'skip',
    }))

    const script: Script = {
      id: scriptId,
      title: parsed.title || 'Untitled Script',
      rawText,
      lines,
      characters,
      createdAt: now,
      updatedAt: now,
    }

    return NextResponse.json({ success: true, script })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Parse script error:', errorMessage)
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${errorMessage}`, stage: 'unknown' },
      { status: 500 }
    )
  }
}
