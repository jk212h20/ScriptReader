# ScriptReader - Technical Context

## Technology Stack

### Frontend Framework
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **React 18+** for UI components
- **Tailwind CSS** for styling

### PWA Configuration
- Service Worker for offline shell
- Web App Manifest for installability
- Responsive design for mobile/desktop

### Key Libraries

| Purpose | Library | Notes |
|---------|---------|-------|
| State Management | Zustand | Lightweight, simple API |
| PDF Parsing | PDF.js (pdfjs-dist) | Client-side PDF text extraction |
| OCR | Tesseract.js | Client-side image-to-text |
| Audio | Web Audio API | Native browser audio handling |
| Speech Recognition | Web Speech API | Free, browser-native |
| Text-to-Speech | Web Speech API | Free tier, ElevenLabs for premium |
| HTTP Client | fetch / axios | API communication |
| Form Handling | React Hook Form | File uploads, settings |

### External APIs

| Service | Purpose | Auth |
|---------|---------|------|
| Anthropic Claude | Script parsing, voice suggestions | API Key (user-provided) |
| ElevenLabs | Premium TTS voices | API Key (future) |
| Google Vision | Premium OCR (optional) | API Key (future) |

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser with Web Speech API support

### Environment Variables
```env
ANTHROPIC_API_KEY=       # User provides this
ELEVENLABS_API_KEY=      # Future premium feature
```

### Project Structure
```
/src
  /app                   # Next.js App Router pages
    /api                 # API routes (proxies to external APIs)
    /page.tsx            # Home/Upload page
    /script/[id]         # Script editor & role assignment
    /perform/[id]        # Performance mode
    /settings            # API key configuration
  /components            # React components
    /ui                  # Generic UI components
    /script              # Script-specific components
    /audio               # Voice/audio components
  /lib                   # Utilities and helpers
    /parser              # Script parsing logic
    /speech              # Speech recognition/synthesis
    /store               # Zustand stores
  /types                 # TypeScript type definitions
/public                  # Static assets
/memory-bank             # Project documentation
```

## Technical Constraints

### Browser Compatibility
- Web Speech API: Chrome, Edge, Safari (partial)
- Firefox: Limited speech recognition support
- Mobile: iOS Safari has restrictions on audio autoplay

### Performance Considerations
- PDF.js and Tesseract.js are large libraries - lazy load
- Speech recognition is CPU-intensive
- Audio playback needs careful state management

### Security
- API keys stored client-side (user's responsibility)
- Consider server-side proxy for production
- No sensitive data stored permanently

### Deployment
- **Platform**: Railway.app
- **Repository**: https://github.com/jk212h20/ScriptReader.git
- Railway auto-deploys from GitHub on push to main
- Environment variables configured in Railway dashboard

## Dependencies to Install

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "zustand": "^4.0.0",
    "pdfjs-dist": "^4.0.0",
    "tesseract.js": "^5.0.0",
    "@anthropic-ai/sdk": "^0.20.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```
