import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
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
        { success: false, error: 'No script text provided' },
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

    const message = await anthropic.messages.create({
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

    // Extract the text content from the response (prepend { since we prefilled it)
    const responseText = message.content[0].type === 'text' 
      ? '{' + message.content[0].text 
      : ''

    // Parse the JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse script structure' },
        { status: 500 }
      )
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (jsonError) {
      // Try to fix common JSON issues
      let fixedJson = jsonMatch[0]
        // Remove trailing commas before ] or }
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix unescaped quotes in strings (basic attempt)
        .replace(/([^\\])"/g, (match, p1, offset, str) => {
          // Check if we're inside a string value
          const before = str.substring(0, offset)
          const colonCount = (before.match(/:/g) || []).length
          const openBraceCount = (before.match(/{/g) || []).length
          // This is a heuristic - not perfect but helps
          return match
        })
      
      try {
        parsed = JSON.parse(fixedJson)
      } catch {
        console.error('JSON parse failed even after fix attempt:', jsonError)
        return NextResponse.json(
          { success: false, error: 'Failed to parse AI response as JSON' },
          { status: 500 }
        )
      }
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
    console.error('Parse script error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to parse script' },
      { status: 500 }
    )
  }
}
