# ScriptReader - Active Context

## Current Focus
Phase 3 Auto-Follow Engine complete! The app now listens to the user and follows along with their reading.

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

### Auto-Follow Implementation (NEW)
- **Word-by-word matching** - Matches spoken words to expected script text
- **Fuzzy matching** - Handles pronunciation variations (30% tolerance)
- **Common substitutions** - Maps "gonna" → "going to", etc.
- **75% completion threshold** - Advances when 75% of words matched
- **0.4 second silence** - Brief pause after completion confirms done
- **Visual feedback** - Word highlighting, progress bar, heard text display

## Next Steps

### Completed (Phase 1) ✅
1. ✅ Create Memory Bank documentation
2. ✅ Initialize Next.js project with TypeScript and Tailwind
3. ✅ Set up PWA configuration (manifest)
4. ✅ Create file upload component
5. ✅ Implement Claude-powered script parsing
6. ✅ Build script display and editing UI
7. ✅ Create character role assignment interface
8. ✅ Settings page for API keys
9. ✅ Push to GitHub & Railway-ready

### Completed (Phase 3 - Auto-Follow Engine) ✅
- ✅ Web Speech API recognition wrapper (`/src/lib/speech/recognition.ts`)
- ✅ Continuous listening mode with auto-restart
- ✅ Fuzzy word matching algorithm (`/src/lib/speech/matcher.ts`)
- ✅ Silence detection (0.4s threshold per user request)
- ✅ Auto-advance logic when line complete
- ✅ Visual progress indicators (progress bar, word highlighting)
- ✅ Manual skip button as fallback

### Next Up (Phase 2 - Voice System Refinement)
- Voice selection UI per character
- Voice preview functionality
- Claude API for voice suggestions

### Future (Phase 4 - Polish)
- ElevenLabs premium voices
- Mobile-responsive design
- Performance optimization

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
