# ScriptReader - Active Context

## Current Focus
Setting up the project foundation and Memory Bank documentation.

## Recent Decisions

### Technology Choices
- **Next.js with App Router** - Modern React framework with built-in API routes
- **PWA approach** - Single codebase for mobile and desktop
- **Zustand for state** - Lightweight, simple state management
- **Web Speech API first** - Free tier, upgrade to ElevenLabs later

### Feature Decisions
- **Single human reader** - Focused use case, not multi-user
- **No manual tap to advance** - Must auto-detect when AI should speak
- **Online only** - Required for AI APIs (Claude, future ElevenLabs)
- **Editable scripts** - Toggle button to enable editing mode
- **AI voice suggestions** - Claude picks reasonable defaults by context

## Next Steps

### Immediate (Phase 1)
1. ✅ Create Memory Bank documentation
2. Initialize Next.js project with TypeScript and Tailwind
3. Set up PWA configuration
4. Create file upload component
5. Implement Claude-powered script parsing
6. Build script display and editing UI
7. Create character role assignment interface

### Upcoming (Phase 2)
- Web Speech API TTS integration
- Voice selection UI
- Claude-powered voice suggestions
- Audio playback queue

### Future (Phase 3-4)
- Auto-follow engine with speech recognition
- ElevenLabs premium voices
- Mobile UI optimization

## Active Considerations

### Auto-Follow Challenge
The core technical challenge is detecting when the human finishes their line:
- Use continuous speech recognition
- Match heard words against expected script
- Detect silence to confirm completion
- Need fuzzy matching for imperfect reading

### API Key Management
- User provides their own Anthropic API key
- Store in browser localStorage or settings
- Pass through Next.js API routes for security

## Open Questions
- Best silence detection threshold? (Start with 1.5-2 seconds)
- How to handle stage directions? (Option to skip or read as narration)
- Script storage? (localStorage for MVP, consider cloud sync later)
