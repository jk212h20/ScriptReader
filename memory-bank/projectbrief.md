# ScriptReader - Project Brief

## Project Overview
ScriptReader is a smart script companion app that combines AI voice synthesis with real-time speech recognition to facilitate script reading sessions. A single human reader can practice scripts while AI voices fill in other characters automatically.

## Core Requirements

### Primary Features
1. **Script Upload & Parsing**
   - Accept text files, PDFs, and images
   - Use OCR for image-based scripts
   - AI-powered parsing to identify characters, dialogue, and stage directions

2. **Role Assignment**
   - User selects which character(s) they will read
   - Remaining characters assigned to AI voices
   - AI suggests appropriate voices based on character context

3. **Auto-Follow Performance Mode**
   - Real-time speech recognition tracks human reader
   - Automatically detects when human finishes their line
   - AI voices play at exactly the right moment
   - No manual tapping - fully automatic flow

4. **Script Editing**
   - Toggle to enable/disable editing mode
   - Fix OCR errors or parsing mistakes
   - Adjust character assignments

### Technical Requirements
- Works on mobile and desktop (PWA)
- Online connectivity required (for AI APIs)
- Premium voice support (ElevenLabs integration planned)

## User Flow
```
Upload Script → AI Parses → Assign Roles → Configure Voices → Perform → Done
```

## Target User
- Single human reader practicing scripts
- Actors, voice actors, students, hobbyists
- Anyone who wants to read dialogue with AI partners

## Future Considerations
- Optional session recording
- Multiple human readers
- Offline mode with cached voices
