# ScriptReader - System Patterns

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js PWA)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pages/Views:                                               │
│  ├── Home/Upload        - Drop zone for files               │
│  ├── Script Editor      - View/edit parsed script           │
│  ├── Role Assignment    - Assign human vs AI characters     │
│  ├── Voice Config       - Select AI voices per character    │
│  ├── Performance        - Main reading session view         │
│  └── Settings           - API keys, preferences             │
│                                                             │
│  Core Components:                                           │
│  ├── ScriptDisplay      - Teleprompter-style view           │
│  ├── VoiceListener      - Speech recognition handler        │
│  ├── VoiceSpeaker       - TTS playback handler              │
│  ├── FollowEngine       - The brain (matches speech/script) │
│  └── AudioVisualizer    - Shows listening state             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API ROUTES / BACKEND                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /api/parse-script      - Send raw text → Claude parses     │
│  /api/suggest-voices    - Send characters → Claude suggests │
│  /api/tts               - Proxy to ElevenLabs (hides key)   │
│  /api/ocr               - Process images for text           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • Anthropic Claude     - Script parsing, voice suggestions │
│  • ElevenLabs           - High-quality TTS (future)         │
│  • Web Speech API       - Free browser-based STT & TTS      │
│  • Tesseract.js         - Client-side OCR                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Script
```typescript
interface Script {
  id: string;
  title: string;
  rawText: string;
  lines: ScriptLine[];
  characters: Character[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ScriptLine
```typescript
interface ScriptLine {
  id: string;
  index: number;
  character: string | null;  // null for stage directions
  type: 'dialogue' | 'direction' | 'action';
  text: string;
  assignedTo: 'human' | 'ai' | 'skip';
}
```

### Character
```typescript
interface Character {
  name: string;
  assignedTo: 'human' | 'ai';
  voiceId?: string;           // ElevenLabs voice ID or Web Speech voice
  voiceSettings?: {
    pitch: number;            // 0-2, default 1
    rate: number;             // 0.1-10, default 1
    volume: number;           // 0-1, default 1
  };
  suggestedVoiceType?: string; // AI suggestion: "deep male", "young female", etc.
}
```

### PerformanceState
```typescript
interface PerformanceState {
  scriptId: string;
  currentLineIndex: number;
  status: 'idle' | 'listening' | 'speaking' | 'paused';
  recognizedText: string;
  matchConfidence: number;    // 0-1, how much of current line matched
  error?: string;
}
```

## Key Design Patterns

### 1. Auto-Follow Algorithm

```
┌─────────────────────────────────────────────────────────────┐
│                    PERFORMANCE MODE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Script State: Know which line we're on                  │
│                   Know if it's HUMAN or AI line             │
│                                                             │
│  2. If HUMAN line:                                          │
│     - Listen via Web Speech API (continuous)                │
│     - Match heard words against expected line               │
│     - Track confidence: "they said 80% of the line"         │
│     - Detect silence (VAD) → they're done                   │
│     - ADVANCE to next line                                  │
│                                                             │
│  3. If AI line:                                             │
│     - Immediately play TTS                                  │
│     - When audio ends → ADVANCE to next line                │
│     - (If multiple consecutive AI lines, chain them)        │
│                                                             │
│  4. Visual feedback:                                        │
│     - Highlight current line                                │
│     - Show "listening" indicator                            │
│     - Show progress through human's line (word highlighting)│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Line Matching Strategy

```typescript
// Fuzzy matching approach
function matchLine(heard: string, expected: string): number {
  // Normalize both strings
  const heardWords = normalize(heard).split(' ');
  const expectedWords = normalize(expected).split(' ');
  
  // Count matching words (order-aware but flexible)
  let matches = 0;
  let expectedIndex = 0;
  
  for (const word of heardWords) {
    // Look for word in remaining expected words
    const foundIndex = expectedWords.slice(expectedIndex).findIndex(
      w => fuzzyMatch(w, word)
    );
    if (foundIndex !== -1) {
      matches++;
      expectedIndex += foundIndex + 1;
    }
  }
  
  return matches / expectedWords.length; // 0-1 confidence
}
```

### 3. State Management (Zustand)

```typescript
// Separate stores for different concerns
const useScriptStore = create<ScriptStore>(...);      // Script data
const usePerformanceStore = create<PerformanceStore>(...); // Performance state
const useSettingsStore = create<SettingsStore>(...);  // User preferences
```

### 4. Component Composition

```
<PerformancePage>
  <ScriptDisplay>
    <ScriptLine /> (many)
  </ScriptDisplay>
  <PerformanceControls>
    <PlayPauseButton />
    <ResyncButton />
    <VolumeControl />
  </PerformanceControls>
  <VoiceListener />      {/* Hidden, handles recognition */}
  <VoiceSpeaker />       {/* Hidden, handles TTS */}
  <FollowEngine />       {/* Hidden, orchestrates everything */}
</PerformancePage>
```

## Error Handling Patterns

### Speech Recognition Failures
- Retry automatically on transient errors
- Show "Having trouble hearing you" message
- Offer manual resync option

### TTS Failures
- Fall back to Web Speech API if ElevenLabs fails
- Queue retry for network errors
- Skip line option for persistent failures

### Script Parsing Failures
- Show raw text with manual editing option
- Highlight unparseable sections
- Allow user to manually assign characters
